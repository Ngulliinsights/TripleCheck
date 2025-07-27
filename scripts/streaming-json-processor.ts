/**
 * Streaming JSON Processor
 * Handles large JSON files by processing them in chunks to avoid memory issues
 */

import { Transform } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export interface StreamingOptions {
  chunkSize?: number;
  encoding?: BufferEncoding;
  highWaterMark?: number;
}

export class StreamingJSONProcessor {
  private options: Required<StreamingOptions>;

  constructor(options: StreamingOptions = {}) {
    this.options = {
      chunkSize: options.chunkSize || 1000,
      encoding: options.encoding || 'utf8',
      highWaterMark: options.highWaterMark || 16 * 1024, // 16KB
    };
  }

  /**
   * Process a JSON array file in chunks
   */
  async processJSONArray<T>(
    inputPath: string,
    processor: (items: T[]) => Promise<void> | void,
    outputPath?: string
  ): Promise<void> {
    const readStream = createReadStream(inputPath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.highWaterMark,
    });

    let buffer = '';
    let itemCount = 0;
    let currentChunk: T[] = [];
    let inArray = false;
    let bracketDepth = 0;
    let inString = false;
    let escapeNext = false;

    const processChunk = async () => {
      if (currentChunk.length > 0) {
        await processor(currentChunk);
        itemCount += currentChunk.length;
        currentChunk = [];
      }
    };

    const writeStream = outputPath ? createWriteStream(outputPath) : null;
    if (writeStream) {
      writeStream.write('[');
    }

    const transform = new Transform({
      objectMode: false,
      transform: async (chunk: Buffer, _encoding, callback) => {
        try {
          buffer += chunk.toString();
          
          let i = 0;
          while (i < buffer.length) {
            const char = buffer[i];
            
            if (escapeNext) {
              escapeNext = false;
              i++;
              continue;
            }
            
            if (char === '\\' && inString) {
              escapeNext = true;
              i++;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
            }
            
            if (!inString) {
              if (char === '[') {
                inArray = true;
                bracketDepth++;
              } else if (char === ']') {
                bracketDepth--;
                if (bracketDepth === 0) {
                  inArray = false;
                }
              } else if (char === '{' && inArray) {
                bracketDepth++;
              } else if (char === '}' && inArray) {
                bracketDepth--;
                
                // Check if we've completed an object at the array level
                if (bracketDepth === 1) {
                  // Find the start of this object
                  let objectStart = i;
                  let objectBrackets = 1;
                  
                  while (objectStart > 0 && objectBrackets > 0) {
                    objectStart--;
                    if (buffer[objectStart] === '}' && !this.isInString(buffer, objectStart)) {
                      objectBrackets++;
                    } else if (buffer[objectStart] === '{' && !this.isInString(buffer, objectStart)) {
                      objectBrackets--;
                    }
                  }
                  
                  try {
                    const objectStr = buffer.substring(objectStart, i + 1);
                    const parsedObject = JSON.parse(objectStr) as T;
                    currentChunk.push(parsedObject);
                    
                    if (currentChunk.length >= this.options.chunkSize) {
                      await processChunk();
                    }
                  } catch (parseError) {
                    // Skip invalid JSON objects
                    console.warn('Failed to parse JSON object:', parseError);
                  }
                }
              }
            }
            
            i++;
          }
          
          // Keep the last part of the buffer for the next chunk
          const lastCompleteObject = buffer.lastIndexOf('}');
          if (lastCompleteObject > -1 && lastCompleteObject < buffer.length - 1) {
            buffer = buffer.substring(lastCompleteObject + 1);
          } else if (!inArray) {
            buffer = '';
          }
          
          callback();
        } catch (error) {
          callback(error);
        }
      },
      
      flush: async (callback) => {
        try {
          // Process any remaining items
          await processChunk();
          
          if (writeStream) {
            writeStream.write(']');
            writeStream.end();
          }
          
          console.log(`Processed ${itemCount} items total`);
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });

    await pipeline(readStream, transform);
  }

  /**
   * Check if a character position is inside a string
   */
  private isInString(buffer: string, position: number): boolean {
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < position; i++) {
      const char = buffer[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
      }
    }
    
    return inString;
  }

  /**
   * Process a JSON Lines file (one JSON object per line)
   */
  async processJSONLines<T>(
    inputPath: string,
    processor: (items: T[]) => Promise<void> | void
  ): Promise<void> {
    const readStream = createReadStream(inputPath, {
      encoding: this.options.encoding,
    });

    let buffer = '';
    let currentChunk: T[] = [];
    let lineCount = 0;

    const processChunk = async () => {
      if (currentChunk.length > 0) {
        await processor(currentChunk);
        lineCount += currentChunk.length;
        currentChunk = [];
      }
    };

    const transform = new Transform({
      objectMode: false,
      transform: async (chunk: Buffer, _encoding, callback) => {
        try {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          
          // Keep the last line in buffer (might be incomplete)
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              try {
                const parsedObject = JSON.parse(trimmedLine) as T;
                currentChunk.push(parsedObject);
                
                if (currentChunk.length >= this.options.chunkSize) {
                  await processChunk();
                }
              } catch (parseError) {
                console.warn('Failed to parse JSON line:', parseError);
              }
            }
          }
          
          callback();
        } catch (error) {
          callback(error);
        }
      },
      
      flush: async (callback) => {
        try {
          // Process the last line if it exists
          if (buffer.trim()) {
            try {
              const parsedObject = JSON.parse(buffer.trim()) as T;
              currentChunk.push(parsedObject);
            } catch (parseError) {
              console.warn('Failed to parse final JSON line:', parseError);
            }
          }
          
          // Process any remaining items
          await processChunk();
          
          console.log(`Processed ${lineCount} lines total`);
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });

    await pipeline(readStream, transform);
  }

  /**
   * Convert a large JSON array to JSON Lines format
   */
  async convertArrayToLines(inputPath: string, outputPath: string): Promise<void> {
    const writeStream = createWriteStream(outputPath);
    let isFirst = true;

    await this.processJSONArray(
      inputPath,
      async (items) => {
        for (const item of items) {
          if (!isFirst) {
            writeStream.write('\n');
          }
          writeStream.write(JSON.stringify(item));
          isFirst = false;
        }
      }
    );

    writeStream.end();
  }

  /**
   * Get statistics about a JSON file
   */
  async getFileStats(inputPath: string): Promise<{
    totalItems: number;
    fileSize: number;
    estimatedMemoryUsage: number;
  }> {
    const fs = await import('fs/promises');
    const stats = await fs.stat(inputPath);
    
    let totalItems = 0;
    
    await this.processJSONArray(
      inputPath,
      async (items) => {
        totalItems += items.length;
      }
    );

    return {
      totalItems,
      fileSize: stats.size,
      estimatedMemoryUsage: stats.size * 2, // Rough estimate
    };
  }
}

// Export default instance
export const streamingProcessor = new StreamingJSONProcessor();