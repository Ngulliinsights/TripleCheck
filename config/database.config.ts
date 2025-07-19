export const databaseConfig = {
  // Database connection
  url: process.env.DATABASE_URL || 'postgresql://localhost:5432/triplecheck',
  
  // Connection pool settings
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },

  // Migration settings
  migrations: {
    directory: './server/infrastructure/database/migrations',
    tableName: 'migrations',
  },

  // Seed data settings
  seeds: {
    directory: './server/infrastructure/database/seeds',
  },

  // Query settings
  query: {
    timeout: 30000,
    logQueries: process.env.NODE_ENV === 'development',
  },
} as const;