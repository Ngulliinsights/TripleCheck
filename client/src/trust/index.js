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
exports.Reviews = exports.TrustPoints = exports.Reputation = exports.Karma = exports.Alerts = exports.Reports = exports.DocumentAuth = exports.FraudDetection = exports.BasicChecks = exports.VerificationBadge = exports.TrustScore = void 0;
// Trust Domain Exports
__exportStar(require("./types/trust.types"), exports);
__exportStar(require("./hooks/useTrustScore"), exports);
__exportStar(require("./hooks/useFraudDetection"), exports);
// Components
var TrustScore_1 = require("./components/TrustScore");
Object.defineProperty(exports, "TrustScore", { enumerable: true, get: function () { return TrustScore_1.default; } });
var VerificationBadge_1 = require("./components/VerificationBadge");
Object.defineProperty(exports, "VerificationBadge", { enumerable: true, get: function () { return VerificationBadge_1.default; } });
// Pages
var BasicChecks_1 = require("./pages/BasicChecks");
Object.defineProperty(exports, "BasicChecks", { enumerable: true, get: function () { return BasicChecks_1.default; } });
var FraudDetection_1 = require("./pages/FraudDetection");
Object.defineProperty(exports, "FraudDetection", { enumerable: true, get: function () { return FraudDetection_1.default; } });
var DocumentAuth_1 = require("./pages/DocumentAuth");
Object.defineProperty(exports, "DocumentAuth", { enumerable: true, get: function () { return DocumentAuth_1.default; } });
var Reports_1 = require("./pages/Reports");
Object.defineProperty(exports, "Reports", { enumerable: true, get: function () { return Reports_1.default; } });
var Alerts_1 = require("./pages/Alerts");
Object.defineProperty(exports, "Alerts", { enumerable: true, get: function () { return Alerts_1.default; } });
var Karma_1 = require("./pages/Karma");
Object.defineProperty(exports, "Karma", { enumerable: true, get: function () { return Karma_1.default; } });
var Reputation_1 = require("./pages/Reputation");
Object.defineProperty(exports, "Reputation", { enumerable: true, get: function () { return Reputation_1.default; } });
var TrustPoints_1 = require("./pages/TrustPoints");
Object.defineProperty(exports, "TrustPoints", { enumerable: true, get: function () { return TrustPoints_1.default; } });
var Reviews_1 = require("./pages/Reviews");
Object.defineProperty(exports, "Reviews", { enumerable: true, get: function () { return Reviews_1.default; } });
