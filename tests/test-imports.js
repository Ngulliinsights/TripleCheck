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
// TypeScript test script to check component imports
var dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
function testImports() {
    return __awaiter(this, void 0, void 0, function () {
        var componentsToTest, _i, componentsToTest_1, component, module_1, error_1, lazyRoutes, routeNames, testRoutes, _a, testRoutes_1, routeName, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    componentsToTest = [
                        { name: 'Home', path: './src/shared/pages/Home' },
                        { name: 'Features', path: './src/shared/pages/Features' },
                        { name: 'Pricing', path: './src/shared/pages/Pricing' },
                        { name: 'Login', path: './src/auth/pages/Login' },
                        { name: 'Register', path: './src/auth/pages/Register' },
                        { name: 'Dashboard', path: './src/user/pages/Dashboard' },
                        { name: 'PropertyDetails', path: './src/property/pages/PropertyDetails' },
                        { name: 'PropertyCompare', path: './src/property/pages/PropertyCompare' },
                        { name: 'BasicChecks', path: './src/trust/pages/BasicChecks' },
                        { name: 'SearchResults', path: './src/search/pages/SearchResults' },
                        { name: 'NotFound', path: './src/shared/pages/NotFound' },
                        { name: 'ComingSoon', path: './src/shared/pages/ComingSoon' },
                    ];
                    console.log('Testing component imports with tsx...\n');
                    _i = 0, componentsToTest_1 = componentsToTest;
                    _b.label = 1;
                case 1:
                    if (!(_i < componentsToTest_1.length)) return [3 /*break*/, 6];
                    component = componentsToTest_1[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, Promise.resolve("".concat(component.path)).then(function (s) { return require(s); })];
                case 3:
                    module_1 = _b.sent();
                    if (module_1.default) {
                        console.log("\u2705 ".concat(component.name, ": Import successful"));
                    }
                    else {
                        console.log("\u274C ".concat(component.name, ": No default export found"));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    console.log("\u274C ".concat(component.name, ": Import failed - ").concat(error_1.message));
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    console.log('\nTesting lazy-routes module...');
                    _b.label = 7;
                case 7:
                    _b.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./src/app/lazy-routes'); })];
                case 8:
                    lazyRoutes = _b.sent();
                    console.log('✅ lazy-routes.tsx: Import successful');
                    if (lazyRoutes.WorkingRoutes) {
                        console.log('✅ WorkingRoutes object exists');
                        routeNames = Object.keys(lazyRoutes.WorkingRoutes);
                        console.log("\uD83D\uDCCA Found ".concat(routeNames.length, " routes"));
                        testRoutes = ['Home', 'Login', 'PropertyCompare', 'MyProperties'];
                        for (_a = 0, testRoutes_1 = testRoutes; _a < testRoutes_1.length; _a++) {
                            routeName = testRoutes_1[_a];
                            if (lazyRoutes.WorkingRoutes[routeName]) {
                                console.log("\u2705 Route ".concat(routeName, ": Exists in WorkingRoutes"));
                            }
                            else {
                                console.log("\u274C Route ".concat(routeName, ": Missing from WorkingRoutes"));
                            }
                        }
                    }
                    else {
                        console.log('❌ WorkingRoutes object not found');
                    }
                    return [3 /*break*/, 10];
                case 9:
                    error_2 = _b.sent();
                    console.log("\u274C lazy-routes.tsx: Import failed - ".concat(error_2.message));
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
testImports().catch(console.error);
