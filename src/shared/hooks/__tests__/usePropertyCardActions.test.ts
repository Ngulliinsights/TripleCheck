import { renderHook, act } from '@testing-library/react'
import { usePropertyCardActions } from '../usePropertyCardActions'
import type { NormalizedProperty } from '../../types/property'

// Mock property for testing
const mockProperty: NormalizedProperty = {
  id: 'test-property-1',
  title: 'Test Property',
  price: 1000000,
  location: 'Test Location',
  description: 'Test Description',
  images: [],
  type: 'residential',
  category: 'residential',
  features: {},
  verificationStatus: 'pending',
  trustScore: 85,
};

// Mock callbacks
const mockCallbacks = {
  onSave: jest.fn(),
  onShare: jest.fn(),
  onViewDetails: jest.fn(),
  onVerify: jest.fn(),
  onClick: jest.fn(),
};

// Mock DOM APIs
Object.assign(navigator, {
  share: jest.fn(),
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://example.com',
  },
  writable: true,
});

describe('usePropertyCardActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle save action', () => {
    const { result } = renderHook(() =>
      usePropertyCardActions(mockProperty, mockCallbacks)
    );

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as any;

    act(() => {
      result.current.handleSave(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockCallbacks.onSave).toHaveBeenCalledWith('test-property-1');
  });

  it('should handle view details action', () => {
    const { result } = renderHook(() =>
      usePropertyCardActions(mockProperty, mockCallbacks)
    );

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as any;

    act(() => {
      result.current.handleViewDetails(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockCallbacks.onViewDetails).toHaveBeenCalledWith('test-property-1');
  });

  it('should handle verify action', () => {
    const { result } = renderHook(() =>
      usePropertyCardActions(mockProperty, mockCallbacks)
    );

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as any;

    act(() => {
      result.current.handleVerify(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockCallbacks.onVerify).toHaveBeenCalledWith('test-property-1');
  });

  it('should handle card click action', () => {
    const { result } = renderHook(() =>
      usePropertyCardActions(mockProperty, mockCallbacks)
    );

    const mockEvent = {
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleCardClick(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockCallbacks.onClick).toHaveBeenCalledWith(mockProperty);
  });

  it('should handle share with native share API', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    (navigator.share as jest.Mock) = mockShare;

    const { result } = renderHook(() =>
      usePropertyCardActions(mockProperty, mockCallbacks)
    );

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as any;

    await act(async () => {
      await result.current.handleShare(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Test Property',
      text: 'Check out this residential property: Test Property',
      url: 'https://example.com/property/test-property-1',
    });
  });

  it('should handle share with clipboard fallback', async () => {
    // Mock navigator.share to be undefined
    (navigator.share as any) = undefined;
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    (navigator.clipboard.writeText as jest.Mock) = mockWriteText;

    const { result } = renderHook(() =>
      usePropertyCardActions(mockProperty, mockCallbacks)
    );

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as any;

    await act(async () => {
      await result.current.handleShare(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockWriteText).toHaveBeenCalledWith('https://example.com/property/test-property-1');
  });

  it('should handle share with callback fallback', async () => {
    // Mock both navigator.share and navigator.clipboard to be undefined
    (navigator.share as any) = undefined;
    (navigator.clipboard as any) = undefined;

    const { result } = renderHook(() =>
      usePropertyCardActions(mockProperty, mockCallbacks)
    );

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as any;

    await act(async () => {
      await result.current.handleShare(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockCallbacks.onShare).toHaveBeenCalledWith('test-property-1');
  });

  it('should handle action errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const errorCallback = jest.fn().mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() =>
      usePropertyCardActions(mockProperty, {
        ...mockCallbacks,
        onSave: errorCallback,
      })
    );

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as any;

    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Save action failed:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('should work without optional callbacks', () => {
    const { result } = renderHook(() =>
      usePropertyCardActions(mockProperty, {})
    );

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as any;

    // Should not throw errors
    expect(() => {
      result.current.handleSave(mockEvent);
      result.current.handleViewDetails(mockEvent);
      result.current.handleVerify(mockEvent);
    }).not.toThrow();
  });
});