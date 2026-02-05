import { zodResolver } from '@hookform/resolvers/zod'
import { startAuthentication } from '@simplewebauthn/browser'
import { Eye, EyeOff, Chrome, Facebook, Fingerprint, AlertCircle, CheckCircle } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import zxcvbn from 'zxcvbn'

import { Alert, AlertDescription } from '../../shared/components/ui/alert'
import { Button } from '../../shared/components/ui/button'
import { Checkbox } from '../../shared/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../shared/components/ui/form'
import { Input } from '../../shared/components/ui/input'
import { Logo } from '../../shared/components/ui/logo'
import { Progress } from '../../shared/components/ui/progress'
import { Separator } from '../../shared/components/ui/separator'
import { useLogin } from '../hooks/useAuth'
import { LoginCredentials, User } from '../types/auth.types'

// Validation schema with proper typing
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
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: (user: User) => void
  redirectTo?: string
  showSocialLogin?: boolean
  enableTwoFactor?: boolean
  enableBiometric?: boolean
  className?: string
}

interface PasswordStrength {
  score: number
  feedback: {
    warning: string
    suggestions: string[]
  }
}

export function LoginForm({
  onSuccess,
  redirectTo,
  showSocialLogin = true,
  enableTwoFactor = true,
  enableBiometric = true,
  className = '',
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null)
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false)
  const [socialLoginLoading, setSocialLoginLoading] = useState<string | null>(null)
  const [biometricLoading, setBiometricLoading] = useState(false)

  const loginMutation = useLogin()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // Check WebAuthn support
  useEffect(() => {
    setIsWebAuthnSupported(
      typeof window !== 'undefined' &&
      'PublicKeyCredential' in window &&
      typeof window.PublicKeyCredential === 'function'
    )
  }, [])

  // Password strength checking with proper typing
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(null)
      return
    }

    const result = zxcvbn(password)
    setPasswordStrength({
      score: result.score,
      feedback: {
        warning: result.feedback.warning || '',
        suggestions: result.feedback.suggestions || [],
      },
    })
  }

  // Handle form submission with proper typing
  const onSubmit = async (data: LoginFormData) => {
    try {
      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      }

      const result = await loginMutation.mutateAsync(credentials)
      
      if (result.data.user) {
        // Store remember me preference
        if (data.rememberMe) {
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('rememberedEmail', data.email)
        } else {
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('rememberedEmail')
        }

        onSuccess?.(result.data.user)
        
        // Redirect if specified
        if (redirectTo) {
          window.location.href = redirectTo
        }
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  // Handle social login
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoginLoading(provider)
    try {
      const baseUrl = window.location.origin
      const redirectUrl = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''
      window.location.href = `${baseUrl}/api/auth/${provider}${redirectUrl}`
    } catch (error) {
      console.error(`${provider} login failed:`, error)
      setSocialLoginLoading(null)
    }
  }

  // Handle biometric authentication
  const handleBiometricLogin = async () => {
    if (!isWebAuthnSupported) return

    setBiometricLoading(true)
    try {
      const response = await fetch('/api/auth/webauthn/authentication/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.getValues('email') }),
      })

      if (!response.ok) {
        throw new Error('Failed to get authentication options')
      }

      const options = await response.json()
      const credential = await startAuthentication(options)

      const verificationResponse = await fetch('/api/auth/webauthn/authentication/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.getValues('email'),
          credential,
        }),
      })

      if (!verificationResponse.ok) {
        throw new Error('Biometric authentication failed')
      }

      const result = await verificationResponse.json()
      
      if (result.data.user) {
        onSuccess?.(result.data.user)
        if (redirectTo) {
          window.location.href = redirectTo
        }
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error)
    } finally {
      setBiometricLoading(false)
    }
  }

  // Load remembered email on mount
  useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true'
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    
    if (rememberMe && rememberedEmail) {
      form.setValue('email', rememberedEmail)
      form.setValue('rememberMe', true)
    }
  }, [form])

  // Get password strength color and text
  const getPasswordStrengthInfo = () => {
    if (!passwordStrength) return null

    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    
    return {
      color: colors[passwordStrength.score],
      label: labels[passwordStrength.score],
      progress: (passwordStrength.score + 1) * 20,
    }
  }

  const strengthInfo = getPasswordStrengthInfo()

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Logo size="xl" variant="default" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-base text-gray-600 leading-relaxed">
            Sign in to your TripleCheck account to continue
          </p>
        </div>
      </div>

      {/* Social Login Section */}
      {showSocialLogin && (
        <div className="space-y-4 mb-8">
          <div className="grid gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-sm font-medium border-2 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200"
              onClick={() => handleSocialLogin('google')}
              disabled={socialLoginLoading === 'google'}
            >
              <Chrome className="w-5 h-5 mr-3 text-blue-600" />
              {socialLoginLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-sm font-medium border-2 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200"
              onClick={() => handleSocialLogin('facebook')}
              disabled={socialLoginLoading === 'facebook'}
            >
              <Facebook className="w-5 h-5 mr-3 text-blue-700" />
              {socialLoginLoading === 'facebook' ? 'Connecting...' : 'Continue with Facebook'}
            </Button>

            {/* Biometric Login */}
            {enableBiometric && isWebAuthnSupported && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-sm font-medium border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                onClick={handleBiometricLogin}
                disabled={biometricLoading || !form.watch('email')}
              >
                <Fingerprint className="w-5 h-5 mr-3 text-green-600" />
                {biometricLoading ? 'Authenticating...' : 'Use Biometric Login'}
              </Button>
            )}
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                Or continue with email
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-sm font-semibold text-gray-700">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    {...field}
                    className="w-full h-12 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </FormControl>
                {fieldState.error && (
                  <FormMessage className="text-sm">{fieldState.error.message}</FormMessage>
                )}
              </FormItem>
            )}
          />

          {/* Password Field */}
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-sm font-semibold text-gray-700">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        checkPasswordStrength(e.target.value)
                      }}
                      className="w-full h-12 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                {fieldState.error && (
                  <FormMessage className="text-sm">{fieldState.error.message}</FormMessage>
                )}
                
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
                    {passwordStrength.feedback.warning && (
                      <div className="flex items-start gap-2 text-xs text-amber-600">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{passwordStrength.feedback.warning}</span>
                      </div>
                    )}
                    {passwordStrength.feedback.suggestions.length > 0 && (
                      <div className="space-y-1">
                        {passwordStrength.feedback.suggestions.map((suggestion, index) => (
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
          <Controller
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium text-gray-700 cursor-pointer">
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
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center pt-4">
            <a
              href="/auth/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors duration-200"
            >
              Forgot your password?
            </a>
          </div>
        </form>
      </Form>

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a 
              href="/auth/register" 
              className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors duration-200"
            >
              Create account
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginForm