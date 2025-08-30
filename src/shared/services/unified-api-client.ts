/**
 * Unified API Client - Best of all worlds
 * Combines race condition protection, enterprise features, and performance optimizations
 */

import { cacheService as enhancedCache } from "./CacheService"
import { auditLogger } from './audit-trail-service';
import { securityMonitor } from './security-monitoring-service';

// Core types
export interface ApiResponse<T = unknown> {
    data: T;
    success: boolean;
    message?: string;
    error?: string;
    status: number;
    headers?: Record<string, string>;
    cached?: boolean;
    requestId: string;
}

export interface ApiRequestOptions {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    useCache?: boolean;
    cacheTtl?: number;
    priority?: 'low' | 'normal' | 'high';
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    signal?: AbortSignal;
}

// Circuit breaker for fault tolerance
class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    constructor(
        private threshold = 5,
        private timeout = 30000
    ) { }

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    }

    private onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
        }
    }
}

// Rate limiter
class RateLimiter {
    private requests = new Map<string, number[]>();

    async checkLimit(key: string, limit = 100, windowMs = 60000): Promise<void> {
        const now = Date.now();
        const windowStart = now - windowMs;

        let requestTimes = this.requests.get(key) || [];
        requestTimes = requestTimes.filter(time => time > windowStart);

        if (requestTimes.length >= limit) {
            throw new Error('Rate limit exceeded');
        }

        requestTimes.push(now);
        this.requests.set(key, requestTimes);
    }
}

export class UnifiedApiClient {
    private baseUrl: string;
    private defaultOptions: ApiRequestOptions;
    private requestCache = new Map<string, Promise<ApiResponse<unknown>>>();
    private circuitBreaker = new CircuitBreaker();
    private rateLimiter = new RateLimiter();

    constructor(config: { baseUrl?: string; defaultOptions?: ApiRequestOptions } = {}) {
        this.baseUrl = config.baseUrl || '/api';
        this.defaultOptions = {
            timeout: 10000,
            retries: 3,
            retryDelay: 1000,
            useCache: false,
            ...config.defaultOptions,
        };
    }

    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    private getCacheKey(url: string, options: ApiRequestOptions): string {
        const method = options.method || 'GET';
        const headers = JSON.stringify(options.headers || {});
        const body = options.body ? JSON.stringify(options.body) : '';
        return `${method}:${url}:${headers}:${body}`;
    }

