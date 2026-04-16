#!/usr/bin/env tsx
"use strict";
/**
 * Quick Recovery Script
 * Restores users and properties, then loads transactions and statistics
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
require("dotenv/config");
var fs = require("./add-b2b-messaging");
var path = require("./fix-core-import-paths");
var serverless_1 = require("@neondatabase/serverless");
var bcrypt = require("./add-b2b-messaging");
var neon_http_1 = require("drizzle-orm/neon-http");
var schema_1 = require("../src/local/schema");
function quickRecovery() {
    return __awaiter(this, void 0, void 0, function () {
        var sql, db, userFile, userData, _a, _b, usersToLoad, hashedPassword_1, userInserts, insertedUsers, propertyFile, propertyData, _c, _d, propertiesToLoad, userIds_1, propertyInserts, insertedProperties, reviewInserts, i, transactionFile, transactionData, _e, _f, transactionsToLoad, propertyIds_1, transactionInserts, insertedTransactions, statisticInserts, error_1;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 10, , 11]);
                    console.log('🚨 Quick Recovery: Restoring your data...');
                    sql = (0, serverless_1.neon)(process.env.DATABASE_URL);
                    db = (0, neon_http_1.drizzle)(sql);
                    // Load users first
                    console.log('👥 Restoring users...');
                    userFile = path.join(process.cwd(), 'scripts', 'data-generation', 'user_dataset.json');
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, fs.readFile(userFile, 'utf8')];
                case 1:
                    userData = _b.apply(_a, [_g.sent()]);
                    usersToLoad = userData.slice(0, 1000);
                    return [4 /*yield*/, bcrypt.hash('test_password_2024', 12)];
                case 2:
                    hashedPassword_1 = _g.sent();
                    userInserts = usersToLoad.map(function (user, index) {
                        var _a, _b, _c, _d;
                        return ({
                            username: "".concat((_a = user.firstName) === null || _a === void 0 ? void 0 : _a.toLowerCase(), "_").concat((_b = user.lastName) === null || _b === void 0 ? void 0 : _b.toLowerCase(), "_").concat(Date.now(), "_").concat(index).substring(0, 50),
                            email: "".concat((_c = user.firstName) === null || _c === void 0 ? void 0 : _c.toLowerCase(), ".").concat((_d = user.lastName) === null || _d === void 0 ? void 0 : _d.toLowerCase(), ".").concat(index, "@example.com"), // Ensure unique emails
                            password: hashedPassword_1,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            phone: user.phone,
                            trustScore: user.trustScore || 50,
                            role: "user",
                            isVerifiedAgent: false,
                        });
                    });
                    return [4 /*yield*/, db.insert(schema_1.users).values(userInserts).returning()];
                case 3:
                    insertedUsers = _g.sent();
                    console.log("\u2705 Restored ".concat(insertedUsers.length, " users"));
                    // Load properties
                    console.log('🏠 Restoring properties...');
                    propertyFile = path.join(process.cwd(), 'scripts', 'data-generation', 'property_dataset.json');
                    _d = (_c = JSON).parse;
                    return [4 /*yield*/, fs.readFile(propertyFile, 'utf8')];
                case 4:
                    propertyData = _d.apply(_c, [_g.sent()]);
                    propertiesToLoad = propertyData.slice(0, 1500);
                    userIds_1 = insertedUsers.map(function (u) { return u.id; });
                    propertyInserts = propertiesToLoad.map(function (property) {
                        var _a, _b, _c, _d, _e, _f, _g, _h;
                        return ({
                            ownerId: userIds_1[Math.floor(Math.random() * userIds_1.length)],
                            title: property.title,
                            description: property.description,
                            location: property.location,
                            price: property.price.toString(),
                            imageUrls: property.imageUrls || [],
                            features: {
                                bedrooms: ((_a = property.features) === null || _a === void 0 ? void 0 : _a.bedrooms) || 1,
                                bathrooms: ((_b = property.features) === null || _b === void 0 ? void 0 : _b.bathrooms) || 1,
                                squareFeet: ((_c = property.features) === null || _c === void 0 ? void 0 : _c.squareFeet) || 1000,
                                parkingSpaces: ((_d = property.features) === null || _d === void 0 ? void 0 : _d.parkingSpaces) || 0,
                                yearBuilt: ((_e = property.features) === null || _e === void 0 ? void 0 : _e.yearBuilt) || 2020,
                                amenities: ((_f = property.features) === null || _f === void 0 ? void 0 : _f.amenities) || [],
                                petFriendly: ((_g = property.features) === null || _g === void 0 ? void 0 : _g.petFriendly) || false,
                                furnished: ((_h = property.features) === null || _h === void 0 ? void 0 : _h.furnished) || false,
                                propertyType: property.propertyType || "apartment",
                            },
                        });
                    });
                    return [4 /*yield*/, db.insert(schema_1.properties).values(propertyInserts).returning()];
                case 5:
                    insertedProperties = _g.sent();
                    console.log("\u2705 Restored ".concat(insertedProperties.length, " properties"));
                    // Generate some reviews
                    console.log('⭐ Adding reviews...');
                    reviewInserts = [];
                    for (i = 0; i < 200; i++) {
                        reviewInserts.push({
                            propertyId: insertedProperties[Math.floor(Math.random() * insertedProperties.length)].id,
                            userId: insertedUsers[Math.floor(Math.random() * insertedUsers.length)].id,
                            rating: Math.floor(Math.random() * 5) + 1,
                            comment: "Great property! Review #".concat(i + 1),
                        });
                    }
                    return [4 /*yield*/, db.insert(schema_1.reviews).values(reviewInserts)];
                case 6:
                    _g.sent();
                    console.log("\u2705 Added ".concat(reviewInserts.length, " reviews"));
                    // Now load transactions
                    console.log('💰 Loading transactions...');
                    transactionFile = path.join(process.cwd(), 'scripts', 'data-generation', 'transaction_dataset.json');
                    _f = (_e = JSON).parse;
                    return [4 /*yield*/, fs.readFile(transactionFile, 'utf8')];
                case 7:
                    transactionData = _f.apply(_e, [_g.sent()]);
                    transactionsToLoad = transactionData.slice(0, 500);
                    propertyIds_1 = insertedProperties.map(function (p) { return p.id; });
                    transactionInserts = transactionsToLoad.map(function (transaction) { return ({
                        externalId: transaction.id,
                        userId: userIds_1[Math.floor(Math.random() * userIds_1.length)],
                        propertyId: propertyIds_1[Math.floor(Math.random() * propertyIds_1.length)],
                        transactionType: transaction.transactionType,
                        amount: transaction.amount.toString(),
                        transactionDate: new Date(transaction.transactionDate),
                        status: transaction.status,
                        otherParties: transaction.otherParties || [],
                        isSuspicious: transaction.isSuspicious || false,
                        fraudScore: Math.floor(Math.random() * 30),
                        notes: "Recovered transaction",
                    }); });
                    return [4 /*yield*/, db.insert(schema_1.transactions).values(transactionInserts).returning()];
                case 8:
                    insertedTransactions = _g.sent();
                    console.log("\u2705 Loaded ".concat(insertedTransactions.length, " transactions"));
                    // Load basic statistics
                    console.log('📊 Loading statistics...');
                    statisticInserts = [
                        {
                            metricType: 'user_count',
                            metricKey: 'total',
                            metricValue: { count: insertedUsers.length },
                            periodType: 'all_time',
                        },
                        {
                            metricType: 'property_count',
                            metricKey: 'total',
                            metricValue: { count: insertedProperties.length },
                            periodType: 'all_time',
                        },
                        {
                            metricType: 'transaction_count',
                            metricKey: 'total',
                            metricValue: { count: insertedTransactions.length },
                            periodType: 'all_time',
                        },
                    ];
                    return [4 /*yield*/, db.insert(schema_1.statistics).values(statisticInserts)];
                case 9:
                    _g.sent();
                    console.log("\u2705 Loaded ".concat(statisticInserts.length, " statistics"));
                    console.log('\n🎉 Quick recovery completed!');
                    console.log("   \uD83D\uDC65 Users: ".concat(insertedUsers.length));
                    console.log("   \uD83C\uDFE0 Properties: ".concat(insertedProperties.length));
                    console.log("   \u2B50 Reviews: ".concat(reviewInserts.length));
                    console.log("   \uD83D\uDCB0 Transactions: ".concat(insertedTransactions.length));
                    console.log("   \uD83D\uDCCA Statistics: ".concat(statisticInserts.length));
                    console.log('\n✅ Your app is ready for testing with transaction and fraud data!');
                    return [3 /*break*/, 11];
                case 10:
                    error_1 = _g.sent();
                    console.error('❌ Recovery failed:', error_1);
                    throw error_1;
                case 11: return [2 /*return*/];
            }
        });
    });
}
quickRecovery();
