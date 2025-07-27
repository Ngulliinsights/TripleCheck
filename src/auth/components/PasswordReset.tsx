import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  Info,
  AlertTriangle,
} from "lucide-react";
import zxcvbn from "zxcvbn";

import { Button } from "../../shared/components/ui/button";
import { Input } from "../../shared/components/ui/input";
import { Alert, AlertDescription } from "../../shared/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import { Progress } from "../../shared/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../shared/components/ui/form";
import { useRequestPasswordReset, useResetPassword } from "../hooks/useAuth";

// Simple logging utility to replace console statements
const logger = {
  error: (message: string, error?: unknown) => {
    // In production, this would send to a logging service
    if (process.env.NODE_ENV === "development") {
      // Development logging - would be replaced with proper logging service
      // eslint-disable-next-line no-console
      console.error(message, error);
    }
  },
};

// Types for password reset functionality
interface PasswordStrength {
  score: number;
  feedback: string[];
  warning: string;
}

interface AccountLockout {
  isLocked: boolean;
  lockoutUntil?: Date;
  attemptCount: number;
  maxAttempts: number;
}

interface SecurityNotification {
  type: "success" | "warning" | "error" | "info";
  message: string;
  timestamp: Date;
}

// Constants
const LOCKOUT_CONFIG = {
  STORAGE_KEY: "password_reset_lockout",
  MAX_ATTEMPTS: 5,
  DURATION_MS: 15 * 60 * 1000, // 15 minutes
} as const;

const PASSWORD_CONFIG = {
  HISTORY_KEY: "password_history",
  MAX_HISTORY: 5,
  MIN_STRENGTH_SCORE: 2,
} as const;

const SECURITY_CONFIG = {
  NOTIFICATIONS_KEY: "security_notifications",
  MAX_NOTIFICATIONS: 10,
  DISPLAY_COUNT: 3,
} as const;

// Validation schemas
const requestResetSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address")
    .max(254, "Email address is too long"),
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password must be less than 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don&apos;t match",
    path: ["confirmPassword"],
  });

// Utility functions
const createSimpleHash = (input: string): string => {
  // Simple hash for demo - in production, use proper hashing like bcrypt
  if (typeof window !== "undefined" && typeof window.btoa !== "undefined") {
    return window.btoa(input);
  }
  // Fallback for environments without btoa
  return Buffer.from(input, "utf-8").toString("base64");
};

const formatTimeRemaining = (milliseconds: number): string => {
  const minutes = Math.ceil(milliseconds / 60000);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
};

const checkPasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return { score: 0, feedback: [], warning: "" };
  }

  const result = zxcvbn(password);
  return {
    score: result.score,
    feedback: result.feedback.suggestions,
    warning: result.feedback.warning || "",
  };
};

// Account lockout management
class AccountLockoutManager {
  private static getStorageKey(email: string): string {
    return `${LOCKOUT_CONFIG.STORAGE_KEY}_${email}`;
  }

  static getAccountLockout(email: string): AccountLockout {
    try {
      const stored = localStorage.getItem(this.getStorageKey(email));
      if (!stored) {
        return {
          isLocked: false,
          attemptCount: 0,
          maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
        };
      }

      const lockout = JSON.parse(stored);
      const now = new Date();
      const lockoutUntil =
        lockout.lockoutUntil ? new Date(lockout.lockoutUntil) : null;

      if (lockoutUntil && now < lockoutUntil) {
        return {
          isLocked: true,
          lockoutUntil,
          attemptCount: lockout.attemptCount,
          maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
        };
      }

      if (lockoutUntil && now >= lockoutUntil) {
        localStorage.removeItem(this.getStorageKey(email));
        return {
          isLocked: false,
          attemptCount: 0,
          maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
        };
      }

      return {
        isLocked: false,
        attemptCount: lockout.attemptCount || 0,
        maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
      };
    } catch (error) {
      logger.error("Error reading account lockout:", error);
      return {
        isLocked: false,
        attemptCount: 0,
        maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
      };
    }
  }

