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
exports.TEST_DATA = void 0;
exports.navigateToPage = navigateToPage;
exports.navigateAndVerify = navigateAndVerify;
exports.fillFormField = fillFormField;
exports.selectOption = selectOption;
exports.clickAndWait = clickAndWait;
exports.submitFormAndWait = submitFormAndWait;
exports.loginUser = loginUser;
exports.registerUser = registerUser;
exports.logoutUser = logoutUser;
exports.searchProperties = searchProperties;
exports.applyPropertyFilters = applyPropertyFilters;
exports.viewPropertyDetails = viewPropertyDetails;
exports.savePropertyToFavorites = savePropertyToFavorites;
exports.contactPropertyOwner = contactPropertyOwner;
exports.schedulePropertyViewing = schedulePropertyViewing;
exports.createPropertyListing = createPropertyListing;
exports.submitPropertyReview = submitPropertyReview;
exports.respondToReview = respondToReview;
exports.updateUserProfile = updateUserProfile;
exports.changeUserPassword = changeUserPassword;
exports.verifyValidationError = verifyValidationError;
exports.verifySuccessMessage = verifySuccessMessage;
exports.verifyPageTitle = verifyPageTitle;
exports.verifyElementVisible = verifyElementVisible;
exports.verifyElementNotVisible = verifyElementNotVisible;
exports.waitForElement = waitForElement;
exports.waitForText = waitForText;
exports.waitForUrl = waitForUrl;
exports.handleNetworkError = handleNetworkError;
exports.verifyErrorHandling = verifyErrorHandling;
exports.setMobileViewport = setMobileViewport;
exports.setDesktopViewport = setDesktopViewport;
exports.setTabletViewport = setTabletViewport;
exports.checkAccessibility = checkAccessibility;
exports.measurePageLoadTime = measurePageLoadTime;
exports.verifyPageLoadTime = verifyPageLoadTime;
exports.cleanupTestData = cleanupTestData;
exports.takeScreenshot = takeScreenshot;
exports.takeFullPageScreenshot = takeFullPageScreenshot;
var test_1 = require("@playwright/test");
/**
 * E2E Test Helper Functions
 *
 * Common utilities and helper functions for end-to-end tests
 */
// Test data constants
exports.TEST_DATA = {
    USER: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecurePassword123!',
        phone: '+254700123456'
    },
    PROPERTY: {
        title: 'Modern 3-Bedroom Apartment in Nairobi',
        type: 'apartment',
        price: '150000',
        bedrooms: '3',
        bathrooms: '2',
        area: '1200',
        location: 'Westlands, Nairobi',
        description: 'Beautiful modern apartment with stunning city views, located in the heart of Nairobi.'
    },
    REVIEW: {
        rating: 5,
        title: 'Excellent Property and Service',
        comment: 'The property was exactly as described and the verification process gave me confidence in my purchase.'
    }
};
// Navigation helpers
function navigateToPage(page, path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.goto(path)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function navigateAndVerify(page, path, expectedTitle) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, navigateToPage(page, path)];
                case 1:
                    _a.sent();
                    if (!expectedTitle) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveTitle(new RegExp(expectedTitle, 'i'))];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Form interaction helpers
