declare module 'exif-parser' {
  interface ExifData {
    tags?: {
      DateTime?: number;
      DateTimeOriginal?: number;
      DateTimeDigitized?: number;
      Software?: string;
      Artist?: string;
      Copyright?: string;
      Make?: string;
      Model?: string;
      ImageWidth?: number;
      ImageHeight?: number;
      XResolution?: number;
      YResolution?: number;
      ColorSpace?: number;
      GPS?: any;
      [key: string]: any;
    };
  }

  interface ExifParser {
    parse(): ExifData;
  }

  function create(buffer: Buffer): ExifParser;

  export { create, ExifParser, ExifData };
}