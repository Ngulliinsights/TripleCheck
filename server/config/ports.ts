/**
 * Port Configuration for TripleCheck Server
 * Centralizes port management for different environments
 */

export interface PortConfig {
  server: number;
  vite: number;
  hmr: number;
  environment: string;
}

/**
 * Get port configuration based on environment
 * CONSOLIDATED: Single port for all environments to avoid confusion
 */
export function getPortConfig(): PortConfig {
  const NODE_ENV = process.env.NODE_ENV || "development";
  
  // CONSOLIDATED PORT STRATEGY: Use 3003 for backend to avoid conflicts
  // Frontend (Vite) runs on 5173, backend on 3003
  const UNIFIED_PORT = 3003;
  
  // Allow PORT environment variable to override
  const serverPort = process.env.PORT ? parseInt(process.env.PORT, 10) : UNIFIED_PORT;
  
  return {
    server: serverPort,
    vite: serverPort, // Same port for simplicity
    hmr: serverPort + 1, // HMR on next port if needed
    environment: NODE_ENV,
  };
}

/**
 * Validate port number
 */
export function validatePort(port: number): boolean {
  return !isNaN(port) && port >= 1 && port <= 65535;
}

/**
 * Get available port (simple check)
 */
export function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(true); // Port is in use
    });
  });
}

/**
 * Display port configuration
 */
export function displayPortConfig(config: PortConfig): void {
  console.log('\n🔧 CONSOLIDATED PORT CONFIGURATION:');
  console.log(`   Environment: ${config.environment}`);
  console.log(`   Unified Port: ${config.server}`);
  console.log(`   Frontend: http://localhost:${config.server}`);
  console.log(`   API: http://localhost:${config.server}/api`);
  console.log(`   Health: http://localhost:${config.server}/health`);
  console.log('');
}