function fillFormField(page, selector, value) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.fill(selector, value)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(100)];
                case 2:
                    _a.sent(); // Small delay for form validation
                    return [2 /*return*/];
            }
        });
    });
}
function selectOption(page, selector, value) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.selectOption(selector, value)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(100)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function clickAndWait(page_1, selector_1) {
    return __awaiter(this, arguments, void 0, function (page, selector, waitFor) {
        if (waitFor === void 0) { waitFor = 'networkidle'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(waitFor === 'navigation')) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.all([
                            page.waitForNavigation(),
                            page.click(selector)
                        ])];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 2: return [4 /*yield*/, page.click(selector)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function submitFormAndWait(page_1) {
    return __awaiter(this, arguments, void 0, function (page, formSelector) {
        if (formSelector === void 0) { formSelector = 'form'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        page.waitForLoadState('networkidle'),
                        page.locator(formSelector).press('Enter')
                    ])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Authentication helpers
function loginUser(page_1) {
    return __awaiter(this, arguments, void 0, function (page, email, password) {
        if (email === void 0) { email = exports.TEST_DATA.USER.email; }
        if (password === void 0) { password = exports.TEST_DATA.USER.password; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, navigateToPage(page, '/auth/login')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="email"]', email)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="password"]', password)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Login")', 'navigation')];
                case 4:
                    _a.sent();
                    // Verify successful login
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/\/dashboard/)];
                case 5:
                    // Verify successful login
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function registerUser(page_1) {
    return __awaiter(this, arguments, void 0, function (page, userData) {
        if (userData === void 0) { userData = exports.TEST_DATA.USER; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, navigateToPage(page, '/auth/register')];
                case 1:
                    _a.sent();
                    // Step 1: Basic Information
                    return [4 /*yield*/, fillFormField(page, 'input[name="name"]', userData.name)];
                case 2:
                    // Step 1: Basic Information
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="email"]', userData.email)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="password"]', userData.password)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="confirmPassword"]', userData.password)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Next")')];
                case 6:
                    _a.sent();
                    // Step 2: Contact Information
                    return [4 /*yield*/, fillFormField(page, 'input[name="phone"]', userData.phone)];
                case 7:
                    // Step 2: Contact Information
                    _a.sent();
                    return [4 /*yield*/, selectOption(page, 'select[name="userType"]', 'buyer')];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Next")')];
                case 9:
                    _a.sent();
                    // Step 3: Preferences
                    return [4 /*yield*/, page.check('input[name="emailNotifications"]')];
                case 10:
                    // Step 3: Preferences
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Complete Registration")', 'navigation')];
                case 11:
                    _a.sent();
                    // Verify registration success
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/\/auth\/verify-email|\/dashboard/)];
                case 12:
                    // Verify registration success
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function logoutUser(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, clickAndWait(page, '[data-testid="user-menu"]')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Logout")', 'navigation')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/\/|\/auth/)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Property interaction helpers
function searchProperties(page, searchTerm) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, navigateToPage(page, '/properties')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[placeholder*="Search"]', searchTerm)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Search")')];
                case 3:
                    _a.sent();
                    // Verify search results
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('[data-testid="property-card"]')).toHaveCount({ min: 1 })];
                case 4:
                    // Verify search results
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function applyPropertyFilters(page, filters) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!filters.minPrice) return [3 /*break*/, 2];
                    return [4 /*yield*/, page.fill('input[name="minPrice"]', filters.minPrice)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (!filters.maxPrice) return [3 /*break*/, 4];
                    return [4 /*yield*/, page.fill('input[name="maxPrice"]', filters.maxPrice)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    if (!filters.propertyType) return [3 /*break*/, 6];
                    return [4 /*yield*/, selectOption(page, 'select[name="propertyType"]', filters.propertyType)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    if (!filters.bedrooms) return [3 /*break*/, 8];
                    return [4 /*yield*/, selectOption(page, 'select[name="bedrooms"]', filters.bedrooms)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8: return [4 /*yield*/, clickAndWait(page, 'button:has-text("Apply Filters")')];
                case 9:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function viewPropertyDetails(page_1) {
    return __awaiter(this, arguments, void 0, function (page, propertyIndex) {
        var propertyCard;
        if (propertyIndex === void 0) { propertyIndex = 0; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    propertyCard = page.locator('[data-testid="property-card"]').nth(propertyIndex);
                    return [4 /*yield*/, clickAndWait(propertyCard, 'navigation')];
                case 1:
                    _a.sent();
                    // Verify property details page
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/\/property\/\d+/)];
                case 2:
                    // Verify property details page
                    _a.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('h1')).toBeVisible()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function savePropertyToFavorites(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, clickAndWait(page, 'button:has-text("Save")')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=saved')).toBeVisible()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function contactPropertyOwner(page, message) {
    return __awaiter(this, void 0, void 0, function () {
        var contactModal;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, clickAndWait(page, 'button:has-text("Contact Owner")')];
                case 1:
                    _a.sent();
                    contactModal = page.locator('[data-testid="contact-modal"]');
                    return [4 /*yield*/, contactModal.isVisible()];
                case 2:
                    if (!_a.sent()) return [3 /*break*/, 6];
                    return [4 /*yield*/, fillFormField(page, 'textarea[name="message"]', message)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Send Message")')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=sent')).toBeVisible()];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function schedulePropertyViewing(page, date, time, notes) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, clickAndWait(page, 'button:has-text("Schedule Viewing")')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.fill('input[type="date"]', date)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.fill('input[type="time"]', time)];
                case 3:
                    _a.sent();
                    if (!notes) return [3 /*break*/, 5];
                    return [4 /*yield*/, fillFormField(page, 'textarea[name="notes"]', notes)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [4 /*yield*/, clickAndWait(page, 'button:has-text("Request Viewing")')];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=viewing.*scheduled')).toBeVisible()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Property listing helpers
function createPropertyListing(page_1) {
    return __awaiter(this, arguments, void 0, function (page, propertyData) {
        if (propertyData === void 0) { propertyData = exports.TEST_DATA.PROPERTY; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, navigateToPage(page, '/services/list-property')];
                case 1:
                    _a.sent();
                    // Step 1: Basic Details
                    return [4 /*yield*/, fillFormField(page, 'input[name="title"]', propertyData.title)];
                case 2:
                    // Step 1: Basic Details
                    _a.sent();
                    return [4 /*yield*/, selectOption(page, 'select[name="type"]', propertyData.type)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="price"]', propertyData.price)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, selectOption(page, 'select[name="ownershipStatus"]', 'freehold')];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Next")')];
                case 6:
                    _a.sent();
                    // Step 2: Features
                    return [4 /*yield*/, fillFormField(page, 'input[name="beds"]', propertyData.bedrooms)];
                case 7:
                    // Step 2: Features
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="baths"]', propertyData.bathrooms)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="area"]', propertyData.area)];
                case 9:
                    _a.sent();
                    // Select amenities
                    return [4 /*yield*/, page.check('input[id="swimming-pool"]')];
                case 10:
                    // Select amenities
                    _a.sent();
                    return [4 /*yield*/, page.check('input[id="security"]')];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, page.check('input[id="parking"]')];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Next")')];
                case 13:
                    _a.sent();
                    // Step 3: Location and Description
                    return [4 /*yield*/, fillFormField(page, 'input[name="location"]', propertyData.location)];
                case 14:
                    // Step 3: Location and Description
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'textarea[name="description"]', propertyData.description)];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Next")')];
                case 16:
                    _a.sent();
                    // Step 4: Documents
                    return [4 /*yield*/, page.check('input[id="terms"]')];
                case 17:
                    // Step 4: Documents
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Submit Property")')];
                case 18:
                    _a.sent();
                    // Verify successful submission
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=submitted.*successfully')).toBeVisible()];
                case 19:
                    // Verify successful submission
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Review helpers
function submitPropertyReview(page_1) {
    return __awaiter(this, arguments, void 0, function (page, reviewData) {
        if (reviewData === void 0) { reviewData = exports.TEST_DATA.REVIEW; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Scroll to reviews section
                return [4 /*yield*/, page.locator('text=Reviews').scrollIntoViewIfNeeded()];
                case 1:
                    // Scroll to reviews section
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Write Review")')];
                case 2:
                    _a.sent();
                    // Fill review form
                    return [4 /*yield*/, page.click("[data-rating=\"".concat(reviewData.rating, "\"]"))];
                case 3:
                    // Fill review form
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="reviewTitle"]', reviewData.title)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'textarea[name="reviewComment"]', reviewData.comment)];
                case 5:
                    _a.sent();
                    // Submit review
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Submit Review")')];
                case 6:
                    // Submit review
                    _a.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=review.*submitted')).toBeVisible()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function respondToReview(page, response) {
    return __awaiter(this, void 0, void 0, function () {
        var reviewToRespond;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    reviewToRespond = page.locator('[data-testid="review-item"]').first();
                    return [4 /*yield*/, reviewToRespond.locator('button:has-text("Respond")').click()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'textarea[name="response"]', response)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Submit Response")')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=response.*submitted')).toBeVisible()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Profile management helpers
function updateUserProfile(page, updates) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, navigateToPage(page, '/dashboard')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Settings")')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Profile")')];
                case 3:
                    _a.sent();
                    if (!updates.name) return [3 /*break*/, 5];
                    return [4 /*yield*/, fillFormField(page, 'input[name="name"]', updates.name)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    if (!updates.phone) return [3 /*break*/, 7];
                    return [4 /*yield*/, fillFormField(page, 'input[name="phone"]', updates.phone)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    if (!updates.bio) return [3 /*break*/, 9];
                    return [4 /*yield*/, fillFormField(page, 'textarea[name="bio"]', updates.bio)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9: return [4 /*yield*/, clickAndWait(page, 'button:has-text("Save Changes")')];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=updated')).toBeVisible()];
                case 11:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function changeUserPassword(page, currentPassword, newPassword) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, navigateToPage(page, '/dashboard')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Settings")')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Security")')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="currentPassword"]', currentPassword)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="newPassword"]', newPassword)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, fillFormField(page, 'input[name="confirmNewPassword"]', newPassword)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, clickAndWait(page, 'button:has-text("Change Password")')];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=password.*changed')).toBeVisible()];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Validation helpers
function verifyValidationError(page, expectedError) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, test_1.expect)(page.locator("text=".concat(expectedError))).toBeVisible()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function verifySuccessMessage(page, expectedMessage) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, test_1.expect)(page.locator("text=".concat(expectedMessage))).toBeVisible()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function verifyPageTitle(page, expectedTitle) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, test_1.expect)(page).toHaveTitle(new RegExp(expectedTitle, 'i'))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function verifyElementVisible(page, selector) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, test_1.expect)(page.locator(selector)).toBeVisible()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function verifyElementNotVisible(page, selector) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, test_1.expect)(page.locator(selector)).not.toBeVisible()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Wait helpers
function waitForElement(page_1, selector_1) {
    return __awaiter(this, arguments, void 0, function (page, selector, timeout) {
        if (timeout === void 0) { timeout = 10000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.waitForSelector(selector, { timeout: timeout })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function waitForText(page_1, text_1) {
    return __awaiter(this, arguments, void 0, function (page, text, timeout) {
        if (timeout === void 0) { timeout = 10000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.waitForSelector("text=".concat(text), { timeout: timeout })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function waitForUrl(page_1, urlPattern_1) {
    return __awaiter(this, arguments, void 0, function (page, urlPattern, timeout) {
        if (timeout === void 0) { timeout = 10000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.waitForURL(urlPattern, { timeout: timeout })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Error handling helpers
function handleNetworkError(page, callback) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Simulate network error
                return [4 /*yield*/, page.route('**/api/**', function (route) { return route.abort(); })];
                case 1:
                    // Simulate network error
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 4, 6]);
                    return [4 /*yield*/, callback()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4: 
                // Restore network
                return [4 /*yield*/, page.unroute('**/api/**')];
                case 5:
                    // Restore network
                    _a.sent();
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function verifyErrorHandling(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, test_1.expect)(page.locator('text=error|failed|try again')).toBeVisible()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Mobile helpers
function setMobileViewport(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.setViewportSize({ width: 375, height: 667 })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function setDesktopViewport(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.setViewportSize({ width: 1920, height: 1080 })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function setTabletViewport(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.setViewportSize({ width: 768, height: 1024 })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Accessibility helpers
function checkAccessibility(page) {
    return __awaiter(this, void 0, void 0, function () {
        var headings, images, imageCount, i, img, alt, inputs, inputCount, i, input, id, label;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.locator('h1, h2, h3, h4, h5, h6').count()];
                case 1:
                    headings = _a.sent();
                    (0, test_1.expect)(headings).toBeGreaterThan(0);
                    images = page.locator('img');
                    return [4 /*yield*/, images.count()];
                case 2:
                    imageCount = _a.sent();
                    i = 0;
                    _a.label = 3;
                case 3:
                    if (!(i < imageCount)) return [3 /*break*/, 6];
                    img = images.nth(i);
                    return [4 /*yield*/, img.getAttribute('alt')];
                case 4:
                    alt = _a.sent();
                    (0, test_1.expect)(alt).toBeTruthy();
                    _a.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 3];
                case 6:
                    inputs = page.locator('input[type="text"], input[type="email"], input[type="password"], textarea');
                    return [4 /*yield*/, inputs.count()];
                case 7:
                    inputCount = _a.sent();
                    i = 0;
                    _a.label = 8;
                case 8:
                    if (!(i < inputCount)) return [3 /*break*/, 12];
                    input = inputs.nth(i);
                    return [4 /*yield*/, input.getAttribute('id')];
                case 9:
                    id = _a.sent();
                    if (!id) return [3 /*break*/, 11];
                    label = page.locator("label[for=\"".concat(id, "\"]"));
                    return [4 /*yield*/, (0, test_1.expect)(label).toBeVisible()];
                case 10:
                    _a.sent();
                    _a.label = 11;
                case 11:
                    i++;
                    return [3 /*break*/, 8];
                case 12: return [2 /*return*/];
            }
        });
    });
}
// Performance helpers
function measurePageLoadTime(page, url) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, endTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    return [4 /*yield*/, navigateToPage(page, url)];
                case 1:
                    _a.sent();
                    endTime = Date.now();
                    return [2 /*return*/, endTime - startTime];
            }
        });
    });
}
function verifyPageLoadTime(page_1, url_1) {
    return __awaiter(this, arguments, void 0, function (page, url, maxTime) {
        var loadTime;
        if (maxTime === void 0) { maxTime = 3000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, measurePageLoadTime(page, url)];
                case 1:
                    loadTime = _a.sent();
                    (0, test_1.expect)(loadTime).toBeLessThan(maxTime);
                    return [2 /*return*/];
            }
        });
    });
}
// Data cleanup helpers
function cleanupTestData(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // This would clean up any test data created during tests
            // Implementation would depend on the backend API
            console.log('Cleaning up test data...');
            return [2 /*return*/];
        });
    });
}
// Screenshot helpers
function takeScreenshot(page, name) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.screenshot({ path: "test-results/screenshots/".concat(name, ".png") })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function takeFullPageScreenshot(page, name) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.screenshot({
                        path: "test-results/screenshots/".concat(name, "-full.png"),
                        fullPage: true
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