    private async executeWithRetry<T>(
        operation: () => Promise<T>,
        retries: number,
        delay: number
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                // Don't retry certain errors
                if (
                    error instanceof TypeError ||
                    (error as any)?.name === 'AbortError' ||
                    (error as any)?.status === 401 ||
                    (error as any)?.status === 403
                ) {
                    throw error;
                }

                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
                }
            }
        }

        throw lastError!;
    }

    async request<T = unknown>(
        url: string,
        options: ApiRequestOptions = {}
    ): Promise<ApiResponse<T>> {
        const mergedOptions = { ...this.defaultOptions, ...options };
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const requestId = this.generateRequestId();
        const cacheKey = this.getCacheKey(fullUrl, mergedOptions);

        // Check cache first
        if (mergedOptions.useCache && mergedOptions.method === 'GET') {
            const cached = enhancedCache.get<ApiResponse<T>>(cacheKey);
            if (cached) {
                return { ...cached, cached: true, requestId };
            }
        }

        // Race condition protection
        if (this.requestCache.has(cacheKey)) {
            const existingRequest = this.requestCache.get(cacheKey);
            if (existingRequest) {
                return (await existingRequest) as ApiResponse<T>;
            }
        }

        // Rate limiting
        try {
            await this.rateLimiter.checkLimit(fullUrl);
        } catch (rateLimitError) {
            return {
                data: null as T,
                success: false,
                error: 'Rate limit exceeded',
                status: 429,
                requestId,
            };
        }

        // Security check
        try {
            const clientIP = await this.getClientIP();
            if (clientIP) {
                const securityResult = await securityMonitor.analyzeRequest({
                    ip: clientIP,
                    userAgent: navigator?.userAgent || 'Unknown',
                    endpoint: fullUrl,
                    method: mergedOptions.method?.toUpperCase() || 'GET',
                    headers: mergedOptions.headers as Record<string, string> || {},
                    body: mergedOptions.body,
                    sessionId: this.getSessionId() || 'no-session',
                    userId: this.getUserId() || 'anonymous'
                });

                if (securityResult.blocked) {
                    return {
                        data: null as T,
                        success: false,
                        error: 'Request blocked by security policy',
                        status: 403,
                        requestId,
                    };
                }
            }
        } catch (securityError) {
            console.warn('Security check failed:', securityError);
        }

        // Create abort controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), mergedOptions.timeout || 10000);

        if (mergedOptions.signal) {
            mergedOptions.signal.addEventListener('abort', () => controller.abort());
        }

        const requestPromise = this.circuitBreaker.execute(async () => {
            return this.executeWithRetry(
                async () => {
                    const requestInit: RequestInit = {
                        method: mergedOptions.method || 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...mergedOptions.headers,
                        },
                        signal: controller.signal,
                    };

                    // Add auth token
                    const token = this.getAuthToken();
                    if (token) {
                        (requestInit.headers as Record<string, string>).Authorization = `Bearer ${token}`;
                    }

                    if (mergedOptions.body && requestInit.method !== 'GET') {
                        requestInit.body = mergedOptions.body;
                    }

                    const response = await fetch(fullUrl, requestInit);

                    if (!response.ok) {
                        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as any;
                        error.status = response.status;
                        throw error;
                    }

                    let data: T;
                    const contentType = response.headers.get('content-type');

                    if (contentType?.includes('application/json')) {
                        data = await response.json();
                    } else {
                        data = (await response.text()) as unknown as T;
                    }

                    const result: ApiResponse<T> = {
                        data,
                        success: true,
                        status: response.status,
                        headers: response.headers ? Object.fromEntries(Array.from(response.headers.entries())) : {},
                        requestId,
                    };

                    // Cache successful responses
                    if (mergedOptions.useCache && requestInit.method === 'GET') {
                        enhancedCache.set(cacheKey, result, mergedOptions.cacheTtl);
                    }

                    // Audit log
                    await auditLogger.dataRead(
                        `API:${requestInit.method}:${fullUrl}`,
                        1,
                        {
                            userId: this.getUserId() || 'anonymous',
                            sessionId: this.getSessionId() || 'no-session',
                            ipAddress: await this.getClientIP() || 'unknown',
                            userAgent: navigator?.userAgent || 'Unknown',
                            roles: [],
                            permissions: [],
                            isAuthenticated: !!token
                        }
                    );

                    return result;
                },
                mergedOptions.retries || 0,
                mergedOptions.retryDelay || 1000
            );
        });

        // Cache the promise to prevent race conditions
        this.requestCache.set(cacheKey, requestPromise as Promise<ApiResponse<unknown>>);

        try {
            return await requestPromise;
        } catch (error) {
            return {
                data: null as T,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                status: (error as any)?.status || 0,
                requestId,
            };
        } finally {
            clearTimeout(timeoutId);
            this.requestCache.delete(cacheKey);
        }
    }

    // Convenience methods
    async get<T = unknown>(url: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
        return this.request<T>(url, { ...options, method: 'GET', useCache: options.useCache ?? true });
    }

    async post<T = unknown>(url: string, data?: unknown, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : null,
        });
    }

    async put<T = unknown>(url: string, data?: unknown, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : null,
        });
    }

    async delete<T = unknown>(url: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
        return this.request<T>(url, { ...options, method: 'DELETE' });
    }

    // Utility methods
    private getAuthToken(): string | null {
        if (typeof window === 'undefined') return null;
        try {
            return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        } catch {
            return null;
        }
    }

    private async getClientIP(): Promise<string | null> {
        // This would typically be handled server-side
        return null;
    }

    private getSessionId(): string | null {
        if (typeof window === 'undefined') return null;
        try {
            return sessionStorage.getItem('session_id');
        } catch {
            return null;
        }
    }

    private getUserId(): string | null {
        if (typeof window === 'undefined') return null;
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user).id : null;
        } catch {
            return null;
        }
    }

    // Management methods
    clearCache(): void {
        this.requestCache.clear();
        enhancedCache.clear();
    }

    getCircuitBreakerState(): string {
        return (this.circuitBreaker as any).state;
    }
}

// Export singleton
export const apiClient = new UnifiedApiClient({ baseUrl: '/api' });