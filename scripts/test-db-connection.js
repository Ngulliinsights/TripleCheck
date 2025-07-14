import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Test query
    const result = await sql`SELECT version();`;
    console.log('✅ Database connection successful!');
    console.log('Database version:', result[0].version);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
