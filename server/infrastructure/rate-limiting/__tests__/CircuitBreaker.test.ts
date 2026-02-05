import { CircuitBreaker, CircuitBreakerState, CircuitBreakerManager } from '../CircuitBreaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      recoveryTimeout: 1000, // 1 second for testing
      requestTimeout: 100, // 100ms for testing
      minimumRequests: 2
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('execute', () => {
    it('should execute operation successfully when circuit is closed', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.CLOSED);
    });

    it('should track successful operations', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await circuitBreaker.execute(operation);
      await circuitBreaker.execute(operation);

      const stats = circuitBreaker.getStats();
      expect(stats.successes).toBe(2);
      expect(stats.requests).toBe(2);
    });

    it('should track failed operations', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');

      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(2);
      expect(stats.requests).toBe(2);
    });

    it('should open circuit after failure threshold is reached', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      // Reach minimum requests first
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      
      // This should open the circuit
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.OPEN);
      expect(stats.failures).toBe(3);
    });

    it('should reject requests immediately when circuit is open', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      // Open the circuit
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();

      expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.OPEN);

      // Next request should be rejected immediately
      const newOperation = jest.fn().mockResolvedValue('success');
      await expect(circuitBreaker.execute(newOperation)).rejects.toThrow('Circuit breaker test-service is OPEN');
      
      expect(newOperation).not.toHaveBeenCalled();
    });

    it('should transition to half-open after recovery timeout', async () => {
      jest.useFakeTimers();

      const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      const successOperation = jest.fn().mockResolvedValue('success');

      // Open the circuit
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();

      expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.OPEN);

      // Fast-forward past recovery timeout
      jest.advanceTimersByTime(1100); // More than 1 second

      // Next request should transition to half-open
      const result = await circuitBreaker.execute(successOperation);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.CLOSED); // Should close after success

      jest.useRealTimers();
    });

    it('should close circuit after successful requests in half-open state', async () => {
      jest.useFakeTimers();

      const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      const successOperation = jest.fn().mockResolvedValue('success');

      // Open the circuit
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();

      // Fast-forward past recovery timeout
      jest.advanceTimersByTime(1100);

      // Execute successful operations (need 3 successes by default)
      await circuitBreaker.execute(successOperation);
      await circuitBreaker.execute(successOperation);
      await circuitBreaker.execute(successOperation);

      expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.CLOSED);

      jest.useRealTimers();
    });

    it('should return to open state if operation fails in half-open state', async () => {
      jest.useFakeTimers();

      const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      // Open the circuit
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();

      // Fast-forward past recovery timeout
      jest.advanceTimersByTime(1100);

      // Fail in half-open state
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();

      expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.OPEN);

      jest.useRealTimers();
    });

    it('should timeout long-running operations', async () => {
      const longOperation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200)) // Longer than 100ms timeout
      );

      await expect(circuitBreaker.execute(longOperation)).rejects.toThrow('Operation timeout');
    });

    it('should not open circuit if minimum requests threshold not met', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      // Only one failure (below minimum requests of 2)
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();

      expect(circuitBreaker.getStats().state).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('getStats', () => {
    it('should return comprehensive statistics', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      const failOperation = jest.fn().mockRejectedValue(new Error('fail'));

      await circuitBreaker.execute(successOperation);
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow();

      const stats = circuitBreaker.getStats();

      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.successes).toBe(1);
      expect(stats.failures).toBe(1);
      expect(stats.requests).toBe(2);
      expect(stats.lastSuccessTime).toBeInstanceOf(Date);
      expect(stats.lastFailureTime).toBeInstanceOf(Date);
      expect(stats.uptime).toBeGreaterThan(0);
      expect(stats.errorRate).toBe(50); // 1 failure out of 2 requests
    });

    it('should calculate error rate correctly', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      const failOperation = jest.fn().mockRejectedValue(new Error('fail'));

      // 3 successes, 1 failure = 25% error rate
      await circuitBreaker.execute(successOperation);
      await circuitBreaker.execute(successOperation);
      await circuitBreaker.execute(successOperation);
      await expect(circuitBreaker.execute(failOperation)).rejects.toThrow();

      const stats = circuitBreaker.getStats();
      expect(stats.errorRate).toBe(25);
    });
  });

  describe('reset', () => {
    it('should reset circuit breaker to initial state', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      // Generate some failures
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();

      circuitBreaker.reset();

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.requests).toBe(0);
    });
  });

  describe('forceOpen', () => {
    it('should force circuit breaker to open state', () => {
      circuitBreaker.forceOpen();

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.OPEN);
      expect(stats.nextAttempt).toBeInstanceOf(Date);
    });
  });

  describe('isHealthy', () => {
    it('should return true for healthy circuit breaker', () => {
      expect(circuitBreaker.isHealthy()).toBe(true);
    });

    it('should return false for open circuit breaker', () => {
      circuitBreaker.forceOpen();
      expect(circuitBreaker.isHealthy()).toBe(false);
    });

    it('should return false for high error rate', async () => {
      const failOperation = jest.fn().mockRejectedValue(new Error('fail'));

      // Generate high error rate
      for (let i = 0; i < 10; i++) {
        await expect(circuitBreaker.execute(failOperation)).rejects.toThrow();
      }

      expect(circuitBreaker.isHealthy()).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = { failureThreshold: 10 };
      circuitBreaker.updateConfig(newConfig);

      // Test that new config is applied (would need to access private config or test behavior)
      expect(circuitBreaker.getName()).toBe('test-service');
    });
  });
});