  static updateAccountLockout(email: string, failed: boolean = false): void {
    try {
      if (failed) {
        const current = this.getAccountLockout(email);
        const newAttemptCount = current.attemptCount + 1;
        const shouldLock = newAttemptCount >= LOCKOUT_CONFIG.MAX_ATTEMPTS;

        const lockout = {
          attemptCount: newAttemptCount,
          lockoutUntil:
            shouldLock ?
              new Date(Date.now() + LOCKOUT_CONFIG.DURATION_MS)
            : null,
        };

        localStorage.setItem(
          this.getStorageKey(email),
          JSON.stringify(lockout)
        );
      } else {
        localStorage.removeItem(this.getStorageKey(email));
      }
    } catch (error) {
      logger.error("Error updating account lockout:", error);
    }
  }
}

// Password history management
class PasswordHistoryManager {
  private static getStorageKey(email: string): string {
    return `${PASSWORD_CONFIG.HISTORY_KEY}_${email}`;
  }

  static getPasswordHistory(email: string): string[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey(email));
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error("Error reading password history:", error);
      return [];
    }
  }

  static addToPasswordHistory(email: string, passwordHash: string): void {
    try {
      const history = this.getPasswordHistory(email);
      history.unshift(passwordHash);

      const trimmedHistory = history.slice(0, PASSWORD_CONFIG.MAX_HISTORY);
      localStorage.setItem(
        this.getStorageKey(email),
        JSON.stringify(trimmedHistory)
      );
    } catch (error) {
      logger.error("Error updating password history:", error);
    }
  }

  static isPasswordReused(email: string, password: string): boolean {
    try {
      const history = this.getPasswordHistory(email);
      const hash = createSimpleHash(password);
      return history.includes(hash);
    } catch (error) {
      logger.error("Error checking password reuse:", error);
      return false;
    }
  }
}

// Security notification management
class SecurityNotificationManager {
  static addNotification(notification: SecurityNotification): void {
    try {
      const notifications = JSON.parse(
        localStorage.getItem(SECURITY_CONFIG.NOTIFICATIONS_KEY) || "[]"
      );
      notifications.unshift(notification);

      const trimmed = notifications.slice(0, SECURITY_CONFIG.MAX_NOTIFICATIONS);
      localStorage.setItem(
        SECURITY_CONFIG.NOTIFICATIONS_KEY,
        JSON.stringify(trimmed)
      );
    } catch (error) {
      logger.error("Error adding security notification:", error);
    }
  }

  static getRecentNotifications(
    count: number = SECURITY_CONFIG.DISPLAY_COUNT
  ): SecurityNotification[] {
    try {
      const notifications = JSON.parse(
        localStorage.getItem(SECURITY_CONFIG.NOTIFICATIONS_KEY) || "[]"
      );
      return notifications.slice(0, count);
    } catch (error) {
      logger.error("Error reading security notifications:", error);
      return [];
    }
  }
}

