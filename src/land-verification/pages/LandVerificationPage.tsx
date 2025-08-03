import React from 'react';
import { Routes, Route } from 'react-router-dom';

import LandVerificationDashboardPage from './LandVerificationDashboardPage';
import NewVerificationPage from './NewVerificationPage';

export function LandVerificationPage() {
  return (
    <Routes>
      <Route index element={<LandVerificationDashboardPage />} />
      <Route path="new" element={<NewVerificationPage />} />
      <Route path="session/:sessionId" element={<LandVerificationDashboardPage />} />
    </Routes>
  );
}

export default LandVerificationPage;