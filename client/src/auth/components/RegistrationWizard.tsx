import { zodResolver } from '@hookform/resolvers/zod'
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Camera, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import zxcvbn from 'zxcvbn'

import { Alert, AlertDescription } from '../../local/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '../../local/components/ui/avatar'
import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Checkbox } from '../../local/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../local/components/ui/form'
import { Input } from '../../local/components/ui/input'
import { Progress } from '../../local/components/ui/progress'
import { Textarea } from '../../local/components/ui/textarea'
import { useRegister } from '../hooks/useAuth'
import { RegisterData } from '@shared/types/auth.types'

import { Logo } from '../../local/components/ui/logo'

// Step schemas
const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const profileSchema = z.object({
  profilePhoto: z.any().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

const termsSchema = z.object({
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms of service',
  }),
  agreeToPrivacy: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the privacy policy',
  }),
  agreeToMarketing: z.boolean().optional(),
});

// Combined schema for final submission
const registrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  profilePhoto: z.any().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms of service',
  }),
  agreeToPrivacy: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the privacy policy',
  }),
  agreeToMarketing: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export interface RegistrationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  schema: z.ZodSchema<unknown>;
}

interface RegistrationWizardProps {
  steps?: RegistrationStep[];
  onComplete: (userData: RegisterData) => void;
  allowSkipOptional?: boolean;
  className?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  warning: string;
}

const defaultSteps: RegistrationStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Tell us about yourself',
    icon: <User className="w-5 h-5" />,
    schema: personalInfoSchema,
  },
  {
    id: 'password',
    title: 'Create Password',
    description: 'Secure your account',
    icon: <Lock className="w-5 h-5" />,
    schema: passwordSchema,
  },
  {
    id: 'profile',
    title: 'Profile Setup',
    description: 'Customize your profile',
    icon: <Camera className="w-5 h-5" />,
    schema: profileSchema,
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    description: 'Review and accept our terms',
    icon: <FileText className="w-5 h-5" />,
    schema: termsSchema,
  },
];

export function RegistrationWizard({
  steps = defaultSteps,
  onComplete,
  className = '',
}: RegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerMutation = useRegister();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      bio: '',
      agreeToTerms: false,
      agreeToPrivacy: false,
      agreeToMarketing: false,
    },
    mode: 'onChange',
  });

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('registrationFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        Object.keys(parsedData).forEach((key) => {
          if (key !== 'password' && key !== 'confirmPassword') {
            form.setValue(key as keyof RegistrationFormData, parsedData[key]);
          }
        });
      } catch (error) {
        // Failed to load saved registration data - continue with defaults
      }
    }
  }, [form]);

  // Save form data to localStorage on changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      const dataToSave = { ...data };
      // Don't save passwords to localStorage for security
      delete dataToSave.password;
      delete dataToSave.confirmPassword;
      localStorage.setItem('registrationFormData', JSON.stringify(dataToSave));
    });
    return () => subscription.unsubscribe();
  }, [form]);

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

  // Handle profile photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        form.setError('profilePhoto', { message: 'Please select a valid image file' });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        form.setError('profilePhoto', { message: 'Image size must be less than 5MB' });
        return;
      }

      const reader = new globalThis.FileReader();
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target?.result as string);
        form.setValue('profilePhoto', file);
        form.clearErrors('profilePhoto');
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate current step
  const validateCurrentStep = async () => {
    const currentStepSchema = steps[currentStep].schema;
    const formData = form.getValues();
    
    try {
      await currentStepSchema.parseAsync(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          form.setError(err.path[0] as keyof RegistrationFormData, {
            message: err.message,
          });
        });
      }
      return false;
    }
  };

  // Handle next step
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle step click
  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  // Send email verification
  const sendEmailVerification = async (email: string) => {
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setEmailVerificationSent(true);
      }
    } catch (error) {
      // Failed to send verification email - continue silently
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const formData = form.getValues();
      
      const registrationData: RegisterData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        agreeToTerms: formData.agreeToTerms,
      };

      await registerMutation.mutateAsync(registrationData);
      
      // Send email verification
      await sendEmailVerification(formData.email);
      
      // Clear saved form data
      localStorage.removeItem('registrationFormData');
      
      onComplete(registrationData);
    } catch (error) {
      // Registration failed - error will be handled by the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get password strength info
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
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="xl" variant="default" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
        <p className="text-sm text-gray-600 mt-2">
          Join TripleCheck for verified property listings
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => handleStepClick(index)}
            className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
              index === currentStep
                ? 'bg-primary text-primary-foreground'
                : completedSteps.has(index)
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : index < currentStep
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
            disabled={index > currentStep && !completedSteps.has(index)}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full mb-2">
              {completedSteps.has(index) ? (
                <Check className="w-4 h-4" />
              ) : (
                step.icon
              )}
            </div>
            <span className="text-xs font-medium text-center">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {steps[currentStep].icon}
            {steps[currentStep].title}
          </CardTitle>
          <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              {/* Personal Information Step */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your last name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type="email"
                              placeholder="Enter your email address"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type="tel"
                              placeholder="Enter your phone number"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Password Step */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Create a strong password"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              checkPasswordStrength(e.target.value);
                            }}
                          />
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
                                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                <span>{passwordStrength.warning}</span>
                              </div>
                            )}
                            {passwordStrength.feedback.length > 0 && (
                              <div className="space-y-1">
                                {passwordStrength.feedback.map((suggestion, index) => (
                                  <div key={index} className="flex items-start gap-2 text-xs text-blue-600">
                                    <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />
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
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Profile Setup Step */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={profilePhotoPreview || undefined} />
                          <AvatarFallback className="text-lg">
                            {form.getValues('firstName')?.[0]}{form.getValues('lastName')?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors" title="Upload profile photo">
                          <Camera className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            aria-label="Upload profile photo"
                          />
                        </label>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Upload a profile photo (optional)
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us a bit about yourself..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 text-right">
                          {field.value?.length || 0}/500 characters
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Terms & Conditions Step */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">
                              I agree to the{' '}
                              <a href="/terms" target="_blank" className="text-primary hover:underline">
                                Terms of Service
                              </a>
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="agreeToPrivacy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">
                              I agree to the{' '}
                              <a href="/privacy" target="_blank" className="text-primary hover:underline">
                                Privacy Policy
                              </a>
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="agreeToMarketing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">
                              I would like to receive marketing emails and updates (optional)
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {emailVerificationSent && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        A verification email will be sent to your email address after registration.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Error Display */}
              {registerMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {registerMutation.error instanceof Error 
                      ? registerMutation.error.message 
                      : 'Registration failed. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || registerMutation.isPending}
            className="flex items-center gap-2"
          >
            {isSubmitting || registerMutation.isPending ? (
              'Creating Account...'
            ) : (
              <>
                Create Account
                <Check className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Sign In Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/auth/login" className="text-primary hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export default RegistrationWizard;