export const PasswordReset: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlParams = useMemo(
    () => ({
      token: searchParams.get("token"),
      email: searchParams.get("email"),
    }),
    [searchParams]
  );

  const [step, setStep] = useState<"request" | "reset" | "success">("request");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    warning: "",
  });
  const [accountLockout, setAccountLockout] = useState<AccountLockout>({
    isLocked: false,
    attemptCount: 0,
    maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
  });
  const [securityNotifications, setSecurityNotifications] = useState<
    SecurityNotification[]
  >([]);
  const [isPasswordReusedError, setIsPasswordReusedError] = useState(false);

  const requestPasswordReset = useRequestPasswordReset();
  const resetPassword = useResetPassword();

  const requestForm = useForm({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: urlParams.email || "" },
    mode: "onBlur",
  });

  const resetForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (urlParams.token) {
      setStep("reset");
    }

    if (urlParams.email) {
      const lockout = AccountLockoutManager.getAccountLockout(urlParams.email);
      setAccountLockout(lockout);
    }

    const notifications = SecurityNotificationManager.getRecentNotifications();
    setSecurityNotifications(notifications);
  }, [urlParams.token, urlParams.email]);

  const handlePasswordChange = useCallback(
    (password: string) => {
      if (password) {
        const strength = checkPasswordStrength(password);
        setPasswordStrength(strength);

        const currentEmail = urlParams.email || requestForm.getValues("email");
        if (
          currentEmail &&
          PasswordHistoryManager.isPasswordReused(currentEmail, password)
        ) {
          setIsPasswordReusedError(true);
        } else {
          setIsPasswordReusedError(false);
        }
      } else {
        setPasswordStrength({ score: 0, feedback: [], warning: "" });
        setIsPasswordReusedError(false);
      }
    },
    [urlParams.email, requestForm]
  );

  const handleRequestReset = async (data: { email: string }) => {
    const lockout = AccountLockoutManager.getAccountLockout(data.email);

    if (lockout.isLocked && lockout.lockoutUntil) {
      const timeRemaining = lockout.lockoutUntil.getTime() - Date.now();
      SecurityNotificationManager.addNotification({
        type: "error",
        message: `Account temporarily locked. Try again in ${formatTimeRemaining(timeRemaining)}.`,
        timestamp: new Date(),
      });
      return;
    }

    try {
      await requestPasswordReset.mutateAsync(data.email);

      AccountLockoutManager.updateAccountLockout(data.email, false);

      SecurityNotificationManager.addNotification({
        type: "success",
        message: "Password reset email sent successfully.",
        timestamp: new Date(),
      });

      setStep("success");
    } catch (error) {
      logger.error("Password reset request failed:", error);

      AccountLockoutManager.updateAccountLockout(data.email, true);
      const newLockout = AccountLockoutManager.getAccountLockout(data.email);
      setAccountLockout(newLockout);

      SecurityNotificationManager.addNotification({
        type: "error",
        message: "Failed to send password reset email. Please try again.",
        timestamp: new Date(),
      });
    }
  };

  const handleResetPassword = async (data: {
    password: string;
    confirmPassword: string;
  }) => {
    if (!urlParams.token) {
      logger.error("No reset token provided");
      return;
    }

    const currentEmail = urlParams.email || "";
    if (PasswordHistoryManager.isPasswordReused(currentEmail, data.password)) {
      setIsPasswordReusedError(true);
      return;
    }

    try {
      await resetPassword.mutateAsync({
        token: urlParams.token,
        password: data.password,
      });

      if (currentEmail) {
        const hash = createSimpleHash(data.password);
        PasswordHistoryManager.addToPasswordHistory(currentEmail, hash);
      }

      SecurityNotificationManager.addNotification({
        type: "success",
        message:
          "Password reset successfully. Please log in with your new password.",
        timestamp: new Date(),
      });

      setStep("success");
    } catch (error) {
      logger.error("Password reset failed:", error);

      SecurityNotificationManager.addNotification({
        type: "error",
        message: "Failed to reset password. The reset link may have expired.",
        timestamp: new Date(),
      });
    }
  };

  const passwordStrengthInfo = useMemo(() => {
    const getPasswordStrengthInfo = (score: number) => {
      switch (score) {
        case 0:
        case 1:
          return {
            color: "bg-red-500",
            text: "Very Weak",
            textColor: "text-red-600",
          };
        case 2:
          return {
            color: "bg-orange-500",
            text: "Weak",
            textColor: "text-orange-600",
          };
        case 3:
          return {
            color: "bg-yellow-500",
            text: "Fair",
            textColor: "text-yellow-600",
          };
        case 4:
          return {
            color: "bg-green-500",
            text: "Strong",
            textColor: "text-green-600",
          };
        default:
          return {
            color: "bg-gray-300",
            text: "Unknown",
            textColor: "text-gray-600",
          };
      }
    };

    return getPasswordStrengthInfo(passwordStrength.score);
  }, [passwordStrength.score]);

  const lockoutTimeRemaining = useMemo(() => {
    if (!accountLockout.isLocked || !accountLockout.lockoutUntil) return null;
    return accountLockout.lockoutUntil.getTime() - Date.now();
  }, [accountLockout.isLocked, accountLockout.lockoutUntil]);

  const renderLockoutWarning = () => {
    if (!accountLockout.isLocked || !lockoutTimeRemaining) return null;

    return (
      <Alert className="mb-4" variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Account temporarily locked due to multiple failed attempts. Try again
          in {formatTimeRemaining(lockoutTimeRemaining)}.
        </AlertDescription>
      </Alert>
    );
  };

  const renderAttemptCounter = () => {
    if (accountLockout.attemptCount === 0 || accountLockout.isLocked)
      return null;

    const remainingAttempts =
      accountLockout.maxAttempts - accountLockout.attemptCount;

    return (
      <Alert className="mb-4" variant="destructive">
        <Info className="h-4 w-4" />
        <AlertDescription>
          {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""}{" "}
          remaining before account lockout.
        </AlertDescription>
      </Alert>
    );
  };

  const renderPasswordStrengthIndicator = (fieldValue: string) => {
    if (!fieldValue) return null;

    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Password Strength:</span>
          <span className={`font-medium ${passwordStrengthInfo.textColor}`}>
            {passwordStrengthInfo.text}
          </span>
        </div>
        <Progress value={(passwordStrength.score + 1) * 20} className="h-2" />
        {passwordStrength.warning && (
          <p className="text-sm text-orange-600 font-medium">
            {passwordStrength.warning}
          </p>
        )}
        {passwordStrength.feedback.length > 0 && (
          <ul className="text-sm text-muted-foreground space-y-1">
            {passwordStrength.feedback.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <Info className="h-3 w-3 mt-0.5 mr-2 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderSecurityNotifications = () => {
    if (securityNotifications.length === 0) return null;

    return (
      <div className="w-full max-w-md mx-auto mb-6 space-y-2">
        {securityNotifications.map((notification, index) => (
          <Alert
            key={`${notification.timestamp.getTime()}-${index}`}
            variant={notification.type === "error" ? "destructive" : "default"}
          >
            {notification.type === "success" && (
              <CheckCircle className="h-4 w-4" />
            )}
            {notification.type === "error" && (
              <AlertCircle className="h-4 w-4" />
            )}
            {notification.type === "warning" && (
              <AlertTriangle className="h-4 w-4" />
            )}
            {notification.type === "info" && <Info className="h-4 w-4" />}
            <AlertDescription>
              <div className="flex justify-between items-start">
                <span>{notification.message}</span>
                <time className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </time>
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

  const renderRequestForm = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Lock className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">
          Reset Your Password
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>
      </CardHeader>
      <CardContent>
        {renderLockoutWarning()}
        {renderAttemptCounter()}

        <Form {...requestForm}>
          <form
            onSubmit={requestForm.handleSubmit(handleRequestReset)}
            className="space-y-4"
          >
            <FormField
              control={requestForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-10"
                        disabled={
                          accountLockout.isLocked ||
                          requestPasswordReset.isPending
                        }
                        autoComplete="email"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={
                accountLockout.isLocked || requestPasswordReset.isPending
              }
            >
              {requestPasswordReset.isPending ?
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending Reset Link...
                </>
              : <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reset Link
                </>
              }
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/auth/login")}
            className="text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderResetForm = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Shield className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold">
          Create New Password
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter a strong password that you haven&apos;t used before.
        </p>
      </CardHeader>
      <CardContent>
        {isPasswordReusedError && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This password has been used recently. Please choose a different
              password.
            </AlertDescription>
          </Alert>
        )}

        <Form {...resetForm}>
          <form
            onSubmit={resetForm.handleSubmit(handleResetPassword)}
            className="space-y-4"
          >
            <FormField
              control={resetForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="pl-10 pr-10"
                        onChange={(e) => {
                          field.onChange(e);
                          handlePasswordChange(e.target.value);
                        }}
                        disabled={resetPassword.isPending}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ?
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  {renderPasswordStrengthIndicator(field.value)}
                </FormItem>
              )}
            />

            <FormField
              control={resetForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        className="pl-10 pr-10"
                        disabled={resetPassword.isPending}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        aria-label={
                          showConfirmPassword ?
                            "Hide password confirmation"
                          : "Show password confirmation"
                        }
                      >
                        {showConfirmPassword ?
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={
                resetPassword.isPending ||
                passwordStrength.score < PASSWORD_CONFIG.MIN_STRENGTH_SCORE ||
                isPasswordReusedError
              }
            >
              {resetPassword.isPending ?
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              : <>
                  <Shield className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              }
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/auth/login")}
            className="text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSuccess = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {step === "success" && urlParams.token ?
            "Password Reset Successfully"
          : "Check Your Email"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {step === "success" && urlParams.token ?
            "Your password has been reset successfully. You can now log in with your new password."
          : "We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the instructions."
          }
        </p>
      </CardHeader>
      <CardContent>
        <Button onClick={() => navigate("/auth/login")} className="w-full">
          Continue to Login
        </Button>

        {!urlParams.token && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setStep("request")}
              className="text-sm"
            >
              Didn&apos;t receive the email? Try again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {renderSecurityNotifications()}

        {step === "request" && renderRequestForm()}
        {step === "reset" && renderResetForm()}
        {step === "success" && renderSuccess()}
      </div>
    </div>
  );
};

export default PasswordReset;
