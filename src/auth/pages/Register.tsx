import React from 'react';
import { useNavigate } from 'react-router-dom';

import { RegistrationWizard } from '../components/RegistrationWizard';
import { RegisterData } from '../types/auth.types';

export default function Register() {
  const navigate = useNavigate();

  const handleRegistrationComplete = (userData: RegisterData) => {
    // Redirect to email verification page or dashboard
    navigate('/auth/verify-email', { 
      state: { email: userData.email } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <RegistrationWizard 
        onComplete={handleRegistrationComplete}
        allowSkipOptional={true}
      />
    </div>
  );
}