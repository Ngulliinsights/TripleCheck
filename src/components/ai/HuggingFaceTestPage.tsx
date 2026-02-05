/**
 * Hugging Face AI Test Page
 * Wrapper page component for the test panel
 */

import React from 'react'
import { HuggingFaceTestPanel } from './HuggingFaceTestPanel'

const HuggingFaceTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HuggingFaceTestPanel />
    </div>
  );
};

export default HuggingFaceTestPage;