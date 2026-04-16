"use strict";
/**
 * User Components Barrel Export
 *
 * User-related UI components
 *
 * This file provides a centralized export point for all
 * user components to improve import organization.
 *
 * Usage:
 * import { ComponentName } from '@user/components'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfile = exports.UserNotifications = void 0;
// Standard exports
var UserNotifications_1 = require("./UserNotifications");
Object.defineProperty(exports, "UserNotifications", { enumerable: true, get: function () { return UserNotifications_1.default; } });
var UserProfile_1 = require("./UserProfile");
Object.defineProperty(exports, "UserProfile", { enumerable: true, get: function () { return UserProfile_1.default; } });
