// Simple database test script
require('dotenv').config();
const postgres = require('postgres');

const DATABASE_URL = process.env.DATABASE_URL;

async function testDatabase() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', DATABASE_URL ? 'Set' : 'Not set');
  
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    return;
  }

  const sql = postgres(DATABASE_URL, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  try {
    // Test connection
    console.log('Testing connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // Check if properties table exists
    console.log('Checking if properties table exists...');
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'properties'
      );
    `;
    console.log('Properties table exists:', tableExists[0].exists);

    if (tableExists[0].exists) {
      // Count properties
      console.log('Counting properties...');
      const count = await sql`SELECT COUNT(*) as count FROM properties`;
      console.log('Total properties:', count[0].count);

      if (parseInt(count[0].count) > 0) {
        // Get sample properties
        console.log('Getting sample properties...');
        const properties = await sql`
          SELECT id, title, location, price, verification_status 
          FROM properties 
          LIMIT 5
        `;
        console.log('Sample properties:');
        properties.forEach(p => {
          console.log(`- ${p.title} (${p.location}) - ${p.price} - ${p.verification_status}`);
        });
      } else {
        console.log('No properties found in database');
      }
    }

    // Check if users table exists and has data
    console.log('Checking users table...');
    const usersExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    if (usersExist[0].exists) {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log('Total users:', userCount[0].count);
    } else {
      console.log('Users table does not exist');
    }

  } catch (error) {
    console.error('Database test failed:', error.message);
  } finally {
    await sql.end();
  }
}

testDatabase();