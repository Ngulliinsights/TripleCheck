#!/usr/bin/env tsx
"use strict";
/**
 * Simple database connection test
 * Run this to verify database connectivity before starting the app
 */
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var app_1 = require("./app");
function testDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var DATABASE_URL, sql, result, tableCheck, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    DATABASE_URL = process.env.DATABASE_URL;
                    if (!DATABASE_URL) {
                        console.error('❌ DATABASE_URL environment variable is not set');
                        process.exit(1);
                    }
                    console.log('🔍 Testing database connection...');
                    console.log('Database URL:', DATABASE_URL.replace(/:[^:@]*@/, ':***@')); // Hide password
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, 8, 11]);
                    // Create connection with minimal config
                    sql = (0, app_1.default)(DATABASE_URL, {
                        max: 1,
                        idle_timeout: 20,
                        connect_timeout: 10,
                        prepare: false,
                    });
                    return [4 /*yield*/, sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1 as test, NOW() as current_time"], ["SELECT 1 as test, NOW() as current_time"])))];
                case 2:
                    result = _a.sent();
                    console.log('✅ Database connection successful!');
                    console.log('Test result:', result[0]);
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n        SELECT table_name \n        FROM information_schema.tables \n        WHERE table_schema = 'public' \n        AND table_name IN ('users', 'properties', 'reviews')\n      "], ["\n        SELECT table_name \n        FROM information_schema.tables \n        WHERE table_schema = 'public' \n        AND table_name IN ('users', 'properties', 'reviews')\n      "])))];
                case 4:
                    tableCheck = _a.sent();
                    if (tableCheck.length > 0) {
                        console.log('✅ Found existing tables:', tableCheck.map(function (t) { return t.table_name; }).join(', '));
                    }
                    else {
                        console.log('⚠️  No application tables found - database may need migration');
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.log('⚠️  Could not check for tables (this is normal for new databases)');
                    return [3 /*break*/, 6];
                case 6: return [3 /*break*/, 11];
                case 7:
                    error_2 = _a.sent();
                    console.error('❌ Database connection failed:');
                    console.error(error_2 instanceof Error ? error_2.message : error_2);
                    process.exit(1);
                    return [3 /*break*/, 11];
                case 8:
                    if (!sql) return [3 /*break*/, 10];
                    return [4 /*yield*/, sql.end()];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10: return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testDatabaseConnection().catch(console.error);
var templateObject_1, templateObject_2;
