export class Logger {
  private component: string;

  constructor(component: string) {
    this.component = component;
  }

  info(message: string, ...args: any[]): void {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.component}] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.component}] ${message}`, ...args);
  }

  error(message: string, error?: any, ...args: any[]): void {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.component}] ${message}`, error, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.component}] ${message}`, ...args);
    }
  }
}