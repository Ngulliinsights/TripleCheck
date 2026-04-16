/**
 * Authentication Token Service
 * Manages JWT tokens, refresh logic, and secure storage
 */

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  exp: number;
  iat: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthTokenService {
  private static instance: AuthTokenService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private tokenCallbacks: Map<string, (token: string | null) => void> = new Map();

  static getInstance(): AuthTokenService {
    if (!AuthTokenService.instance) {
      AuthTokenService.instance = new AuthTokenService();
    }
    return AuthTokenService.instance;
  }

  constructor() {
    this.loadTokensFromStorage();
    this.setupAutoRefresh();
  }

  /**
   * Set authentication tokens
   */
  setTokens(tokenPair: TokenPair): void {
    this.accessToken = tokenPair.accessToken;
    this.refreshToken = tokenPair.refreshToken;

    // Store in secure storage
    this.storeTokensSecurely(tokenPair);

    // Setup auto-refresh
    this.setupAutoRefresh();

    // Notify callbacks
    this.notifyTokenCallbacks(this.accessToken);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    if (this.accessToken && !this.isTokenExpired(this.accessToken)) {
      return this.accessToken;
    }
    return null;
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.clearTokenStorage();
    this.notifyTokenCallbacks(null);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const tokenPair: TokenPair = await response.json();
      this.setTokens(tokenPair);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Decode JWT token
   */
  decodeToken(token: string): TokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  /**
   * Get token payload
   */
  getTokenPayload(): TokenPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      return this.decodeToken(token);
    } catch {
      return null;
    }
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    const payload = this.getTokenPayload();
    return payload?.permissions.includes(permission) || false;
  }

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean {
    const payload = this.getTokenPayload();
    return payload?.role === role;
  }

  /**
   * Get user ID from token
   */
  getUserId(): string | null {
    const payload = this.getTokenPayload();
    return payload?.userId || null;
  }

  /**
   * Get user email from token
   */
  getUserEmail(): string | null {
    const payload = this.getTokenPayload();
    return payload?.email || null;
  }

  /**
   * Subscribe to token changes
   */
  onTokenChange(id: string, callback: (token: string | null) => void): void {
    this.tokenCallbacks.set(id, callback);
  }

  /**
   * Unsubscribe from token changes
   */
  offTokenChange(id: string): void {
    this.tokenCallbacks.delete(id);
  }

  /**
   * Setup automatic token refresh
   */
  private setupAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.accessToken) return;

    try {
      const payload = this.decodeToken(this.accessToken);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - currentTime;
      
      // Refresh 5 minutes before expiry
      const refreshTime = Math.max(timeUntilExpiry - 300, 60) * 1000;

      this.refreshTimer = setTimeout(async () => {
        await this.refreshAccessToken();
      }, refreshTime);
    } catch (error) {
      console.error('Failed to setup auto-refresh:', error);
    }
  }

  /**
   * Store tokens securely
   */
  private storeTokensSecurely(tokenPair: TokenPair): void {
    try {
      // Use sessionStorage for access token (more secure)
      sessionStorage.setItem('accessToken', tokenPair.accessToken);
      
      // Use localStorage for refresh token (persists across sessions)
      localStorage.setItem('refreshToken', tokenPair.refreshToken);
      
      // Store expiry time
      localStorage.setItem('tokenExpiry', (Date.now() + tokenPair.expiresIn * 1000).toString());
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Load tokens from storage
   */
  private loadTokensFromStorage(): void {
    try {
      const accessToken = sessionStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const tokenExpiry = localStorage.getItem('tokenExpiry');

      if (accessToken && !this.isTokenExpired(accessToken)) {
        this.accessToken = accessToken;
      }

      if (refreshToken) {
        this.refreshToken = refreshToken;
      }

      // Check if tokens are expired
      if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        this.clearTokens();
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
      this.clearTokens();
    }
  }

  /**
   * Clear token storage
   */
  private clearTokenStorage(): void {
    try {
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiry');
    } catch (error) {
      console.error('Failed to clear token storage:', error);
    }
  }

  /**
   * Notify token change callbacks
   */
  private notifyTokenCallbacks(token: string | null): void {
    this.tokenCallbacks.forEach(callback => {
      try {
        callback(token);
      } catch (error) {
        console.error('Error in token callback:', error);
      }
    });
  }

  /**
   * Create authorization header
   */
  getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Validate token format
   */
  isValidTokenFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Try to decode payload
      this.decodeToken(token);
      return true;
    } catch {
      return false;
    }
  }
}

export const authTokenService = AuthTokenService.getInstance();
export default authTokenService;