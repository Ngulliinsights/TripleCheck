import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { User, Shield, Copy, Check } from 'lucide-react';
import React, { useState } from 'react';

import { Logo } from './ui/logo';

interface DemoAccount {
  username: string;
  password: string;
  role: string;
  trustScore: number;
  description: string;
  isAgent: boolean;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: 'demo_user',
    password: import.meta.env.VITE_DEMO_USER_PASSWORD || 'demo123',
    role: 'Tenant',
    trustScore: 750,
    description: 'Regular user looking for properties',
    isAgent: false
  },
  {
    username: 'demo_agent',
    password: import.meta.env.VITE_DEMO_AGENT_PASSWORD || 'agent123',
    role: 'Verified Agent',
    trustScore: 950,
    description: 'Verified real estate agent',
    isAgent: true
  },
  {
    username: 'john_tenant',
    password: import.meta.env.VITE_DEMO_USER_PASSWORD || 'demo123',
    role: 'Tenant',
    trustScore: 750,
    description: 'Experienced tenant with good history',
    isAgent: false
  },
  {
    username: 'sarah_agent',
    password: import.meta.env.VITE_DEMO_AGENT_PASSWORD || 'agent123',
    role: 'Verified Agent',
    trustScore: 950,
    description: 'Top-rated property agent',
    isAgent: true
  }
];

interface DemoLoginHelperProps {
  onLogin?: (username: string, password: string) => void;
  className?: string;
}

export function DemoLoginHelper({ onLogin, className }: DemoLoginHelperProps) {
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const copyCredentials = async (account: DemoAccount) => {
    const credentials = `Username: ${account.username}\nPassword: ${account.password}`;
    
    try {
      await navigator.clipboard.writeText(credentials);
      setCopiedAccount(account.username);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      console.log('Credentials:', credentials);
    }
  };

  const handleQuickLogin = (account: DemoAccount) => {
    if (onLogin) {
      onLogin(account.username, account.password);
    }
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Demo Accounts for Testing
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Use these pre-configured accounts to test the application features
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {DEMO_ACCOUNTS.map((account) => (
            <div
              key={account.username}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{account.username}</span>
                  {account.isAgent && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified Agent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {account.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Role: {account.role}</span>
                  <span>Trust Score: {account.trustScore}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyCredentials(account)}
                  className="flex items-center gap-1"
                >
                  {copiedAccount === account.username ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
                
                {onLogin && (
                  <Button
                    size="sm"
                    onClick={() => handleQuickLogin(account)}
                    className="bg-customSecondary hover:bg-customSecondaryHover"
                  >
                    Quick Login
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Testing Features:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Regular Users:</strong> Can search properties, leave reviews, view details</li>
            <li>• <strong>Verified Agents:</strong> Can list properties, access advanced features</li>
            <li>• <strong>Trust Scores:</strong> Affect transaction limits and verification status</li>
            <li>• <strong>Search:</strong> Try "apartment", "Nairobi", "luxury", "beach"</li>
          </ul>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> These are demo accounts for testing purposes only. 
            In production, use secure passwords and proper authentication.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}