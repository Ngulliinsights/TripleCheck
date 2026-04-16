import React, { useState, useCallback } from "react"
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  AlertCircle,
  Send,
  Shield,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "../../local/components/ui/button"
import { Input } from "../../local/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../local/components/ui/card"
import { Label } from "../../local/components/ui/label"
import { useToast } from "../../local/hooks/use-toast"

interface ResetStep {
  step: "email" | "verification" | "success";
  email: string;
  verificationCode: string;
  isLoading: boolean;
}

export default function ForgotPassword() {
  const { toast } = useToast();
  const [resetState, setResetState] = useState<ResetStep>({
    step: "email",
    email: "",
    verificationCode: "",
    isLoading: false,
  });

  const updateState = useCallback(
    <K extends keyof ResetStep>(key: K, value: ResetStep[K]) => {
      setResetState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!resetState.email.trim()) {
        toast({
          title: "Email required",
          description: "Please enter your email address.",
          variant: "destructive",
        });
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(resetState.email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

      updateState("isLoading", true);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        updateState("step", "verification");
        toast({
          title: "Verification code sent",
          description: "Check your email for the password reset code.",
        });
      } catch (error) {
        toast({
          title: "Failed to send reset email",
          description: "Please try again later or contact support.",
          variant: "destructive",
        });
      } finally {
        updateState("isLoading", false);
      }
    },
    [resetState.email, toast, updateState]
  );

  const handleVerificationSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!resetState.verificationCode.trim()) {
        toast({
          title: "Verification code required",
          description: "Please enter the code sent to your email.",
          variant: "destructive",
        });
        return;
      }

      if (resetState.verificationCode.length !== 6) {
        toast({
          title: "Invalid code",
          description: "Verification code must be 6 digits.",
          variant: "destructive",
        });
        return;
      }

      updateState("isLoading", true);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        updateState("step", "success");
        toast({
          title: "Password reset successful",
          description: "Your password has been reset. You can now log in.",
        });
      } catch (error) {
        toast({
          title: "Invalid verification code",
          description: "Please check the code and try again.",
          variant: "destructive",
        });
      } finally {
        updateState("isLoading", false);
      }
    },
    [resetState.verificationCode, toast, updateState]
  );

  const handleResendCode = useCallback(async () => {
    updateState("isLoading", true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      toast({
        title: "Failed to resend code",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      updateState("isLoading", false);
    }
  }, [toast, updateState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {resetState.step === "email" && "Reset Password"}
              {resetState.step === "verification" && "Enter Verification Code"}
              {resetState.step === "success" && "Password Reset Complete"}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {resetState.step === "email" &&
                "Enter your email address and we'll send you a reset code"}
              {resetState.step === "verification" &&
                `We've sent a 6-digit code to ${resetState.email}`}
              {resetState.step === "success" &&
                "Your password has been successfully reset"}
            </p>
          </CardHeader>

          <CardContent>
            {resetState.step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={resetState.email}
                    onChange={(e) => updateState("email", e.target.value)}
                    disabled={resetState.isLoading}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={resetState.isLoading}
                >
                  {resetState.isLoading ?
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending Reset Code...
                    </>
                  : <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reset Code
                    </>
                  }
                </Button>
              </form>
            )}

            {resetState.step === "verification" && (
              <form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={resetState.verificationCode}
                    onChange={(e) =>
                      updateState(
                        "verificationCode",
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    disabled={resetState.isLoading}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Check your email for the 6-digit verification code
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    resetState.isLoading ||
                    resetState.verificationCode.length !== 6
                  }
                >
                  {resetState.isLoading ?
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Verifying...
                    </>
                  : <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Reset Password
                    </>
                  }
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resetState.isLoading}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>
              </form>
            )}

            {resetState.step === "success" && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Password Reset Complete!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Your password has been successfully reset. You can now log
                    in with your new password.
                  </p>
                </div>

                <Link to="/login">
                  <Button className="w-full">Continue to Login</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Security Notice</p>
              <p className="text-blue-700">
                For your security, password reset links expire after 15 minutes.
                If you didn't request this reset, please contact our support
                team.
              </p>
            </div>
          </div>
        </div>

        {/* Help Links */}
        <div className="mt-6 text-center space-x-4 text-sm">
          <Link to="/help" className="text-muted-foreground hover:text-primary">
            Need Help?
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link
            to="/contact"
            className="text-muted-foreground hover:text-primary"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
