import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { PropertyMap } from '../PropertyMap'

// Mock Google Maps Loader
const mockImportLibrary = vi.fn();
vi.mock('@googlemaps/js-api-loader', () => ({
  Loader: vi.fn().mockImplementation(() => ({
    importLibrary: mockImportLibrary,
  })),
}));

// Mock UI components
vi.mock('@shared/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
}));

vi.mock('@shared/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className} data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={className} data-testid="card-title">{children}</h3>
  ),
}));

vi.mock('@shared/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-variant={variant}
      data-size={size}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

vi.mock('@shared/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span className={className} data-testid="badge">{children}</span>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  MapPin: ({ className }: any) => <div className={className} data-testid="map-pin-icon" />,
  Navigation: ({ className }: any) => <div className={className} data-testid="navigation-icon" />,
  Layers: ({ className }: any) => <div className={className} data-testid="layers-icon" />,
  ZoomIn: ({ className }: any) => <div className={className} data-testid="zoom-in-icon" />,
  ZoomOut: ({ className }: any) => <div className={className} data-testid="zoom-out-icon" />,
  RotateCcw: ({ className }: any) => <div className={className} data-testid="rotate-icon" />,
  School: ({ className }: any) => <div className={className} data-testid="school-icon" />,
  Hospital: ({ className }: any) => <div className={className} data-testid="hospital-icon" />,
  ShoppingCart: ({ className }: any) => <div className={className} data-testid="shopping-icon" />,
  Utensils: ({ className }: any) => <div className={className} data-testid="utensils-icon" />,
  Bus: ({ className }: any) => <div className={className} data-testid="bus-icon" />,
}));

// Mock Google Maps API
const mockMap = {
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  getZoom: vi.fn().mockReturnValue(15),
};

const mockMarker = {
  setMap: vi.fn(),
  addListener: vi.fn(),
};

const mockInfoWindow = {
  open: vi.fn(),
};

const mockPlacesService = {
  nearbySearch: vi.fn(),
};

const mockGoogle = {
  maps: {
    Map: vi.fn().mockImplementation(() => mockMap),
    Marker: vi.fn().mockImplementation(() => mockMarker),
    InfoWindow: vi.fn().mockImplementation(() => mockInfoWindow),
    Size: vi.fn(),
    Point: vi.fn(),
  },
  places: {
    PlacesService: vi.fn().mockImplementation(() => mockPlacesService),
    PlacesServiceStatus: {
      OK: 'OK',
    },
  },
};

