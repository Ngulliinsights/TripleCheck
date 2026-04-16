"use strict";
/**
 * Integration Test Endpoint
 * Tests the complete integration between frontend, backend, and database
 */
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
exports.testIntegrationRouter = void 0;
var express_1 = require("express");
var init_1 = require("./infrastructure/database/init");
var router = (0, express_1.Router)();
exports.testIntegrationRouter = router;
// Test database connection and basic CRUD operations
router.get('/api/test/integration', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var db, connectionTest, propertiesTest, usersTest, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                db = (0, init_1.getDatabase)();
                return [4 /*yield*/, db.execute('SELECT 1 as test')];
            case 1:
                connectionTest = _a.sent();
                return [4 /*yield*/, db.query.properties.findMany({
                        limit: 3,
                        with: {
                        // Add any relations if needed
                        }
                    })];
            case 2:
                propertiesTest = _a.sent();
                return [4 /*yield*/, db.query.users.findMany({
                        limit: 3,
                        columns: {
                            id: true,
                            username: true,
                            email: true,
                            role: true,
                            trustScore: true
                        }
                    })];
            case 3:
                usersTest = _a.sent();
                res.json({
                    success: true,
                    message: 'Integration test passed',
                    data: {
                        database: {
                            connected: true,
                            connectionTest: connectionTest.length > 0
                        },
                        properties: {
                            count: propertiesTest.length,
                            sample: propertiesTest.map(function (p) { return ({
                                id: p.id,
                                title: p.title,
                                price: p.price,
                                location: p.location,
                                verificationStatus: p.verificationStatus
                            }); })
                        },
                        users: {
                            count: usersTest.length,
                            sample: usersTest.map(function (u) { return ({
                                id: u.id,
                                username: u.username,
                                role: u.role,
                                trustScore: u.trustScore
                            }); })
                        }
                    },
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error('Integration test failed:', error_1);
                res.status(500).json({
                    success: false,
                    error: 'Integration test failed',
                    message: error_1 instanceof Error ? error_1.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Test property API endpoints
router.get('/api/test/properties', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var db, properties, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                db = (0, init_1.getDatabase)();
                return [4 /*yield*/, db.query.properties.findMany({
                        limit: 10,
                        orderBy: function (properties, _a) {
                            var desc = _a.desc;
                            return [desc(properties.createdAt)];
                        }
                    })];
            case 1:
                properties = _a.sent();
                res.json({
                    success: true,
                    data: properties,
                    total: properties.length,
                    page: 1,
                    limit: 10,
                    hasNext: false,
                    hasPrev: false
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Properties test failed:', error_2);
                res.status(500).json({
                    success: false,
                    error: 'Properties test failed',
                    message: error_2 instanceof Error ? error_2.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Test single property endpoint
router.get('/api/test/properties/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var db, id_1, property, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                db = (0, init_1.getDatabase)();
                id_1 = req.params.id;
                return [4 /*yield*/, db.query.properties.findFirst({
                        where: function (properties, _a) {
                            var eq = _a.eq;
                            return eq(properties.id, parseInt(id_1));
                        }
                    })];
            case 1:
                property = _a.sent();
                if (!property) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            error: 'Property not found',
                            message: "Property with ID ".concat(id_1, " was not found")
                        })];
                }
                res.json({
                    success: true,
                    data: property,
                    cached: false
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Single property test failed:', error_3);
                res.status(500).json({
                    success: false,
                    error: 'Single property test failed',
                    message: error_3 instanceof Error ? error_3.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
