import {
  Building2,
  Users,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle,
  X,
  AlertCircle,
  Loader2,
  Star,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";

import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";

import { cn } from "@/shared/lib/utils";

// Form submission data interface
interface B2BLeadData {
  email: string;
  company: string;
  role: string;
  useCase: string;
  monthlyVolume: string;
  phone?: string;
  timeline?: string;
  trigger: string;
  userMetrics?:
    | {
        verificationsThisMonth?: number;
        averagePropertyValue?: number;
        businessIndicators?: readonly string[];
      }
    | undefined;
  timestamp: string;
  source: string;
}

interface B2BLeadCaptureProps {
  readonly className?: string;
  readonly trigger?: "high_usage" | "high_value" | "business_hours" | "manual";
  readonly position?:
    | "bottom-right"
    | "bottom-left"
    | "top-right"
    | "top-left"
    | "center";
  readonly userMetrics?: {
    readonly verificationsThisMonth?: number;
    readonly averagePropertyValue?: number;
    readonly businessIndicators?: readonly string[];
  };
  readonly onClose?: () => void;
  readonly onSubmit?: (data: B2BLeadData) => Promise<void>;
  readonly customization?: {
    readonly title?: string;
    readonly subtitle?: string;
    readonly ctaText?: string;
    readonly showValueProps?: boolean;
    readonly showProgress?: boolean;
  };
}

// Enhanced form validation schema
interface FormData {
  email: string;
  company: string;
  role: string;
  useCase: string;
  monthlyVolume: string;
  phone?: string;
  timeline?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

// CSS class constants
const ERROR_BORDER_CLASS = "border-red-500";
const DEFAULT_BORDER_CLASS = "border-gray-300";
const SELECT_BASE_CLASSES =
  "mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

// Position classes mapping
const POSITION_CLASSES = {
  "bottom-right": "bottom-6 right-6",
  "bottom-left": "bottom-6 left-6",
  "top-right": "top-6 right-6",
  "top-left": "top-6 left-6",
  center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
} as const;

// Default position constant
const DEFAULT_POSITION = "bottom-right" as const;

// Enhanced trigger messages
const TRIGGER_MESSAGES = {
  high_usage: {
    title: "You're a Power User! �",
    subtitle: "Ready to scale with our API?",
    urgency: "high",
  },
  high_value: {
    title: "Premium Properties Detected 💎",
    subtitle: "Unlock enterprise features",
    urgency: "medium",
  },
  business_hours: {
    title: "Perfect Timing! ⏰",
    subtitle: "Our team is available now",
    urgency: "low",
  },
  manual: {
    title: "Ready for API Access?",
    subtitle: "Integrate our verification into your platform",
    urgency: "low",
  },
} as const;

// Safe email validation regex (non-backtracking)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Helper functions to reduce cognitive complexity
const getTriggerConfig = (trigger: string) => {
  const validTriggers = [
    "high_usage",
    "high_value",
    "business_hours",
    "manual",
  ] as const;

  type ValidTrigger = (typeof validTriggers)[number];
  const isValidTrigger = (t: string): t is ValidTrigger =>
    validTriggers.includes(t as ValidTrigger);

  const triggerKey = isValidTrigger(trigger) ? trigger : "manual";
  return TRIGGER_MESSAGES[triggerKey];
};

const getPositionClasses = (position: string) => {
  const validPositions = [
    "bottom-right",
    "bottom-left",
    "top-right",
    "top-left",
    "center",
  ] as const;

  type ValidPosition = (typeof validPositions)[number];
  const isValidPosition = (p: string): p is ValidPosition =>
    validPositions.includes(p as ValidPosition);

  const positionKey = isValidPosition(position) ? position : DEFAULT_POSITION;
  return POSITION_CLASSES[positionKey];
};

const getUrgencyClasses = (urgency: string) => {
  switch (urgency) {
    case "high":
      return { bg: "bg-red-100", text: "text-red-600" };
    case "medium":
      return { bg: "bg-orange-100", text: "text-orange-600" };
    default:
      return { bg: "bg-blue-100", text: "text-blue-600" };
  }
};

const renderButtonContent = (
  isSubmitting: boolean,
  currentStep: number,
  customization: { ctaText?: string }
) => {
  if (isSubmitting) {
    return (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Submitting...
      </>
    );
  }

  if (currentStep === 1) {
    return (
      <>
        Continue
        <ArrowRight className="w-4 h-4 ml-1" />
      </>
    );
  }

  return (
    <>
      {customization.ctaText || "Get API Demo"}
      <ArrowRight className="w-4 h-4 ml-1" />
    </>
  );
};

export function B2BLeadCapture({
  className,
  trigger = "manual",
  position = DEFAULT_POSITION,
  userMetrics,
  onClose,
  onSubmit,
  customization = {},
}: B2BLeadCaptureProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<FormData>({
    email: "",
    company: "",
    role: "",
    useCase: "",
    monthlyVolume: "",
    phone: "",
    timeline: "",
  });

  // Memoize trigger configuration
  const triggerConfig = useMemo(() => getTriggerConfig(trigger), [trigger]);

  // Memoize position classes
  const positionClasses = useMemo(
    () => getPositionClasses(position),
    [position]
  );

  // Memoize urgency classes
  const urgencyClasses = useMemo(
    () => getUrgencyClasses(triggerConfig.urgency),
    [triggerConfig.urgency]
  );

  // Enhanced validation function
  const validateForm = useCallback(
    (step: number): boolean => {
      const newErrors: ValidationErrors = {};

      if (step >= 1) {
        if (!formData.email) {
          newErrors.email = "Email is required";
        } else if (!EMAIL_REGEX.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }

        if (!formData.company) {
          newErrors.company = "Company name is required";
        } else if (formData.company.length < 2) {
          newErrors.company = "Company name must be at least 2 characters";
        }
      }

      if (step >= 2) {
        if (!formData.role) {
          newErrors.role = "Please select your role";
        }
        if (!formData.monthlyVolume) {
          newErrors.monthlyVolume = "Please select monthly volume";
        }
        if (!formData.useCase) {
          newErrors.useCase = "Please select your primary use case";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  // Auto-show based on enhanced trigger conditions
  useEffect(() => {
    const shouldShow = () => {
      switch (trigger) {
        case "high_usage":
          return (userMetrics?.verificationsThisMonth || 0) > 10;
        case "high_value":
          return (userMetrics?.averagePropertyValue || 0) > 5000000; // 5M KES
        case "business_hours": {
          const hour = new Date().getHours();
          const day = new Date().getDay();
          return hour >= 9 && hour <= 17 && day >= 1 && day <= 5; // Weekdays 9 AM - 5 PM
        }
        case "manual":
        default:
          return true;
      }
    };

    if (shouldShow()) {
      const delay = trigger === "manual" ? 1000 : 3000; // Faster for manual trigger
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [trigger, userMetrics]);

  // Enhanced form submission with steps
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < 2) {
      // Validate current step and proceed to next
      if (validateForm(currentStep)) {
        setCurrentStep(2);
      }
      return;
    }

    // Final submission
    if (!validateForm(2)) return;

    setIsSubmitting(true);

    try {
      // Track lead capture with enhanced data
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "b2b_lead_capture", {
          event_category: "B2B",
          event_label: trigger,
          custom_parameters: {
            company: formData.company,
            role: formData.role,
            use_case: formData.useCase,
            monthly_volume: formData.monthlyVolume,
            step_completed: currentStep,
          },
        });
      }

      // Use custom onSubmit if provided, otherwise use default API
      if (onSubmit) {
        await onSubmit({
          ...formData,
          trigger,
          userMetrics,
          timestamp: new Date().toISOString(),
          source: "consumer_platform",
        });
      } else {
        const response = await fetch("/api/b2b/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            trigger,
            userMetrics,
            timestamp: new Date().toISOString(),
            source: "consumer_platform",
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      setIsSubmitted(true);
      // Auto-hide after success
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 5000);
    } catch (error) {
      // Log error for debugging without using console
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "b2b_lead_error", {
          event_category: "Error",
          event_label: "Lead capture submission failed",
          custom_parameters: { error: String(error) },
        });
      }
      setErrors({ submit: "Failed to submit. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced input change handler with validation
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field-specific error when user starts typing
      if (Object.prototype.hasOwnProperty.call(errors, field)) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  // Handle close with callback
  const handleClose = useCallback(() => {
    setIsVisible(false);
    onClose?.();
  }, [onClose]);

  if (!isVisible) return null;

  // Success state with enhanced messaging
  if (isSubmitted) {
    return (
      <Card
        className={cn(
          `fixed ${positionClasses} w-96 shadow-2xl border-green-200 bg-green-50 z-50 animate-in slide-in-from-bottom-4 duration-300`,
          className
        )}
      >
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50 duration-500 delay-200">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              {customization.title || "Thank You!"}
            </h3>
            <p className="text-green-700 mb-4">
              We&apos;ll contact you within 24 hours to discuss your API
              integration needs.
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-yellow-500 fill-current"
                />
              ))}
              <span className="text-sm text-green-700 ml-2">
                Trusted by 500+ companies
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClose}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        `fixed ${positionClasses} w-96 shadow-2xl border-blue-200 z-50 animate-in slide-in-from-bottom-4 duration-300`,
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${urgencyClasses.bg}`}>
              <Building2 className={`w-5 h-5 ${urgencyClasses.text}`} />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">
                {customization.title || triggerConfig.title}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {customization.subtitle || triggerConfig.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-sm hover:bg-gray-100"
            aria-label="Close lead capture form"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress indicator */}
        {customization.showProgress !== false && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Step {currentStep} of 2</span>
              <span>{currentStep === 1 ? "Basic Info" : "Requirements"}</span>
            </div>
            <Progress value={(currentStep / 2) * 100} className="h-1" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Enhanced Value Props */}
        {customization.showValueProps !== false && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-blue-500" />
              <span>10-min verification</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>95% accuracy</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Enterprise ready</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4 text-orange-500" />
              <span>Kenya-specific</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errors.submit && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Multi-Step Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Work Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`mt-1 ${errors.email ? ERROR_BORDER_CLASS : ""}`}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-xs text-red-600 mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="company" className="text-sm font-medium">
                    Company Name *
                  </Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Your Company Ltd"
                    value={formData.company}
                    onChange={(e) =>
                      handleInputChange("company", e.target.value)
                    }
                    className={`mt-1 ${errors.company ? ERROR_BORDER_CLASS : ""}`}
                    aria-describedby={
                      errors.company ? "company-error" : undefined
                    }
                  />
                  {errors.company && (
                    <p id="company-error" className="text-xs text-red-600 mt-1">
                      {errors.company}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone (Optional)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+254 700 000 000"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="role" className="text-sm font-medium">
                    Your Role *
                  </Label>
                  <select
                    id="role"
                    title="Select your role"
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    className={`${SELECT_BASE_CLASSES} ${errors.role ? ERROR_BORDER_CLASS : DEFAULT_BORDER_CLASS}`}
                    aria-describedby={errors.role ? "role-error" : undefined}
                  >
                    <option value="">Select role</option>
                    <option value="cto">CTO</option>
                    <option value="developer">Developer</option>
                    <option value="product_manager">Product Manager</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.role && (
                    <p id="role-error" className="text-xs text-red-600 mt-1">
                      {errors.role}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="monthlyVolume"
                    className="text-sm font-medium"
                  >
                    Monthly Volume *
                  </Label>
                  <select
                    id="monthlyVolume"
                    title="Select monthly volume"
                    value={formData.monthlyVolume}
                    onChange={(e) =>
                      handleInputChange("monthlyVolume", e.target.value)
                    }
                    className={`${SELECT_BASE_CLASSES} ${errors.monthlyVolume ? ERROR_BORDER_CLASS : DEFAULT_BORDER_CLASS}`}
                    aria-describedby={
                      errors.monthlyVolume ? "volume-error" : undefined
                    }
                  >
                    <option value="">Select volume</option>
                    <option value="1-100">1-100 verifications</option>
                    <option value="100-1000">100-1,000 verifications</option>
                    <option value="1000-5000">1,000-5,000 verifications</option>
                    <option value="5000+">5,000+ verifications</option>
                  </select>
                  {errors.monthlyVolume && (
                    <p id="volume-error" className="text-xs text-red-600 mt-1">
                      {errors.monthlyVolume}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="useCase" className="text-sm font-medium">
                  Primary Use Case *
                </Label>
                <select
                  id="useCase"
                  title="Select primary use case"
                  value={formData.useCase}
                  onChange={(e) => handleInputChange("useCase", e.target.value)}
                  className={`${SELECT_BASE_CLASSES} ${errors.useCase ? ERROR_BORDER_CLASS : DEFAULT_BORDER_CLASS}`}
                  aria-describedby={
                    errors.useCase ? "usecase-error" : undefined
                  }
                >
                  <option value="">Select use case</option>
                  <option value="loan_collateral">
                    Loan collateral verification
                  </option>
                  <option value="listing_verification">
                    Property listing verification
                  </option>
                  <option value="insurance_risk">
                    Insurance risk assessment
                  </option>
                  <option value="due_diligence">Legal due diligence</option>
                  <option value="other">Other</option>
                </select>
                {errors.useCase && (
                  <p id="usecase-error" className="text-xs text-red-600 mt-1">
                    {errors.useCase}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="timeline" className="text-sm font-medium">
                  Implementation Timeline
                </Label>
                <select
                  id="timeline"
                  title="Select implementation timeline"
                  value={formData.timeline}
                  onChange={(e) =>
                    handleInputChange("timeline", e.target.value)
                  }
                  className={`${SELECT_BASE_CLASSES} ${DEFAULT_BORDER_CLASS}`}
                >
                  <option value="">Select timeline</option>
                  <option value="immediate">Immediate (within 1 month)</option>
                  <option value="short">Short term (1-3 months)</option>
                  <option value="medium">Medium term (3-6 months)</option>
                  <option value="long">Long term (6+ months)</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            {currentStep === 2 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className={currentStep === 1 ? "flex-1" : ""}
              disabled={isSubmitting}
            >
              Maybe Later
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {renderButtonContent(isSubmitting, currentStep, customization)}
            </Button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-3 text-center">
          We&apos;ll contact you within 24 hours to discuss your needs
        </p>
      </CardContent>
    </Card>
  );
}
