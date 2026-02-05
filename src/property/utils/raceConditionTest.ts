/**
 * Race Condition Test Utility
 * Tests for race conditions in API calls and component renders
 */

interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
}

export class RaceConditionTester {
  private apiCallTimestamps: number[] = [];
  private renderTimestamps: number[] = [];

  /**
   * Test if API calls are properly debounced
   */
  testApiDebouncing(minInterval: number = 300): TestResult {
    if (this.apiCallTimestamps.length < 2) {
      return {
        passed: true,
        message: "Not enough API calls to test debouncing"
      };
    }

    const intervals = [];
    for (let i = 1; i < this.apiCallTimestamps.length; i++) {
      intervals.push(this.apiCallTimestamps[i] - this.apiCallTimestamps[i - 1]);
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const tooFastCalls = intervals.filter(interval => interval < minInterval).length;

    const passed = averageInterval >= minInterval && tooFastCalls <= 1; // Allow 1 fast call for initial load

    return {
      passed,
      message: passed 
        ? `API calls properly debounced (avg: ${averageInterval.toFixed(0)}ms)`
        : `API calls too frequent (avg: ${averageInterval.toFixed(0)}ms, expected: ${minInterval}ms+)`,
      details: {
        averageInterval,
        tooFastCalls,
        totalCalls: this.apiCallTimestamps.length,
        intervals
      }
    };
  }

  /**
   * Test for duplicate consecutive API calls (race conditions)
   */
  testRaceConditions(): TestResult {
    if (this.apiCallTimestamps.length < 2) {
      return {
        passed: true,
        message: "Not enough API calls to test race conditions"
      };
    }

    // Check for calls that are too close together (< 100ms)
    const racyIntervals = [];
    for (let i = 1; i < this.apiCallTimestamps.length; i++) {
      const interval = this.apiCallTimestamps[i] - this.apiCallTimestamps[i - 1];
      if (interval < 100) {
        racyIntervals.push(interval);
      }
    }

    const passed = racyIntervals.length === 0;

    return {
      passed,
      message: passed 
        ? "No race conditions detected"
        : `${racyIntervals.length} potential race conditions detected`,
      details: {
        racyIntervals,
        totalCalls: this.apiCallTimestamps.length
      }
    };
  }

  /**
   * Test for excessive renders
   */
  testExcessiveRenders(maxRenders: number = 50): TestResult {
    const passed = this.renderTimestamps.length <= maxRenders;

    return {
      passed,
      message: passed 
        ? `Render count acceptable (${this.renderTimestamps.length}/${maxRenders})`
        : `Excessive renders detected (${this.renderTimestamps.length}/${maxRenders})`,
      details: {
        renderCount: this.renderTimestamps.length,
        maxAllowed: maxRenders
      }
    };
  }

  /**
   * Record an API call timestamp
   */
  recordApiCall(): void {
    this.apiCallTimestamps.push(Date.now());
    
    // Keep only last 20 calls for memory efficiency
    if (this.apiCallTimestamps.length > 20) {
      this.apiCallTimestamps = this.apiCallTimestamps.slice(-20);
    }
  }

  /**
   * Record a render timestamp
   */
  recordRender(): void {
    this.renderTimestamps.push(Date.now());
    
    // Keep only last 100 renders for memory efficiency
    if (this.renderTimestamps.length > 100) {
      this.renderTimestamps = this.renderTimestamps.slice(-100);
    }
  }

  /**
   * Run all tests and return comprehensive results
   */
  runAllTests(): {
    overall: 'PASS' | 'FAIL';
    tests: {
      debouncing: TestResult;
      raceConditions: TestResult;
      excessiveRenders: TestResult;
    };
  } {
    const tests = {
      debouncing: this.testApiDebouncing(),
      raceConditions: this.testRaceConditions(),
      excessiveRenders: this.testExcessiveRenders()
    };

    const overall = Object.values(tests).every(test => test.passed) ? 'PASS' : 'FAIL';

    return { overall, tests };
  }

  /**
   * Reset all recorded data
   */
  reset(): void {
    this.apiCallTimestamps = [];
    this.renderTimestamps = [];
  }

  /**
   * Get current statistics
   */
  getStats(): {
    apiCalls: number;
    renders: number;
    avgApiInterval: number;
    avgRenderInterval: number;
  } {
    const avgApiInterval = this.apiCallTimestamps.length > 1 
      ? (this.apiCallTimestamps[this.apiCallTimestamps.length - 1] - this.apiCallTimestamps[0]) / (this.apiCallTimestamps.length - 1)
      : 0;

    const avgRenderInterval = this.renderTimestamps.length > 1
      ? (this.renderTimestamps[this.renderTimestamps.length - 1] - this.renderTimestamps[0]) / (this.renderTimestamps.length - 1)
      : 0;

    return {
      apiCalls: this.apiCallTimestamps.length,
      renders: this.renderTimestamps.length,
      avgApiInterval,
      avgRenderInterval
    };
  }
}

// Singleton instance for global use
export const raceConditionTester = new RaceConditionTester();