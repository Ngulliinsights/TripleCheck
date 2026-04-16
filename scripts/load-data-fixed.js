#!/usr/bin/env tsx
"use strict";
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
var serverless_1 = require("@neondatabase/serverless");
var bcrypt = require("./add-b2b-messaging");
var neon_http_1 = require("drizzle-orm/neon-http");
var schema_1 = require("../src/local/schema");
var logger = {
    info: function (message) { return console.log("\u2139\uFE0F  ".concat(message)); },
    success: function (message) { return console.log("\u2705 ".concat(message)); },
    warn: function (message) { return console.warn("\u26A0\uFE0F  ".concat(message)); },
    error: function (message) { return console.error("\u274C ".concat(message)); },
};
function loadData() {
    return __awaiter(this, void 0, void 0, function () {
        var sql, db, userData, _a, _b, hashedPassword, batchSize, processedUsers, insertedUsers, seenEmails, seenUsernames, i, batch, validUsers, _i, _c, _d, index, user, email, baseUsername, username, attempt, batchInserted, error_1, propertyData, _e, _f, userIds, processedProperties, insertedProperties, i, batch, validProperties, _g, batch_1, property, randomOwnerIndex, ownerId, batchInserted, error_2, propertyIds, reviewTemplates, targetReviews, insertedReviews, i, batchSize_1, reviewBatch, j, template, randomPropertyIndex, randomUserIndex, error_3, error_4;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _h.trys.push([0, 33, , 34]);
                    logger.info("🚀 Starting data loading...");
                    sql = (0, serverless_1.neon)(process.env.DATABASE_URL);
                    db = (0, neon_http_1.drizzle)(sql);
                    // Clear existing data
                    logger.info("🗑️ Clearing existing data...");
                    return [4 /*yield*/, db.delete(schema_1.reviews)];
                case 1:
                    _h.sent();
                    return [4 /*yield*/, db.delete(schema_1.properties)];
                case 2:
                    _h.sent();
                    return [4 /*yield*/, db.delete(schema_1.users)];
                case 3:
                    _h.sent();
                    logger.success("Existing data cleared");
                    // Load user data
                    logger.info("👥 Loading user data...");
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, fs.readFile("scripts/data-generation/fraudulent_user_dataset.json", "utf8")];
                case 4:
                    userData = _b.apply(_a, [_h.sent()]);
                    logger.info("Found ".concat(userData.length, " users in dataset"));
                    return [4 /*yield*/, bcrypt.hash("demo123", 12)];
                case 5:
                    hashedPassword = _h.sent();
                    batchSize = 25;
                    processedUsers = 0;
                    insertedUsers = [];
                    seenEmails = new Set();
                    seenUsernames = new Set();
                    i = 0;
                    _h.label = 6;
                case 6:
                    if (!(i < Math.min(userData.length, 500))) return [3 /*break*/, 13];
                    batch = userData.slice(i, i + batchSize);
                    validUsers = [];
                    for (_i = 0, _c = batch.entries(); _i < _c.length; _i++) {
                        _d = _c[_i], index = _d[0], user = _d[1];
                        // Skip if missing required fields
                        if (!user.email || !user.firstName || !user.lastName)
                            continue;
                        email = user.email.toLowerCase();
                        // Skip if email already seen
                        if (seenEmails.has(email))
                            continue;
                        baseUsername = "".concat(user.firstName.toLowerCase(), "_").concat(user.lastName.toLowerCase());
                        username = "".concat(baseUsername, "_").concat(i + index);
                        attempt = 0;
                        while (seenUsernames.has(username) && attempt < 10) {
                            username = "".concat(baseUsername, "_").concat(i + index, "_").concat(attempt);
                            attempt++;
                        }
                        // Ensure username is not too long
                        username = username.substring(0, 50);
                        // Skip if still duplicate
                        if (seenUsernames.has(username))
                            continue;
                        seenEmails.add(email);
                        seenUsernames.add(username);
                        validUsers.push({
                            username: username,
                            email: email,
                            password: hashedPassword,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            phone: user.phone || null,
                            trustScore: user.trustScore || 50,
                            role: "user",
                            isVerifiedAgent: user.userType === "agent" || Math.random() > 0.9,
                        });
                    }
                    if (!(validUsers.length > 0)) return [3 /*break*/, 10];
                    _h.label = 7;
                case 7:
                    _h.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, db.insert(schema_1.users).values(validUsers).returning()];
                case 8:
                    batchInserted = _h.sent();
                    insertedUsers.push.apply(insertedUsers, batchInserted);
                    processedUsers += batchInserted.length;
                    logger.info("   \u2705 Batch ".concat(Math.floor(i / batchSize) + 1, ": Inserted ").concat(batchInserted.length, " users (Total: ").concat(processedUsers, ")"));
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _h.sent();
                    logger.warn("   \u26A0\uFE0F  Batch ".concat(Math.floor(i / batchSize) + 1, ": Skipped due to constraints - ").concat(error_1));
                    return [3 /*break*/, 10];
                case 10: 
                // Small delay to prevent overwhelming the database
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                case 11:
                    // Small delay to prevent overwhelming the database
                    _h.sent();
                    _h.label = 12;
                case 12:
                    i += batchSize;
                    return [3 /*break*/, 6];
                case 13:
                    logger.success("Successfully inserted ".concat(insertedUsers.length, " users"));
                    if (insertedUsers.length === 0) {
                        logger.error("No users were inserted. Cannot proceed with properties.");
                        return [2 /*return*/];
                    }
                    // Load property data
                    logger.info("\n🏠 Loading property data...");
                    _f = (_e = JSON).parse;
                    return [4 /*yield*/, fs.readFile("scripts/data-generation/fraudulent_property_dataset.json", "utf8")];
                case 14:
                    propertyData = _f.apply(_e, [_h.sent()]);
                    logger.info("Found ".concat(propertyData.length, " properties in dataset"));
                    userIds = insertedUsers.map(function (u) { return u.id; }).filter(function (id) { return id !== undefined; });
                    processedProperties = 0;
                    insertedProperties = [];
                    i = 0;
                    _h.label = 15;
                case 15:
                    if (!(i < Math.min(propertyData.length, 800))) return [3 /*break*/, 22];
                    batch = propertyData.slice(i, i + batchSize);
                    validProperties = [];
                    for (_g = 0, batch_1 = batch; _g < batch_1.length; _g++) {
                        property = batch_1[_g];
                        if (!property.title || !property.description || !property.location || !property.price) {
                            continue;
                        }
                        randomOwnerIndex = Math.floor(Math.random() * userIds.length);
                        ownerId = userIds[randomOwnerIndex];
                        validProperties.push({
                            ownerId: ownerId,
                            title: property.title.substring(0, 255), // Ensure title fits
                            description: property.description,
                            location: property.location,
                            price: Math.abs(Number(property.price)).toString(), // Ensure positive price
                            imageUrls: property.imageUrls || [],
                            features: {
                                bedrooms: property.bedrooms || Math.floor(Math.random() * 4) + 1,
                                bathrooms: property.bathrooms || Math.floor(Math.random() * 3) + 1,
                                squareFeet: property.squareFeet || Math.floor(Math.random() * 2000) + 500,
                                parkingSpaces: Math.floor(Math.random() * 3),
                                yearBuilt: Math.floor(Math.random() * 30) + 1995,
                                amenities: property.amenities || [],
                                petFriendly: Math.random() > 0.5,
                                furnished: Math.random() > 0.5,
                                propertyType: "apartment",
                            },
                            verificationStatus: Math.random() > 0.7 ? "verified" : "pending",
                        });
                    }
                    if (!(validProperties.length > 0)) return [3 /*break*/, 19];
                    _h.label = 16;
                case 16:
                    _h.trys.push([16, 18, , 19]);
                    return [4 /*yield*/, db.insert(schema_1.properties).values(validProperties).returning()];
                case 17:
                    batchInserted = _h.sent();
                    insertedProperties.push.apply(insertedProperties, batchInserted);
                    processedProperties += batchInserted.length;
                    logger.info("   \u2705 Batch ".concat(Math.floor(i / batchSize) + 1, ": Inserted ").concat(batchInserted.length, " properties (Total: ").concat(processedProperties, ")"));
                    return [3 /*break*/, 19];
                case 18:
                    error_2 = _h.sent();
                    logger.warn("   \u26A0\uFE0F  Batch ".concat(Math.floor(i / batchSize) + 1, ": Skipped due to error - ").concat(error_2));
                    return [3 /*break*/, 19];
                case 19: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                case 20:
                    _h.sent();
                    _h.label = 21;
                case 21:
                    i += batchSize;
                    return [3 /*break*/, 15];
                case 22:
                    logger.success("Successfully inserted ".concat(insertedProperties.length, " properties"));
                    // Generate some reviews
                    logger.info("\n⭐ Generating reviews...");
                    propertyIds = insertedProperties.map(function (p) { return p.id; }).filter(function (id) { return id !== undefined; });
                    if (!(propertyIds.length === 0)) return [3 /*break*/, 23];
                    logger.warn("No properties available for reviews");
                    return [3 /*break*/, 32];
                case 23:
                    reviewTemplates = [
                        { rating: 5, comment: "Excellent property! Highly recommended. Great location and amenities." },
                        { rating: 4, comment: "Very good property with nice features. Would recommend to others." },
                        { rating: 4, comment: "Good value for money. Clean and well-maintained property." },
                        { rating: 3, comment: "Decent property, meets basic requirements. Average experience." },
                        { rating: 2, comment: "Below expectations. Several issues need to be addressed." },
                    ];
                    targetReviews = Math.min(200, Math.floor(propertyIds.length * 0.4));
                    insertedReviews = 0;
                    i = 0;
                    _h.label = 24;
                case 24:
                    if (!(i < targetReviews)) return [3 /*break*/, 31];
                    batchSize_1 = Math.min(15, targetReviews - i);
                    reviewBatch = [];
                    for (j = 0; j < batchSize_1; j++) {
                        template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
                        randomPropertyIndex = Math.floor(Math.random() * propertyIds.length);
                        randomUserIndex = Math.floor(Math.random() * userIds.length);
                        reviewBatch.push({
                            propertyId: propertyIds[randomPropertyIndex],
                            userId: userIds[randomUserIndex],
                            rating: template.rating,
                            comment: template.comment,
                        });
                    }
                    _h.label = 25;
                case 25:
                    _h.trys.push([25, 27, , 28]);
                    return [4 /*yield*/, db.insert(schema_1.reviews).values(reviewBatch)];
                case 26:
                    _h.sent();
                    insertedReviews += reviewBatch.length;
                    logger.info("   \u2705 Batch ".concat(Math.floor(i / 15) + 1, ": Inserted ").concat(reviewBatch.length, " reviews (Total: ").concat(insertedReviews, ")"));
                    return [3 /*break*/, 28];
                case 27:
                    error_3 = _h.sent();
                    logger.warn("   \u26A0\uFE0F  Review batch ".concat(Math.floor(i / 15) + 1, ": Some duplicates skipped"));
                    return [3 /*break*/, 28];
                case 28: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 29:
                    _h.sent();
                    _h.label = 30;
                case 30:
                    i += 15;
                    return [3 /*break*/, 24];
                case 31:
                    logger.success("Successfully inserted ".concat(insertedReviews, " reviews"));
                    _h.label = 32;
                case 32:
                    // Final summary
                    logger.info("\n🎉 Data loading completed successfully!");
                    logger.info("📊 Final counts:");
                    logger.info("   Users: ".concat(insertedUsers.length));
                    logger.info("   Properties: ".concat(insertedProperties.length));
                    logger.info("   Reviews: ".concat(insertedReviews || 0));
                    logger.info("\n💡 Database now has substantial realistic data for testing!");
                    logger.info("🚀 Ready for deployment!");
                    return [3 /*break*/, 34];
                case 33:
                    error_4 = _h.sent();
                    logger.error("❌ Data loading failed:");
                    logger.error(error_4);
                    process.exit(1);
                    return [3 /*break*/, 34];
                case 34: return [2 /*return*/];
            }
        });
    });
}
loadData();
