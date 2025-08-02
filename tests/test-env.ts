// Test to check import.meta.env availability
console.log('Testing import.meta.env...');
console.log('import.meta:', typeof import.meta);
console.log('import.meta.env:', typeof import.meta?.env);
console.log('import.meta.env.VITE_DEMO_USER_PASSWORD:', import.meta?.env?.VITE_DEMO_USER_PASSWORD);

// Test process.env
console.log('\nTesting process.env...');
console.log('process.env.VITE_DEMO_USER_PASSWORD:', process.env.VITE_DEMO_USER_PASSWORD);