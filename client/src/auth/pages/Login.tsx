import React from 'react'
import { useNavigate } from 'react-router-dom'

import { Card, CardContent } from '../../local/components/ui/card'
import { LoginForm } from '../components/LoginForm'
import { User } from '@shared/types/auth.types'

export default function Login() {
  const navigate = useNavigate();

  const handleLoginSuccess = (user: User) => {
    // Redirect based on user role or to dashboard
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    navigate(redirectPath);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <LoginForm
            onSuccess={handleLoginSuccess}
            showSocialLogin={true}
            enableTwoFactor={true}
            enableBiometric={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}