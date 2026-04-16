"use strict";
/**
 * Centralized toast utilities to eliminate redundant toast patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.communicationToasts = exports.authToasts = exports.propertyToasts = exports.infoToasts = exports.errorToasts = exports.successToasts = void 0;
// Generic toast function - replace with your actual toast implementation
var showToast = function (options) {
    // This is a placeholder - replace with your actual toast function
    console.log('Toast:', options);
    // toast(options);
};
/**
 * Success toast patterns
 */
exports.successToasts = {
    saved: function (item) {
        if (item === void 0) { item = "Changes"; }
        return showToast({
            title: "".concat(item, " saved successfully"),
            description: "Your changes have been saved",
            variant: "success"
        });
    },
    uploaded: function (count, item) {
        if (item === void 0) { item = "files"; }
        return showToast({
            title: "Upload successful",
            description: "".concat(count, " ").concat(item, " uploaded successfully"),
            variant: "success"
        });
    },
    submitted: function (item) {
        if (item === void 0) { item = "Form"; }
        return showToast({
            title: "".concat(item, " submitted successfully"),
            description: "Your submission has been received",
            variant: "success"
        });
    },
    published: function (item) {
        if (item === void 0) { item = "Content"; }
        return showToast({
            title: "".concat(item, " published successfully"),
            description: "Your content is now live",
            variant: "success"
        });
    },
    sent: function (item) {
        if (item === void 0) { item = "Message"; }
        return showToast({
            title: "".concat(item, " sent"),
            description: "Your message has been sent successfully",
            variant: "success"
        });
    },
    copied: function (item) {
        if (item === void 0) { item = "Link"; }
        return showToast({
            title: "".concat(item, " copied"),
            description: "Copied to clipboard",
            variant: "success"
        });
    }
};
/**
 * Error toast patterns
 */
exports.errorToasts = {
    generic: function (action) {
        if (action === void 0) { action = "complete the action"; }
        return showToast({
            title: "Something went wrong",
            description: "Unable to ".concat(action, ". Please try again."),
            variant: "destructive"
        });
    },
    network: function () { return showToast({
        title: "Connection error",
        description: "Please check your internet connection and try again.",
        variant: "destructive"
    }); },
    validation: function (field) { return showToast({
        title: "Validation error",
        description: "Please check the ".concat(field, " field and try again."),
        variant: "destructive"
    }); },
    required: function (fields) { return showToast({
        title: "Missing required fields",
        description: "Please complete: ".concat(fields.join(", ")),
        variant: "destructive"
    }); },
    fileSize: function (maxSize) { return showToast({
        title: "File too large",
        description: "File exceeds ".concat(maxSize, " limit"),
        variant: "destructive"
    }); },
    fileType: function (allowedTypes) { return showToast({
        title: "Invalid file type",
        description: "Supported formats: ".concat(allowedTypes.join(", ")),
        variant: "destructive"
    }); },
    unauthorized: function () { return showToast({
        title: "Access denied",
        description: "You don't have permission to perform this action.",
        variant: "destructive"
    }); },
    timeout: function () { return showToast({
        title: "Request timeout",
        description: "The request took too long. Please try again.",
        variant: "destructive"
    }); }
};
/**
 * Info toast patterns
 */
exports.infoToasts = {
    loading: function (action) { return showToast({
        title: "Processing...",
        description: "".concat(action, " in progress"),
        duration: 2000
    }); },
    saved: function (item) {
        if (item === void 0) { item = "Draft"; }
        return showToast({
            title: "".concat(item, " saved"),
            description: "Your progress has been saved automatically"
        });
    },
    updated: function (item) {
        if (item === void 0) { item = "Content"; }
        return showToast({
            title: "".concat(item, " updated"),
            description: "Changes will be reflected shortly"
        });
    }
};
/**
 * Property-specific toast patterns
 */
exports.propertyToasts = {
    listed: function () { return exports.successToasts.published("Property listing"); },
    updated: function () { return exports.successToasts.saved("Property"); },
    photosUploaded: function (count) { return exports.successToasts.uploaded(count, "photos"); },
    reviewSubmitted: function () { return exports.successToasts.submitted("Review"); },
    optimized: function () { return exports.successToasts.saved("Property optimization"); }
};
/**
 * Auth-specific toast patterns
 */
exports.authToasts = {
    loginSuccess: function () { return showToast({
        title: "Welcome back!",
        description: "You have been logged in successfully",
        variant: "success"
    }); },
    logoutSuccess: function () { return showToast({
        title: "Logged out",
        description: "You have been logged out successfully"
    }); },
    passwordReset: function () { return showToast({
        title: "Password reset email sent",
        description: "Check your email for reset instructions"
    }); },
    accountLocked: function (timeRemaining) { return showToast({
        title: "Account temporarily locked",
        description: "Try again in ".concat(timeRemaining),
        variant: "destructive"
    }); }
};
/**
 * Communication-specific toast patterns
 */
exports.communicationToasts = {
    messageSent: function () { return exports.successToasts.sent("Message"); },
    replySent: function () { return exports.successToasts.sent("Reply"); },
    contactRevealed: function () { return showToast({
        title: "Contact information revealed",
        description: "You can now contact this person directly. Your credit has been deducted.",
        variant: "success"
    }); }
};