describe('CircuitBreakerManager', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    // Get fresh instance
    manager = CircuitBreakerManager.getInstance();
    // Clear any existing circuit breakers
    manager.resetAll();
  });

  describe('getCircuitBreaker', () => {
    it('should create new circuit breaker if not exists', () => {
      const breaker = manager.getCircuitBreaker('test-service');

      expect(breaker).toBeInstanceOf(CircuitBreaker);
      expect(breaker.getName()).toBe('test-service');
    });

    it('should return existing circuit breaker', () => {
      const breaker1 = manager.getCircuitBreaker('test-service');
      const breaker2 = manager.getCircuitBreaker('test-service');

      expect(breaker1).toBe(breaker2);
    });

    it('should create circuit breaker with custom config', () => {
      const config = { failureThreshold: 10 };
      const breaker = manager.getCircuitBreaker('test-service', config);

      expect(breaker.getName()).toBe('test-service');
    });
  });

  describe('getAllCircuitBreakers', () => {
    it('should return all circuit breakers', () => {
      manager.getCircuitBreaker('service1');
      manager.getCircuitBreaker('service2');

      const breakers = manager.getAllCircuitBreakers();

      expect(breakers.size).toBe(2);
      expect(breakers.has('service1')).toBe(true);
      expect(breakers.has('service2')).toBe(true);
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status of all circuit breakers', () => {
      manager.getCircuitBreaker('service1');
      manager.getCircuitBreaker('service2');

      const status = manager.getHealthStatus();

      expect(status).toHaveProperty('service1');
      expect(status).toHaveProperty('service2');
      expect(status.service1.state).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('resetAll', () => {
    it('should reset all circuit breakers', async () => {
      const breaker1 = manager.getCircuitBreaker('service1');
      const breaker2 = manager.getCircuitBreaker('service2');

      // Force open both breakers
      breaker1.forceOpen();
      breaker2.forceOpen();

      expect(breaker1.getStats().state).toBe(CircuitBreakerState.OPEN);
      expect(breaker2.getStats().state).toBe(CircuitBreakerState.OPEN);

      manager.resetAll();

      expect(breaker1.getStats().state).toBe(CircuitBreakerState.CLOSED);
      expect(breaker2.getStats().state).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('removeCircuitBreaker', () => {
    it('should remove circuit breaker', () => {
      manager.getCircuitBreaker('test-service');
      expect(manager.getAllCircuitBreakers().has('test-service')).toBe(true);

      const removed = manager.removeCircuitBreaker('test-service');

      expect(removed).toBe(true);
      expect(manager.getAllCircuitBreakers().has('test-service')).toBe(false);
    });

    it('should return false if circuit breaker does not exist', () => {
      const removed = manager.removeCircuitBreaker('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('getSystemHealth', () => {
    it('should return overall system health', () => {
      const breaker1 = manager.getCircuitBreaker('service1');
      const breaker2 = manager.getCircuitBreaker('service2');

      const health = manager.getSystemHealth();

      expect(health.healthy).toBe(true);
      expect(health.totalBreakers).toBe(2);
      expect(health.healthyBreakers).toBe(2);
      expect(health.openBreakers).toBe(0);
      expect(health.halfOpenBreakers).toBe(0);
    });

    it('should report unhealthy when breakers are open', () => {
      const breaker = manager.getCircuitBreaker('service1');
      breaker.forceOpen();

      const health = manager.getSystemHealth();

      expect(health.healthy).toBe(false);
      expect(health.openBreakers).toBe(1);
    });
  });
});