import React, { ReactNode } from 'react';
import { AuthProvider } from '@auth/contexts/AuthContext';
import { PropertyProvider } from '@property/contexts/PropertyContext';
import { TrustProvider } from '@trust/contexts/TrustContext';
import { ThemeProvider } from '@shared/contexts/ThemeContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <PropertyProvider>
          <TrustProvider>
            {children}
          </TrustProvider>
        </PropertyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};