// Mock environment variable
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-api-key',
  };
  
  // Mock global google object
  (global as any).google = mockGoogle;
  (global as any).window = { google: mockGoogle };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('PropertyMap', () => {
  const mockLocation = {
    lat: -1.2921,
    lng: 36.8219,
    address: '123 Test Street, Nairobi',
    title: 'Test Property',
    price: 5000000,
    verified: true,
  };

  const mockNearbyProperties = [
    {
      lat: -1.2925,
      lng: 36.8225,
      address: '456 Nearby Street',
      title: 'Nearby Property 1',
      price: 4500000,
    },
    {
      lat: -1.2915,
      lng: 36.8215,
      address: '789 Close Street',
      title: 'Nearby Property 2',
      price: 5500000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockImportLibrary.mockResolvedValue(undefined);
  });

  describe('Loading States', () => {
    it('shows skeleton while loading Google Maps', () => {
      mockImportLibrary.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<PropertyMap location={mockLocation} />);
      
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('shows map after Google Maps loads', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(<PropertyMap location={mockLocation} />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error when API key is missing', () => {
      const originalKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      render(<PropertyMap location={mockLocation} />);
      
      expect(screen.getByText('Google Maps API key not configured')).toBeInTheDocument();
      
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalKey;
    });

    it('shows error when Google Maps fails to load', async () => {
      mockImportLibrary.mockRejectedValue(new Error('Failed to load'));
      
      render(<PropertyMap location={mockLocation} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load Google Maps')).toBeInTheDocument();
      });
    });
  });

  describe('Map Initialization', () => {
    it('creates map with correct center and zoom', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(<PropertyMap location={mockLocation} />);
      
      await waitFor(() => {
        expect(mockGoogle.maps.Map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            center: { lat: mockLocation.lat, lng: mockLocation.lng },
            zoom: 15,
            mapTypeId: 'roadmap',
          })
        );
      });
    });

    it('creates main marker for property location', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(<PropertyMap location={mockLocation} />);
      
      await waitFor(() => {
        expect(mockGoogle.maps.Marker).toHaveBeenCalledWith(
          expect.objectContaining({
            position: { lat: mockLocation.lat, lng: mockLocation.lng },
            map: mockMap,
            title: mockLocation.title,
          })
        );
      });
    });

    it('creates markers for nearby properties', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(
        <PropertyMap 
          location={mockLocation} 
          nearbyProperties={mockNearbyProperties}
        />
      );
      
      await waitFor(() => {
        // Should create main marker + 2 nearby property markers
        expect(mockGoogle.maps.Marker).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Interactive Controls', () => {
    it('renders control buttons when interactive', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(<PropertyMap location={mockLocation} interactive={true} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('layers-icon')).toBeInTheDocument();
        expect(screen.getByTestId('navigation-icon')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-in-icon')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-out-icon')).toBeInTheDocument();
        expect(screen.getByTestId('rotate-icon')).toBeInTheDocument();
      });
    });

    it('does not render control buttons when not interactive', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(<PropertyMap location={mockLocation} interactive={false} />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('zoom-in-icon')).not.toBeInTheDocument();
        expect(screen.queryByTestId('zoom-out-icon')).not.toBeInTheDocument();
        expect(screen.queryByTestId('rotate-icon')).not.toBeInTheDocument();
      });
    });

    it('handles zoom in button click', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(<PropertyMap location={mockLocation} interactive={true} />);
      
      await waitFor(() => {
        const zoomInButton = screen.getAllByTestId('button').find(
          button => button.querySelector('[data-testid="zoom-in-icon"]')
        );
        fireEvent.click(zoomInButton!);
        
        expect(mockMap.setZoom).toHaveBeenCalledWith(16);
      });
    });

    it('handles zoom out button click', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(<PropertyMap location={mockLocation} interactive={true} />);
      
      await waitFor(() => {
        const zoomOutButton = screen.getAllByTestId('button').find(
          button => button.querySelector('[data-testid="zoom-out-icon"]')
        );
        fireEvent.click(zoomOutButton!);
        
        expect(mockMap.setZoom).toHaveBeenCalledWith(14);
      });
    });

    it('handles reset view button click', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(<PropertyMap location={mockLocation} interactive={true} />);
      
      await waitFor(() => {
        const resetButton = screen.getAllByTestId('button').find(
          button => button.querySelector('[data-testid="rotate-icon"]')
        );
        fireEvent.click(resetButton!);
        
        expect(mockMap.setCenter).toHaveBeenCalledWith({
          lat: mockLocation.lat,
          lng: mockLocation.lng,
        });
        expect(mockMap.setZoom).toHaveBeenCalledWith(15);
      });
    });
  });

  describe('Map Type Toggle', () => {
    it('toggles between roadmap and satellite view', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(<PropertyMap location={mockLocation} interactive={true} />);
      
      await waitFor(() => {
        const layersButton = screen.getAllByTestId('button').find(
          button => button.querySelector('[data-testid="layers-icon"]')
        );
        fireEvent.click(layersButton!);
      });
      
      // Should reinitialize map with satellite view
      await waitFor(() => {
        expect(mockGoogle.maps.Map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            mapTypeId: 'satellite',
          })
        );
      });
    });
  });

  describe('Nearby Places', () => {
    it('loads nearby places when showNearbyPlaces is true', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(
        <PropertyMap 
          location={mockLocation} 
          showNearbyPlaces={true}
        />
      );
      
      await waitFor(() => {
        expect(mockGoogle.places.PlacesService).toHaveBeenCalledWith(mockMap);
        expect(mockPlacesService.nearbySearch).toHaveBeenCalled();
      });
    });

    it('does not load nearby places when showNearbyPlaces is false', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(
        <PropertyMap 
          location={mockLocation} 
          showNearbyPlaces={false}
        />
      );
      
      await waitFor(() => {
        expect(mockPlacesService.nearbySearch).not.toHaveBeenCalled();
      });
    });

    it('displays nearby places when found', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      // Mock places service to return results
      mockPlacesService.nearbySearch.mockImplementation((request, callback) => {
        const mockResults = [
          {
            name: 'Test School',
            geometry: {
              location: {
                lat: () => -1.2920,
                lng: () => 36.8220,
              },
            },
            rating: 4.5,
          },
        ];
        callback(mockResults, 'OK');
      });
      
      render(
        <PropertyMap 
          location={mockLocation} 
          showNearbyPlaces={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Nearby Places')).toBeInTheDocument();
      });
    });
  });

  describe('External Navigation', () => {
    it('opens Google Maps in new tab when navigation button clicked', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      const mockOpen = vi.fn();
      global.window.open = mockOpen;
      
      render(<PropertyMap location={mockLocation} interactive={true} />);
      
      await waitFor(() => {
        const navigationButton = screen.getAllByTestId('button').find(
          button => button.querySelector('[data-testid="navigation-icon"]')
        );
        fireEvent.click(navigationButton!);
        
        expect(mockOpen).toHaveBeenCalledWith(
          `https://www.google.com/maps/search/?api=1&query=${mockLocation.lat},${mockLocation.lng}`,
          '_blank'
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('renders proper heading for map section', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(<PropertyMap location={mockLocation} />);
      
      await waitFor(() => {
        expect(screen.getByText('Property Location')).toBeInTheDocument();
      });
    });

    it('provides proper button labels through icons', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      render(<PropertyMap location={mockLocation} interactive={true} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('zoom-in-icon')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-out-icon')).toBeInTheDocument();
        expect(screen.getByTestId('rotate-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Props and Configuration', () => {
    it('applies custom className', () => {
      render(<PropertyMap location={mockLocation} className="custom-class" />);
      
      const container = screen.getByTestId('card').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('uses custom height when provided', () => {
      render(<PropertyMap location={mockLocation} height="500px" />);
      
      // Height is applied to the map container div
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('cleans up markers when component unmounts', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      const { unmount } = render(<PropertyMap location={mockLocation} />);
      
      await waitFor(() => {
        expect(mockGoogle.maps.Marker).toHaveBeenCalled();
      });
      
      unmount();
      
      // Markers should be cleaned up
      expect(mockMarker.setMap).toHaveBeenCalledWith(null);
    });

    it('cleans up markers when location changes', async () => {
      mockImportLibrary.mockResolvedValue(undefined);
      
      const { rerender } = render(<PropertyMap location={mockLocation} />);
      
      await waitFor(() => {
        expect(mockGoogle.maps.Marker).toHaveBeenCalled();
      });
      
      const newLocation = { ...mockLocation, lat: -1.3000, lng: 36.8300 };
      rerender(<PropertyMap location={newLocation} />);
      
      await waitFor(() => {
        expect(mockMarker.setMap).toHaveBeenCalledWith(null);
      });
    });
  });
});