/**
 * useFormPersistence Hook Tests
 * Comprehensive testing for form auto-save and data persistence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFormPersistence } from '../useFormPersistence';

// Mock localStorage and sessionStorage
const createMockStorage = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

describe('useFormPersistence', () => {
  let mockLocalStorage: ReturnType<typeof createMockStorage>;
  let mockSessionStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockLocalStorage = createMockStorage();
    mockSessionStorage = createMockStorage();
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John', email: 'john@example.com' })
      );

      expect(result.current.data).toEqual({ name: 'John', email: 'john@example.com' });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.lastSaved).toBeNull();
    });

    it('should load persisted data on initialization', () => {
      const persistedData = { name: 'Jane', email: 'jane@example.com' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedData));

      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John', email: 'john@example.com' })
      );

      expect(result.current.data).toEqual(persistedData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('form-test-form');
    });

    it('should handle corrupted persisted data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const initialData = { name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() => 
        useFormPersistence('test-form', initialData)
      );

      expect(result.current.data).toEqual(initialData);
    });

    it('should use sessionStorage when specified', () => {
      const persistedData = { name: 'Jane', email: 'jane@example.com' };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(persistedData));

      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' }, {
          storage: 'sessionStorage'
        })
      );

      expect(result.current.data).toEqual(persistedData);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('form-test-form');
    });
  });

  describe('Data Updates', () => {
    it('should update data and trigger auto-save', async () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: '', email: '' }, {
          autoSave: true,
          debounceMs: 500,
        })
      );

      act(() => {
        result.current.updateData({ name: 'John' });
      });

      expect(result.current.data).toEqual({ name: 'John', email: '' });
      expect(result.current.isSaving).toBe(true);

      // Fast-forward debounce timer
      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'form-test-form',
          JSON.stringify({ name: 'John', email: '' })
        );
      });
    });

    it('should merge partial updates', () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John', email: 'john@example.com', age: 25 })
      );

      act(() => {
        result.current.updateData({ email: 'newemail@example.com' });
      });

      expect(result.current.data).toEqual({
        name: 'John',
        email: 'newemail@example.com',
        age: 25,
      });
    });

    it('should handle nested object updates', () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', {
          user: { name: 'John', email: 'john@example.com' },
          preferences: { theme: 'dark' },
        })
      );

      act(() => {
        result.current.updateData({
          user: { ...result.current.data.user, name: 'Jane' }
        });
      });

      expect(result.current.data.user.name).toBe('Jane');
      expect(result.current.data.user.email).toBe('john@example.com');
      expect(result.current.data.preferences.theme).toBe('dark');
    });

    it('should debounce multiple rapid updates', async () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: '' }, {
          autoSave: true,
          debounceMs: 300,
        })
      );

      // Make multiple rapid updates
      act(() => {
        result.current.updateData({ name: 'J' });
      });

      act(() => {
        result.current.updateData({ name: 'Jo' });
      });

      act(() => {
        result.current.updateData({ name: 'John' });
      });

      expect(result.current.isSaving).toBe(true);

      // Fast-forward less than debounce time
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should not have saved yet
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      // Fast-forward past debounce time
      act(() => {
        vi.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'form-test-form',
          JSON.stringify({ name: 'John' })
        );
      });
    });
  });

  describe('Manual Save', () => {
    it('should save data manually', async () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' }, {
          autoSave: false,
        })
      );

      act(() => {
        result.current.updateData({ name: 'Jane' });
      });

      // Should not auto-save
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      // Manual save
      await act(async () => {
        await result.current.save();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'form-test-form',
        JSON.stringify({ name: 'Jane' })
      );
    });

    it('should handle save errors', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const onError = vi.fn();
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' }, {
          onError,
        })
      );

      await act(async () => {
        await result.current.save();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Storage quota exceeded',
        })
      );
    });

    it('should update last saved timestamp', async () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' })
      );

      const beforeSave = Date.now();

      await act(async () => {
        await result.current.save();
      });

      expect(result.current.lastSaved).toBeGreaterThanOrEqual(beforeSave);
    });
  });

  describe('Data Restoration', () => {
    it('should restore data from storage', () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' })
      );

      // Update data
      act(() => {
        result.current.updateData({ name: 'Jane' });
      });

      // Restore original data
      act(() => {
        result.current.restore();
      });

      expect(result.current.data).toEqual({ name: 'John' });
    });

    it('should restore from persisted data if available', () => {
      const persistedData = { name: 'Persisted', email: 'persisted@example.com' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedData));

      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'Initial' })
      );

      // Update data
      act(() => {
        result.current.updateData({ name: 'Updated' });
      });

      // Restore should go back to persisted data
      act(() => {
        result.current.restore();
      });

      expect(result.current.data).toEqual(persistedData);
    });
  });

  describe('Data Clearing', () => {
    it('should clear persisted data', () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' })
      );

      act(() => {
        result.current.clear();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('form-test-form');
      expect(result.current.data).toEqual({ name: 'John' }); // Reset to initial
    });

    it('should clear data and reset to initial state', () => {
      const initialData = { name: 'Initial', email: 'initial@example.com' };
      const { result } = renderHook(() => 
        useFormPersistence('test-form', initialData)
      );

      // Update data
      act(() => {
        result.current.updateData({ name: 'Updated' });
      });

      // Clear should reset to initial
      act(() => {
        result.current.clear();
      });

      expect(result.current.data).toEqual(initialData);
    });
  });

  describe('Storage Events', () => {
    it('should sync data across tabs', () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' })
      );

      // Simulate storage event from another tab
      const newData = { name: 'Updated from another tab' };
      const storageEvent = new StorageEvent('storage', {
        key: 'form-test-form',
        newValue: JSON.stringify(newData),
        storageArea: localStorage,
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.data).toEqual(newData);
    });

    it('should ignore storage events for other keys', () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' })
      );

      const originalData = result.current.data;

      // Simulate storage event for different key
      const storageEvent = new StorageEvent('storage', {
        key: 'form-other-form',
        newValue: JSON.stringify({ name: 'Other' }),
        storageArea: localStorage,
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.data).toEqual(originalData);
    });

    it('should handle storage event with null value', () => {
      const initialData = { name: 'John' };
      const { result } = renderHook(() => 
        useFormPersistence('test-form', initialData)
      );

      // Update data first
      act(() => {
        result.current.updateData({ name: 'Updated' });
      });

      // Simulate storage event with null (data cleared in another tab)
      const storageEvent = new StorageEvent('storage', {
        key: 'form-test-form',
        newValue: null,
        storageArea: localStorage,
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.data).toEqual(initialData); // Reset to initial
    });
  });

  describe('Custom Storage Key', () => {
    it('should use custom storage key', () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' }, {
          storageKey: 'custom-key',
        })
      );

      act(() => {
        result.current.save();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'custom-key',
        JSON.stringify({ name: 'John' })
      );
    });

    it('should use custom key prefix', () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' }, {
          keyPrefix: 'myapp-form',
        })
      );

      act(() => {
        result.current.save();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'myapp-form-test-form',
        JSON.stringify({ name: 'John' })
      );
    });
  });

  describe('Data Validation', () => {
    it('should validate data before saving', async () => {
      const validator = vi.fn((data: any) => {
        if (!data.email) {
          throw new Error('Email is required');
        }
        return true;
      });

      const onError = vi.fn();
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John', email: '' }, {
          validator,
          onError,
        })
      );

      await act(async () => {
        await result.current.save();
      });

      expect(validator).toHaveBeenCalledWith({ name: 'John', email: '' });
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email is required',
        })
      );
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should save when validation passes', async () => {
      const validator = vi.fn(() => true);

      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John', email: 'john@example.com' }, {
          validator,
        })
      );

      await act(async () => {
        await result.current.save();
      });

      expect(validator).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Data Transformation', () => {
    it('should transform data before saving', async () => {
      const transformer = vi.fn((data: any) => ({
        ...data,
        name: data.name.toUpperCase(),
        timestamp: Date.now(),
      }));

      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'john' }, {
          transformer,
        })
      );

      await act(async () => {
        await result.current.save();
      });

      expect(transformer).toHaveBeenCalledWith({ name: 'john' });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'form-test-form',
        expect.stringContaining('"name":"JOHN"')
      );
    });

    it('should not transform data in memory', () => {
      const transformer = vi.fn((data: any) => ({
        ...data,
        name: data.name.toUpperCase(),
      }));

      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'john' }, {
          transformer,
        })
      );

      // Data in memory should remain unchanged
      expect(result.current.data.name).toBe('john');
    });
  });

  describe('Expiration', () => {
    it('should expire old data', () => {
      const expiredData = {
        data: { name: 'John' },
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredData));

      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'Default' }, {
          expirationHours: 24,
        })
      );

      expect(result.current.data).toEqual({ name: 'Default' });
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('form-test-form');
    });

    it('should load non-expired data', () => {
      const validData = {
        data: { name: 'John' },
        timestamp: Date.now() - (1 * 60 * 60 * 1000), // 1 hour ago
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validData));

      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'Default' }, {
          expirationHours: 24,
        })
      );

      expect(result.current.data).toEqual({ name: 'John' });
    });

    it('should save data with timestamp when expiration is enabled', async () => {
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' }, {
          expirationHours: 24,
        })
      );

      await act(async () => {
        await result.current.save();
      });

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveProperty('data', { name: 'John' });
      expect(savedData).toHaveProperty('timestamp');
      expect(typeof savedData.timestamp).toBe('number');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' }, {
          autoSave: true,
        })
      );

      // Make an update to start the debounce timer
      act(() => {
        vi.advanceTimersByTime(100);
      });

      unmount();

      // Timer should be cleared
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should remove storage event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('should handle storage quota exceeded', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const onError = vi.fn();
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' }, {
          onError,
        })
      );

      await act(async () => {
        await result.current.save();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'QuotaExceededError',
        })
      );
    });

    it('should handle storage not available', () => {
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: true,
      });

      const onError = vi.fn();
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'John' }, {
          onError,
        })
      );

      expect(result.current.data).toEqual({ name: 'John' });
      // Should fallback gracefully without storage
    });

    it('should handle JSON parse errors', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json{');

      const onError = vi.fn();
      const { result } = renderHook(() => 
        useFormPersistence('test-form', { name: 'Default' }, {
          onError,
        })
      );

      expect(result.current.data).toEqual({ name: 'Default' });
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('JSON'),
        })
      );
    });
  });
});