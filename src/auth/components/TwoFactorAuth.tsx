import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Key, 
  QrCode, 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert, AlertDescription } from '../../shared/components/ui/alert'
import { Badge } from '../../shared/components/ui/badge'
import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '../../shared/components/ui/form'
import { Input } from '../../shared/components/ui/input'
import { Logo } from '../../shared/components/ui/logo'
import { Separator } from '../../shared/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'
import { User } from '../types/auth.types'

// Validation schemas
const verificationSchema = z.object({
  code: z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must contain only numbers'),
});

const setupSchema = z.object({
  verificationCode: z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must contain only numbers'),
});

type VerificationFormData = z.infer<typeof verificationSchema>;
type SetupFormData = z.infer<typeof setupSchema>;

export interface TwoFactorAuthProps {
  user: User;
  onVerified: () => void;
  methods?: ('sms' | 'email' | 'authenticator')[];
  mode?: 'setup' | 'verify';
  className?: string;
}

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

interface TwoFactorMethod {
  id: 'sms' | 'email' | 'authenticator';
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export function TwoFactorAuth({
  user,
  onVerified,
  methods = ['sms', 'email', 'authenticator'],
  mode = 'verify',
  className = '',
}: TwoFactorAuthProps) {
  const [currentMethod, setCurrentMethod] = useState<'sms' | 'email' | 'authenticator'>('authenticator');
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [backupCodesVisible, setBackupCodesVisible] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  const setupForm = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      verificationCode: '',
    },
  });

  // Available 2FA methods
  const availableMethods: TwoFactorMethod[] = [
    {
      id: 'authenticator',
      name: 'Authenticator App',
      description: 'Use Google Authenticator, Authy, or similar apps',
      icon: <Smartphone className="w-5 h-5" />,
      enabled: methods.includes('authenticator'),
    },
    {
      id: 'sms',
      name: 'SMS',
      description: 'Receive codes via text message',
      icon: <Smartphone className="w-5 h-5" />,
      enabled: methods.includes('sms'),
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Receive codes via email',
      icon: <Mail className="w-5 h-5" />,
      enabled: methods.includes('email'),
    },
  ];

  // Initialize 2FA setup
  useEffect(() => {
    if (mode === 'setup' && currentMethod === 'authenticator') {
      initializeAuthenticatorSetup();
    }
  }, [mode, currentMethod]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Initialize authenticator setup
  const initializeAuthenticatorSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'authenticator' }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize 2FA setup');
      }

      const data = await response.json();
      setSetupData(data.data);
    } catch (error) {
      setError('Failed to initialize 2FA setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send verification code
  const sendVerificationCode = async (method: 'sms' | 'email') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/2fa/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification code');
      }

      setSuccess(`Verification code sent to your ${method === 'sms' ? 'phone' : 'email'}`);
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      setError(`Failed to send verification code. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 2FA code
  const verifyCode = async (data: VerificationFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.code,
          method: currentMethod,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      const result = await response.json();
      if (result.success) {
        onVerified();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete 2FA setup
  const completeSetup = async (data: SetupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.verificationCode,
          method: currentMethod,
          secret: setupData?.secret,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete 2FA setup');
      }

      setSuccess('Two-factor authentication has been successfully enabled!');
      setTimeout(() => onVerified(), 2000);
    } catch (error) {
      setError('Invalid verification code. Please check your authenticator app and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const content = `TripleCheck Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\nUser: ${user.email}\n\nBackup Codes (use each code only once):\n${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nKeep these codes in a safe place. You can use them to access your account if you lose access to your authenticator device.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triplecheck-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Logo size="xl" variant="default" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'setup' ? 'Set Up Two-Factor Authentication' : 'Two-Factor Authentication'}
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          {mode === 'setup' 
            ? 'Secure your account with an additional layer of protection'
            : 'Enter your verification code to continue'
          }
        </p>
      </div>

      {/* Method Selection */}
      {availableMethods.filter(m => m.enabled).length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Choose Verification Method</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={currentMethod} onValueChange={(value) => setCurrentMethod(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                {availableMethods.filter(m => m.enabled).map((method) => (
                  <TabsTrigger key={method.id} value={method.id} className="flex items-center gap-2">
                    {method.icon}
                    <span className="hidden sm:inline">{method.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Authenticator App Setup/Verification */}
          {currentMethod === 'authenticator' && (
            <>
              {mode === 'setup' ? (
                <div className="space-y-6">
                  {/* Step 1: Install App */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                      Install an Authenticator App
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Download and install one of these authenticator apps:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 border rounded">Google Authenticator</div>
                      <div className="p-2 border rounded">Microsoft Authenticator</div>
                      <div className="p-2 border rounded">Authy</div>
                      <div className="p-2 border rounded">1Password</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Step 2: Scan QR Code */}
                  {setupData && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                        Scan QR Code
                      </h3>
                      <div className="text-center mb-4">
                        <div className="inline-block p-4 bg-white border rounded-lg">
                          <QRCodeSVG value={setupData.qrCodeUrl} size={200} />
                        </div>
                      </div>
                      
                      {/* Manual Entry Option */}
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setBackupCodesVisible(!backupCodesVisible)}
                        >
                          Can't scan? Enter code manually
                        </Button>
                      </div>

                      {backupCodesVisible && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium mb-2">Manual Entry Key:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 bg-white border rounded text-sm font-mono break-all">
                              {setupData.manualEntryKey}
                            </code>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(setupData.manualEntryKey, 'secret')}
                            >
                              {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Step 3: Verify Setup */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                      Verify Setup
                    </h3>
                    <Form {...setupForm}>
                      <form onSubmit={setupForm.handleSubmit(completeSetup)} className="space-y-4">
                        <FormField
                          control={setupForm.control}
                          name="verificationCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Enter the 6-digit code from your authenticator app</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="000000"
                                  maxLength={6}
                                  {...field}
                                  className="text-center text-lg tracking-widest"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? 'Verifying...' : 'Complete Setup'}
                        </Button>
                      </form>
                    </Form>
                  </div>

                  {/* Backup Codes */}
                  {setupData?.backupCodes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Key className="w-5 h-5" />
                          Backup Codes
                        </h3>
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="mt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                            {setupData.backupCodes.map((code, index) => (
                              <div key={index} className="font-mono text-sm text-center p-2 bg-white rounded border">
                                {code}
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'backup')}
                              className="flex-1"
                            >
                              {copiedBackupCodes ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                              Copy Codes
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={downloadBackupCodes}
                              className="flex-1"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Verification Mode
                <Form {...verificationForm}>
                  <form onSubmit={verificationForm.handleSubmit(verifyCode)} className="space-y-4">
                    <FormField
                      control={verificationForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enter the 6-digit code from your authenticator app</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000000"
                              maxLength={6}
                              {...field}
                              className="text-center text-lg tracking-widest"
                            />
                          </FormControl>
                          <FormDescription>
                            Open your authenticator app and enter the current code
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </Button>
                  </form>
                </Form>
              )}
            </>
          )}

          {/* SMS/Email Verification */}
          {(currentMethod === 'sms' || currentMethod === 'email') && (
            <div className="space-y-4">
              {mode === 'setup' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    We'll send a verification code to your {currentMethod === 'sms' ? 'phone number' : 'email address'} each time you sign in.
                  </AlertDescription>
                </Alert>
              )}

              <Form {...verificationForm}>
                <form onSubmit={verificationForm.handleSubmit(verifyCode)} className="space-y-4">
                  <FormField
                    control={verificationForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Enter the 6-digit code sent to your {currentMethod === 'sms' ? 'phone' : 'email'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000000"
                            maxLength={6}
                            {...field}
                            className="text-center text-lg tracking-widest"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </Button>
                </form>
              </Form>

              {/* Resend Code */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => sendVerificationCode(currentMethod)}
                  disabled={resendCooldown > 0 || isLoading}
                >
                  {resendCooldown > 0 ? (
                    `Resend code in ${resendCooldown}s`
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recovery Options */}
      {mode === 'verify' && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Having trouble accessing your codes?
          </p>
          <div className="space-x-4">
            <Button variant="ghost" size="sm">
              Use Backup Code
            </Button>
            <Button variant="ghost" size="sm">
              Contact Support
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TwoFactorAuth;