"use strict";
/**
 * Utility functions for formatting data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatNumber = exports.formatDate = exports.formatPrice = void 0;
/**
 * Format price in Kenyan Shillings
 */
var formatPrice = function (price) {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0,
    }).format(price);
};
exports.formatPrice = formatPrice;
/**
 * Format date in a readable format
 */
var formatDate = function (date) {
    return new Intl.DateTimeFormat("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(date));
};
exports.formatDate = formatDate;
/**
 * Format number with commas
 */
var formatNumber = function (num) {
    return num.toLocaleString();
};
exports.formatNumber = formatNumber;
