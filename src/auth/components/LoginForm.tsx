import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield, Chrome, Facebook, Fingerprint, AlertCircle, CheckCircle } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import { Logo } from '../../shared/components/ui/logo';
import zxcvbn from 'zxcvbn';

import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Checkbox } from '../../shared/components/ui/checkbox';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Progress } from '../../shared/components/ui/progress';
import { Separator } from '../../shared/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../shared/components/ui/form';
import { useLogin } from '../hooks/useAuth';
import { LoginCredentials, User } from '../types/auth.types';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: (user: User) => void;
  redirectTo?: string;
  showSocialLogin?: boolean;
  enableTwoFactor?: boolean;
  enableBiometric?: boolean;
  className?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  warning: string;
}

export function LoginForm({
  onSuccess,
  redirectTo,
  showSocialLogin = true,
  enableTwoFactor = true,
  enableBiometric = true,
  className = '',
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);
  const [socialLoginLoading, setSocialLoginLoading] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const loginMutation = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Check WebAuthn support
  useEffect(() => {
    setIsWebAuthnSupported(
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential === 'function'
    );
  }, []);

  // Password strength checking
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    const result = zxcvbn(password);
    setPasswordStrength({
      score: result.score,
      feedback: result.feedback.suggestions,
      warning: result.feedback.warning || '',
    });
  };

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      };

      const result = await loginMutation.mutateAsync(credentials);
      
      if (result.data.user) {
        // Store remember me preference
        if (data.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberedEmail', data.email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberedEmail');
        }

        onSuccess?.(result.data.user);
        
        // Redirect if specified
        if (redirectTo) {
          window.location.href = redirectTo;
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Handle social login
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoginLoading(provider);
    try {
      // Redirect to OAuth endpoint
      const baseUrl = window.location.origin;
      const redirectUrl = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
      window.location.href = `${baseUrl}/api/auth/${provider}${redirectUrl}`;
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      setSocialLoginLoading(null);
    }
  };

  // Handle biometric authentication
  const handleBiometricLogin = async () => {
    if (!isWebAuthnSupported) return;

    setBiometricLoading(true);
    try {
      // Get authentication options from server
      const response = await fetch('/api/auth/webauthn/authentication/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.getValues('email') }),
      });

      if (!response.ok) {
        throw new Error('Failed to get authentication options');
      }

      const options = await response.json();

      // Start WebAuthn authentication
      const credential = await startAuthentication(options);

      // Verify authentication with server
      const verificationResponse = await fetch('/api/auth/webauthn/authentication/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.getValues('email'),
          credential,
        }),
      });

      if (!verificationResponse.ok) {
        throw new Error('Biometric authentication failed');
      }

      const result = await verificationResponse.json();
      
      if (result.data.user) {
        onSuccess?.(result.data.user);
        if (redirectTo) {
          window.location.href = redirectTo;
        }
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
    } finally {
      setBiometricLoading(false);
    }
  };

  // Load remembered email on mount
  useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    
    if (rememberMe && rememberedEmail) {
      form.setValue('email', rememberedEmail);
      form.setValue('rememberMe', true);
    }
  }, [form]);

  // Get password strength color and text
  const getPasswordStrengthInfo = () => {
    if (!passwordStrength) return null;

    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    
    return {
      color: colors[passwordStrength.score],
      label: labels[passwordStrength.score],
      progress: (passwordStrength.score + 1) * 20,
    };
  };

  const strengthInfo = getPasswordStrengthInfo();

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="xl" variant="default" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-sm text-gray-600 mt-2">
          Sign in to your TripleCheck account
        </p>
      </div>

      {/* Social Login */}
      {showSocialLogin && (
        <div className="space-y-3 mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin('google')}
            disabled={socialLoginLoading === 'google'}
          >
            <Chrome className="w-4 h-4 mr-2" />
            {socialLoginLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin('facebook')}
            disabled={socialLoginLoading === 'facebook'}
          >
            <Facebook className="w-4 h-4 mr-2" />
            {socialLoginLoading === 'facebook' ? 'Connecting...' : 'Continue with Facebook'}
          </Button>

          {/* Biometric Login */}
          {enableBiometric && isWebAuthnSupported && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleBiometricLogin}
              disabled={biometricLoading || !form.watch('email')}
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              {biometricLoading ? 'Authenticating...' : 'Use Biometric Login'}
            </Button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        checkPasswordStrength(e.target.value);
                      }}
                      className="w-full pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
                
                {/* Password Strength Indicator */}
                {passwordStrength && strengthInfo && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.score >= 3 ? 'text-green-600' : 
                        passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {strengthInfo.label}
                      </span>
                    </div>
                    <Progress 
                      value={strengthInfo.progress} 
                      className="h-2"
                    />
                    {passwordStrength.warning && (
                      <div className="flex items-start gap-2 text-xs text-amber-600">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{passwordStrength.warning}</span>
                      </div>
                    )}
                    {passwordStrength.feedback.length > 0 && (
                      <div className="space-y-1">
                        {passwordStrength.feedback.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs text-blue-600">
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </FormItem>
            )}
          />

          {/* Remember Me */}
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    Remember me on this device
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Error Display */}
          {loginMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {loginMutation.error instanceof Error 
                  ? loginMutation.error.message 
                  : 'Login failed. Please check your credentials and try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </Button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <a
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot your password?
            </a>
          </div>
        </form>
      </Form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/auth/register" className="text-primary hover:underline font-medium">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;