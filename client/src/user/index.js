"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tenants = exports.Team = exports.Dashboard = exports.UserNotifications = exports.UserProfile = void 0;
// User Domain Exports
__exportStar(require("./hooks/useUser"), exports);
// Components
var UserProfile_1 = require("./components/UserProfile");
Object.defineProperty(exports, "UserProfile", { enumerable: true, get: function () { return UserProfile_1.UserProfile; } });
var UserNotifications_1 = require("./components/UserNotifications");
Object.defineProperty(exports, "UserNotifications", { enumerable: true, get: function () { return UserNotifications_1.UserNotifications; } });
// Pages
var Dashboard_1 = require("./pages/Dashboard");
Object.defineProperty(exports, "Dashboard", { enumerable: true, get: function () { return Dashboard_1.default; } });
var Team_1 = require("./pages/Team");
Object.defineProperty(exports, "Team", { enumerable: true, get: function () { return Team_1.default; } });
var Tenants_1 = require("./pages/Tenants");
Object.defineProperty(exports, "Tenants", { enumerable: true, get: function () { return Tenants_1.default; } });
