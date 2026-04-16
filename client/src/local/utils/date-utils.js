"use strict";
/**
 * Centralized date formatting utilities to eliminate redundancy across the app
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.formatBlogDate = formatBlogDate;
exports.formatKenyaDate = formatKenyaDate;
exports.formatPressDate = formatPressDate;
exports.formatMediaDate = formatMediaDate;
exports.isWithinDays = isWithinDays;
exports.getRelativeTime = getRelativeTime;
/**
 * Format date string with error handling and fallback
 */
function formatDate(dateString, options) {
    if (options === void 0) { options = {}; }
    if (!dateString)
        return 'Date not available';
    var _a = options.year, year = _a === void 0 ? 'numeric' : _a, _b = options.month, month = _b === void 0 ? 'long' : _b, _c = options.day, day = _c === void 0 ? 'numeric' : _c, _d = options.locale, locale = _d === void 0 ? 'en-US' : _d;
    try {
        return new Date(dateString).toLocaleDateString(locale, {
            year: year,
            month: month,
            day: day,
        });
    }
    catch (error) {
        // Invalid date format - fallback to original string
        console.warn('Invalid date format:', dateString, error);
        return dateString;
    }
}
/**
 * Format date for blog posts (short format)
 */
function formatBlogDate(dateString) {
    return formatDate(dateString, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
/**
 * Format date for Kenya locale
 */
function formatKenyaDate(dateString) {
    return formatDate(dateString, {
        locale: 'en-KE',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
/**
 * Format date for press releases
 */
function formatPressDate(dateString) {
    return formatDate(dateString, {
        locale: 'en-KE',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
/**
 * Format date for media features (short format)
 */
function formatMediaDate(dateString) {
    return formatDate(dateString, {
        locale: 'en-KE',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
/**
 * Check if a date is within the last N days
 */
function isWithinDays(dateString, days) {
    try {
        var date = new Date(dateString);
        var now = new Date();
        var daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= days;
    }
    catch (_a) {
        return false;
    }
}
/**
 * Get relative time string (e.g., "2 days ago")
 */
function getRelativeTime(dateString) {
    try {
        var date = new Date(dateString);
        var now = new Date();
        var diffInMs = now.getTime() - date.getTime();
        var diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        if (diffInDays === 0)
            return 'Today';
        if (diffInDays === 1)
            return 'Yesterday';
        if (diffInDays < 7)
            return "".concat(diffInDays, " days ago");
        if (diffInDays < 30)
            return "".concat(Math.floor(diffInDays / 7), " weeks ago");
        if (diffInDays < 365)
            return "".concat(Math.floor(diffInDays / 30), " months ago");
        return "".concat(Math.floor(diffInDays / 365), " years ago");
    }
    catch (_a) {
        return 'Unknown';
    }
}
