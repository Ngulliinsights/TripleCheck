/**
 * Test Panel for Hugging Face AI Features
 * Demonstrates various AI capabilities for land verification
 * 
 * This component provides a comprehensive testing interface for various AI services
 * used in land verification processes, with proper TypeScript safety and error handling.
 */

import React, { useState } from 'react'
import { landVerificationAI } from "../../shared/services/unified-api-client"
import { mockLandVerificationAI, sampleTestData } from '../../shared/services/mock-huggingface-client'

// Define our test result interface with proper optional handling
interface TestResult {
  type: string;
  result: any;
  timestamp: Date;
  error?: string; // Optional error field
}

export const HuggingFaceTestPanel: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(true);
  const [testText, setTestText] = useState(sampleTestData.propertyDescriptions[0]);
  const [testImage, setTestImage] = useState<string>('');
  
  // Choose AI client based on mock toggle - this allows for easy switching between mock and live data
  const aiClient = useMockData ? mockLandVerificationAI : landVerificationAI;

  /**
   * Adds a test result to our results array with proper type safety
   * We use function overloading concept here to handle both success and error cases cleanly
   */
  const addResult = (type: string, result: any, error?: string): void => {
    setResults(prev => [...prev, {
      type,
      result,
      timestamp: new Date(),
      // Only include error property if error is provided and not undefined
      ...(error !== undefined && { error })
    }]);
  };

  /**
   * Handles file upload with proper error checking and type safety
   * FileReader API requires careful handling of potential null/undefined values
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Safely handle the FileReader result which could be null
        const result = e.target?.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1]; // Remove data:image/... prefix
          setTestImage(base64 || ''); // Ensure we never set undefined
        }
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Document classification test - identifies legal document types
   * This is often the first step in document processing workflows
   */
  const testDocumentClassification = async (): Promise<void> => {
    setLoading('document-classification');
    try {
      // Ensure we have valid text before proceeding - this satisfies TypeScript's strictness
      const textToAnalyze = testText || '';
      const result = await aiClient.classifyLegalDocument(textToAnalyze);
      addResult('Document Classification', result); // No error, so don't pass error parameter
    } catch (error) {
      // Properly handle error types - error could be any type, so we check
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addResult('Document Classification', null, errorMessage);
    } finally {
      // Always clear loading state, regardless of success or failure
      setLoading(null);
    }
  };

  /**
   * Sentiment analysis test - analyzes emotional tone of property reviews
   * This helps identify potentially problematic properties or positive indicators
   */
  const testSentimentAnalysis = async (): Promise<void> => {
    setLoading('sentiment');
    try {
      // Ensure we have valid text before proceeding
      const textToAnalyze = testText || '';
      const result = await aiClient.analyzePropertyReview(textToAnalyze);
      addResult('Sentiment Analysis', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addResult('Sentiment Analysis', null, errorMessage);
    } finally {
      setLoading(null);
    }
  };

  /**
   * Translation test - converts property descriptions to different languages
   * Useful for international property markets and multi-language documentation
   */
  const testTranslation = async (): Promise<void> => {
    setLoading('translation');
    try {
      // Ensure we have valid text before proceeding
      const textToAnalyze = testText || '';
      const result = await aiClient.translatePropertyDescription(textToAnalyze, 'es');
      addResult('Translation (English to Spanish)', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addResult('Translation', null, errorMessage);
    } finally {
      setLoading(null);
    }
  };

  /**
   * Question answering test - extracts specific information from documents
   * This simulates how users might query documents for specific property details
   */
  const testQuestionAnswering = async (): Promise<void> => {
    setLoading('qa');
    try {
      // Ensure we have valid text before proceeding
      const textToAnalyze = testText || '';
      const result = await aiClient.extractPropertyDetails(
        textToAnalyze,
        'What is the property value?'
      );
      addResult('Question Answering', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addResult('Question Answering', null, errorMessage);
    } finally {
      setLoading(null);
    }
  };

  /**
   * Document summarization test - creates concise summaries of lengthy documents
   * Essential for quickly understanding large legal documents or property reports
   */
  const testSummarization = async (): Promise<void> => {
    setLoading('summary');
    try {
      // Ensure we have valid text before proceeding
      const textToAnalyze = testText || '';
      const result = await aiClient.summarizeDocument(textToAnalyze);
      addResult('Document Summarization', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addResult('Summarization', null, errorMessage);
    } finally {
      setLoading(null);
    }
  };

  /**
   * Fraud detection test - identifies potential fraudulent elements in documents
   * Critical for maintaining trust and security in property transactions
   */
  const testFraudDetection = async (): Promise<void> => {
    setLoading('fraud');
    try {
      // Ensure we have valid text before proceeding
      const textToAnalyze = testText || '';
      const result = await aiClient.checkDocumentAuthenticity(textToAnalyze);
      addResult('Fraud Detection', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addResult('Fraud Detection', null, errorMessage);
    } finally {
      setLoading(null);
    }
  };

  /**
   * Image analysis test - analyzes satellite or aerial images for land features
   * Helps verify property boundaries, land use, and geographical features
   */
  const testImageAnalysis = async (): Promise<void> => {
    // Validate prerequisites before proceeding
    if (!testImage && !useMockData) {
      alert('Please upload an image first');
      return;
    }
    
    setLoading('image');
    try {
      // Use the uploaded image or a mock placeholder when in mock mode
      const imageToAnalyze = testImage || 'mock_image';
      const result = await aiClient.analyzeLandImage(imageToAnalyze);
      addResult('Land Image Analysis', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addResult('Image Analysis', null, errorMessage);
    } finally {
      setLoading(null);
    }
  };

  /**
   * OCR and document analysis test - extracts text from property document images
   * Combines optical character recognition with intelligent document understanding
   */
  const testDocumentOCR = async (): Promise<void> => {
    // Validate prerequisites before proceeding
    if (!testImage && !useMockData) {
      alert('Please upload an image first');
      return;
    }
    
    setLoading('ocr');
    try {
      // Use the uploaded image or a mock placeholder when in mock mode
      const imageToAnalyze = testImage || 'mock_image';
      const result = await aiClient.analyzePropertyDocument(imageToAnalyze, 'deed');
      addResult('Document OCR & Analysis', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addResult('Document OCR', null, errorMessage);
    } finally {
      setLoading(null);
    }
  };

  /**
   * Clears all test results from the display
   * Useful for starting fresh testing sessions
   */
  const clearResults = (): void => {
    setResults([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Hugging Face AI Test Panel</h2>
            <p className="text-gray-600">
              Test various AI capabilities for land verification processes
            </p>
          </div>
          
          {/* Mode toggle controls - allows switching between mock and live API modes */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useMockData}
                onChange={(e) => setUseMockData(e.target.checked)}
                className="rounded"
                aria-label="Toggle mock data mode"
              />
              <span className="text-sm font-medium">Use Mock Data</span>
            </label>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              useMockData ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {useMockData ? 'MOCK MODE' : 'LIVE API'}
            </div>
          </div>
        </div>

        {/* Input Section - provides sample data and file upload capabilities */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="test-text" className="block text-sm font-medium">Test Text:</label>
              {/* Quick load buttons for common test scenarios */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setTestText(sampleTestData.propertyDescriptions[0])}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                >
                  Load Deed
                </button>
                <button
                  type="button"
                  onClick={() => setTestText(sampleTestData.propertyDescriptions[1])}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                >
                  Load Survey
                </button>
                <button
                  type="button"
                  onClick={() => setTestText(sampleTestData.propertyReviews[0])}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                >
                  Load Review
                </button>
              </div>
            </div>
            <textarea
              id="test-text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter property description or legal document text..."
            />
          </div>

          {/* File upload section for image-based tests */}
          <div>
            <label htmlFor="test-image" className="block text-sm font-medium mb-2">
              Test Image (for OCR/Analysis):
            </label>
            <input
              id="test-image"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {testImage && (
              <p className="text-sm text-green-600 mt-1">✓ Image uploaded successfully</p>
            )}
          </div>
        </div>

        {/* Test Buttons Grid - organized by functionality type */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            type="button"
            onClick={testDocumentClassification}
            disabled={loading === 'document-classification'}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading === 'document-classification' ? 'Testing...' : 'Classify Document'}
          </button>

          <button
            type="button"
            onClick={testSentimentAnalysis}
            disabled={loading === 'sentiment'}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading === 'sentiment' ? 'Testing...' : 'Analyze Sentiment'}
          </button>

          <button
            type="button"
            onClick={testTranslation}
            disabled={loading === 'translation'}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading === 'translation' ? 'Testing...' : 'Translate Text'}
          </button>

          <button
            type="button"
            onClick={testQuestionAnswering}
            disabled={loading === 'qa'}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading === 'qa' ? 'Testing...' : 'Extract Info'}
          </button>

          <button
            type="button"
            onClick={testSummarization}
            disabled={loading === 'summary'}
            className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading === 'summary' ? 'Testing...' : 'Summarize'}
          </button>

          <button
            type="button"
            onClick={testFraudDetection}
            disabled={loading === 'fraud'}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading === 'fraud' ? 'Testing...' : 'Detect Fraud'}
          </button>

          <button
            type="button"
            onClick={testImageAnalysis}
            disabled={loading === 'image' || (!testImage && !useMockData)}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading === 'image' ? 'Testing...' : 'Analyze Image'}
          </button>

          <button
            type="button"
            onClick={testDocumentOCR}
            disabled={loading === 'ocr' || (!testImage && !useMockData)}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading === 'ocr' ? 'Testing...' : 'OCR Document'}
          </button>
        </div>

        {/* Results Section Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Test Results</h3>
          <button
            type="button"
            onClick={clearResults}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear Results
          </button>
        </div>

        {/* Results Display Area - shows test outputs with proper error handling */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No test results yet. Try running some tests above to see how the AI responds!
            </p>
          ) : (
            results.map((result, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{result.type}</h4>
                  <span className="text-xs text-gray-500">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                {/* Conditional rendering based on whether there's an error */}
                {result.error ? (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                    <strong>Error:</strong> {result.error}
                  </div>
                ) : (
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto bg-white p-2 rounded border">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Usage Instructions Panel - helps users understand each feature */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">How to Use This Testing Panel</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div><strong>Document Classification:</strong> Automatically identifies document types such as property deeds, surveys, building permits, and legal contracts. This helps organize and route documents through appropriate processing workflows.</div>
          
          <div><strong>Sentiment Analysis:</strong> Analyzes property reviews, feedback, and descriptions to determine positive, negative, or neutral sentiment. This helps identify potential issues or highlights before making property decisions.</div>
          
          <div><strong>Translation Services:</strong> Converts property descriptions and legal documents between different languages, making international property transactions more accessible and understandable.</div>
          
          <div><strong>Information Extraction:</strong> Answers specific questions about property details by intelligently parsing through document content. Ask about values, locations, ownership, or any specific details mentioned in the text.</div>
          
          <div><strong>Document Summarization:</strong> Creates concise, readable summaries of lengthy legal documents, property reports, and contracts, helping you quickly understand key points without reading entire documents.</div>
          
          <div><strong>Fraud Detection:</strong> Analyzes documents for potential fraud indicators, inconsistencies, or suspicious elements that might indicate document tampering or false information.</div>
          
          <div><strong>Image Analysis:</strong> Examines satellite images, aerial photographs, and property photos to identify land features, boundaries, structures, and geographical characteristics relevant to property verification.</div>
          
          <div><strong>OCR Document Processing:</strong> Extracts text from photographed or scanned property documents, then analyzes the extracted content for relevant information and insights.</div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100 rounded border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-800">
            <strong>Development Note:</strong> This panel uses free Hugging Face inference APIs for testing purposes. In a production environment, consider upgrading to paid API keys for enhanced rate limits, improved reliability, and access to more advanced models.
          </p>
        </div>
      </div>
    </div>
  );
};