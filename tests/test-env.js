"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
// Test to check import.meta.env availability
console.log('Testing import.meta.env...');
console.log('import.meta:', typeof import.meta);
console.log('import.meta.env:', typeof ((_a = import.meta) === null || _a === void 0 ? void 0 : _a.env));
console.log('import.meta.env.VITE_DEMO_USER_PASSWORD:', (_c = (_b = import.meta) === null || _b === void 0 ? void 0 : _b.env) === null || _c === void 0 ? void 0 : _c.VITE_DEMO_USER_PASSWORD);
// Test process.env
console.log('\nTesting process.env...');
console.log('process.env.VITE_DEMO_USER_PASSWORD:', process.env.VITE_DEMO_USER_PASSWORD);
