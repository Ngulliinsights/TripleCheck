/**
 * Centralized toast utilities to eliminate redundant toast patterns
 */

// Note: This assumes you have a toast function available
// You'll need to import your actual toast implementation
// import { toast } from "@/components/ui/use-toast" // Adjust import path

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

// Generic toast function - replace with your actual toast implementation
const showToast = (options: ToastOptions) => {
  // This is a placeholder - replace with your actual toast function
  console.log('Toast:', options);
  // toast(options);
};

/**
 * Success toast patterns
 */
export const successToasts = {
  saved: (item: string = "Changes") => showToast({
    title: `${item} saved successfully`,
    description: "Your changes have been saved",
    variant: "success"
  }),
  
  uploaded: (count: number, item: string = "files") => showToast({
    title: "Upload successful",
    description: `${count} ${item} uploaded successfully`,
    variant: "success"
  }),
  
  submitted: (item: string = "Form") => showToast({
    title: `${item} submitted successfully`,
    description: "Your submission has been received",
    variant: "success"
  }),
  
  published: (item: string = "Content") => showToast({
    title: `${item} published successfully`,
    description: "Your content is now live",
    variant: "success"
  }),
  
  sent: (item: string = "Message") => showToast({
    title: `${item} sent`,
    description: "Your message has been sent successfully",
    variant: "success"
  }),
  
  copied: (item: string = "Link") => showToast({
    title: `${item} copied`,
    description: "Copied to clipboard",
    variant: "success"
  })
};

/**
 * Error toast patterns
 */
export const errorToasts = {
  generic: (action: string = "complete the action") => showToast({
    title: "Something went wrong",
    description: `Unable to ${action}. Please try again.`,
    variant: "destructive"
  }),
  
  network: () => showToast({
    title: "Connection error",
    description: "Please check your internet connection and try again.",
    variant: "destructive"
  }),
  
  validation: (field: string) => showToast({
    title: "Validation error",
    description: `Please check the ${field} field and try again.`,
    variant: "destructive"
  }),
  
  required: (fields: string[]) => showToast({
    title: "Missing required fields",
    description: `Please complete: ${fields.join(", ")}`,
    variant: "destructive"
  }),
  
  fileSize: (maxSize: string) => showToast({
    title: "File too large",
    description: `File exceeds ${maxSize} limit`,
    variant: "destructive"
  }),
  
  fileType: (allowedTypes: string[]) => showToast({
    title: "Invalid file type",
    description: `Supported formats: ${allowedTypes.join(", ")}`,
    variant: "destructive"
  }),
  
  unauthorized: () => showToast({
    title: "Access denied",
    description: "You don't have permission to perform this action.",
    variant: "destructive"
  }),
  
  timeout: () => showToast({
    title: "Request timeout",
    description: "The request took too long. Please try again.",
    variant: "destructive"
  })
};

/**
 * Info toast patterns
 */
export const infoToasts = {
  loading: (action: string) => showToast({
    title: "Processing...",
    description: `${action} in progress`,
    duration: 2000
  }),
  
  saved: (item: string = "Draft") => showToast({
    title: `${item} saved`,
    description: "Your progress has been saved automatically"
  }),
  
  updated: (item: string = "Content") => showToast({
    title: `${item} updated`,
    description: "Changes will be reflected shortly"
  })
};

/**
 * Property-specific toast patterns
 */
export const propertyToasts = {
  listed: () => successToasts.published("Property listing"),
  updated: () => successToasts.saved("Property"),
  photosUploaded: (count: number) => successToasts.uploaded(count, "photos"),
  reviewSubmitted: () => successToasts.submitted("Review"),
  optimized: () => successToasts.saved("Property optimization")
};

/**
 * Auth-specific toast patterns
 */
export const authToasts = {
  loginSuccess: () => showToast({
    title: "Welcome back!",
    description: "You have been logged in successfully",
    variant: "success"
  }),
  
  logoutSuccess: () => showToast({
    title: "Logged out",
    description: "You have been logged out successfully"
  }),
  
  passwordReset: () => showToast({
    title: "Password reset email sent",
    description: "Check your email for reset instructions"
  }),
  
  accountLocked: (timeRemaining: string) => showToast({
    title: "Account temporarily locked",
    description: `Try again in ${timeRemaining}`,
    variant: "destructive"
  })
};

/**
 * Communication-specific toast patterns
 */
export const communicationToasts = {
  messageSent: () => successToasts.sent("Message"),
  replySent: () => successToasts.sent("Reply"),
  contactRevealed: () => showToast({
    title: "Contact information revealed",
    description: "You can now contact this person directly. Your credit has been deducted.",
    variant: "success"
  })
};