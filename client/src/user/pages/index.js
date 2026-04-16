"use strict";
/**
 * User Pages Barrel Export
 *
 * User-related page components
 *
 * This file provides a centralized export point for all
 * user pages to improve import organization.
 *
 * Usage:
 * import { ComponentName } from '@user/pages'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettings = exports.UserProfile = exports.Tenants = exports.Team = exports.Dashboard = exports.Activity = void 0;
// Standard exports
var Activity_1 = require("./Activity");
Object.defineProperty(exports, "Activity", { enumerable: true, get: function () { return Activity_1.default; } });
var Dashboard_1 = require("./Dashboard");
Object.defineProperty(exports, "Dashboard", { enumerable: true, get: function () { return Dashboard_1.default; } });
var Team_1 = require("./Team");
Object.defineProperty(exports, "Team", { enumerable: true, get: function () { return Team_1.default; } });
var Tenants_1 = require("./Tenants");
Object.defineProperty(exports, "Tenants", { enumerable: true, get: function () { return Tenants_1.default; } });
var UserProfile_1 = require("./UserProfile");
Object.defineProperty(exports, "UserProfile", { enumerable: true, get: function () { return UserProfile_1.default; } });
var UserSettings_1 = require("./UserSettings");
Object.defineProperty(exports, "UserSettings", { enumerable: true, get: function () { return UserSettings_1.default; } });
