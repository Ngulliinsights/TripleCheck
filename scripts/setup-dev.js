#!/usr/bin/env node

/**
 * Development Setup Script
 * Helps set up the development environment
 */

import fs from './cleanup-redundancies';
import path from './cleanup-redundancies';

console.log('🚀 TripleCheck Development Setup');
console.log('================================\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
    console.log('📋 Please edit .env file with your database configuration');
  } else {
    console.log('⚠️  .env.example not found, creating basic .env...');
    const basicEnv = `# TripleCheck Environment Configuration
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://localhost:5432/triplecheck
`;
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Basic .env file created');
  }
} else {
  console.log('✅ .env file already exists');
}

console.log('\n🔧 Setup Options:');
console.log('==================');
console.log('1. 🐘 Local PostgreSQL:');
console.log('   - Install PostgreSQL locally');
console.log('   - Create database: createdb triplecheck');
console.log('   - Update DATABASE_URL in .env');
console.log('');
console.log('2. ☁️  Cloud Database (Recommended):');
console.log('   - Neon: https://neon.tech (free tier available)');
console.log('   - Supabase: https://supabase.com (free tier available)');
console.log('   - Update DATABASE_URL in .env with your cloud database URL');
console.log('');
console.log('3. 🧪 Mock Data (No setup required):');
console.log('   - Server will automatically use mock data if database fails');
console.log('   - Perfect for quick testing and development');

console.log('\n🏃‍♂️ Next Steps:');
console.log('===============');
console.log('1. Configure your database in .env file');
console.log('2. Run: npm run dev');
console.log('3. Visit: http://localhost:3001');
console.log('');
console.log('💡 The server will work with mock data even without a database!');
console.log('🔗 Integration tests: npm run test:integration');

console.log('\n✨ Setup complete! Happy coding! ✨');