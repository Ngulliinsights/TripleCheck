"use strict";
/**
 * Auth Components Barrel Export
 *
 * Authentication-related UI components
 *
 * This file provides a centralized export point for all
 * auth components to improve import organization.
 *
 * Usage:
 * import { ComponentName } from '@auth/components'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorAuth = exports.RegistrationWizard = exports.PasswordReset = exports.LoginForm = void 0;
// Standard exports
var LoginForm_1 = require("./LoginForm");
Object.defineProperty(exports, "LoginForm", { enumerable: true, get: function () { return LoginForm_1.default; } });
var PasswordReset_1 = require("./PasswordReset");
Object.defineProperty(exports, "PasswordReset", { enumerable: true, get: function () { return PasswordReset_1.default; } });
var RegistrationWizard_1 = require("./RegistrationWizard");
Object.defineProperty(exports, "RegistrationWizard", { enumerable: true, get: function () { return RegistrationWizard_1.default; } });
var TwoFactorAuth_1 = require("./TwoFactorAuth");
Object.defineProperty(exports, "TwoFactorAuth", { enumerable: true, get: function () { return TwoFactorAuth_1.default; } });
