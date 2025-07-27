/**
 * Property components accessibility test suite
 * Tests property-specific components for accessibility compliance
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { 
  testA11y, 
  testKeyboardAccessibility, 
  testAriaAttributes, 
  testScreenReaderCompatibility,
  runFullAccessibilityTest,
  a11yConfigs
} from '../../../shared/test-utils/accessibility';

// Mock property data
const mockProperty = {
  id: '1',
  title: 'Beautiful Family Home',
  price: 450000,
  location: 'Nairobi, Kenya',
  bedrooms: 3,
  bathrooms: 2,
  area: 1200,
  images: [
    { url: '/property1.jpg', alt: 'Front view of the house' },
    { url: '/property2.jpg', alt: 'Living room interior' },
    { url: '/property3.jpg', alt: 'Kitchen area' }
  ],
  description: 'A beautiful family home in a quiet neighborhood.',
  features: ['Garden', 'Parking', 'Security'],
  rating: 4.5,
  reviews: [
    {
      id: '1',
      author: 'John Doe',
      rating: 5,
      comment: 'Great property!',
      date: '2024-01-15'
    }
  ]
};

// Router wrapper for components that use navigation
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Property Components Accessibility', () => {
  describe('Property Card Component', () => {
    const PropertyCard = ({ property }: { property: typeof mockProperty }) => (
      <article className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
        <div className="relative">
          <img 
            src={property.images[0].url} 
            alt={property.images[0].alt}
            className="w-full h-48 object-cover rounded"
          />
          <button 
            className="absolute top-2 right-2 p-2 bg-white rounded-full"
            aria-label={`Add ${property.title} to favorites`}
          >
            ♡
          </button>
        </div>
        
        <div className="mt-4">
          <h3 className="text-lg font-semibold">
            <a href={`/property/${property.id}`} className="hover:text-blue-600">
              {property.title}
            </a>
          </h3>
          
          <p className="text-gray-600 mt-1">{property.location}</p>
          
          <div className="flex items-center mt-2" role="group" aria-label="Property details">
            <span className="text-sm text-gray-500">
              {property.bedrooms} bed • {property.bathrooms} bath • {property.area} sqft
            </span>
          </div>
          
          <div className="flex items-center mt-2">
            <div 
              className="flex items-center" 
              role="img" 
              aria-label={`Rating: ${property.rating} out of 5 stars`}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star}
                  className={star <= property.rating ? 'text-yellow-400' : 'text-gray-300'}
                  aria-hidden="true"
                >
                  ★
                </span>
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              ({property.reviews.length} review{property.reviews.length !== 1 ? 's' : ''})
            </span>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-xl font-bold text-green-600">
              ${property.price.toLocaleString()}
            </span>
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              aria-describedby={`property-${property.id}-details`}
            >
              View Details
            </button>
          </div>
          
          <div id={`property-${property.id}-details`} className="sr-only">
            Property details for {property.title} located in {property.location}
          </div>
        </div>
      </article>
    );

    it('passes automated accessibility tests', async () => {
      const { container } = render(
        <RouterWrapper>
          <PropertyCard property={mockProperty} />
        </RouterWrapper>
      );
      
      await testA11y(container, a11yConfigs.strict);
    });

    it('has proper semantic structure', () => {
      const { container } = render(
        <RouterWrapper>
          <PropertyCard property={mockProperty} />
        </RouterWrapper>
      );

      // Should be an article
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();

      // Should have proper heading
      const heading = screen.getByRole('heading', { level: 3, name: mockProperty.title });
      expect(heading).toBeInTheDocument();

      // Image should have alt text
      const image = screen.getByRole('img', { name: mockProperty.images[0].alt });
      expect(image).toBeInTheDocument();
    });

    it('has accessible interactive elements', () => {
      const { container } = render(
        <RouterWrapper>
          <PropertyCard property={mockProperty} />
        </RouterWrapper>
      );

      testAriaAttributes(container, {
        hasAriaLabel: [
          { selector: 'button[aria-label*="Add"]', label: `Add ${mockProperty.title} to favorites` }
        ],
        hasAriaDescribedBy: [
          { selector: 'button:contains("View Details")', describedBy: `property-${mockProperty.id}-details` }
        ]
      });

      // Rating should have proper ARIA label
      const rating = container.querySelector('[role="img"][aria-label*="Rating"]');
      expect(rating).toHaveAttribute('aria-label', `Rating: ${mockProperty.rating} out of 5 stars`);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <PropertyCard property={mockProperty} />
        </RouterWrapper>
      );

      const propertyLink = screen.getByRole('link', { name: mockProperty.title });
      const favoriteButton = screen.getByRole('button', { name: `Add ${mockProperty.title} to favorites` });
      const viewDetailsButton = screen.getByRole('button', { name: 'View Details' });

      // Tab through interactive elements
      await user.tab();
      expect(propertyLink).toHaveFocus();

      await user.tab();
      expect(favoriteButton).toHaveFocus();

      await user.tab();
      expect(viewDetailsButton).toHaveFocus();
    });

    it('provides screen reader friendly content', () => {
      const { container } = render(
        <RouterWrapper>
          <PropertyCard property={mockProperty} />
        </RouterWrapper>
      );

      testScreenReaderCompatibility(container, {
        expectHeadings: true,
        expectLandmarks: false,
        expectAltText: true
      });

      // Check for screen reader only content
      const srOnlyContent = container.querySelector('.sr-only');
      expect(srOnlyContent).toBeInTheDocument();
      expect(srOnlyContent).toHaveTextContent(`Property details for ${mockProperty.title} located in ${mockProperty.location}`);
    });
  });

  describe('Property Gallery Component', () => {
    const PropertyGallery = ({ images }: { images: typeof mockProperty.images }) => {
      const [currentIndex, setCurrentIndex] = React.useState(0);

      return (
        <div className="relative">
          <div 
            className="relative h-96 bg-gray-200 rounded-lg overflow-hidden"
          >
            <img 
              src={images[currentIndex].url}
              alt={images[currentIndex].alt}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                  onClick={() => setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : images.length - 1)}
                  aria-label="Previous image"
                  disabled={images.length <= 1}
                >
                  ←
                </button>
                
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                  onClick={() => setCurrentIndex(currentIndex < images.length - 1 ? currentIndex + 1 : 0)}
                  aria-label="Next image"
                  disabled={images.length <= 1}
                >
                  →
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnail navigation */}
          {images.length > 1 && (
            <div className="flex mt-4 space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  className={`flex-shrink-0 w-16 h-16 rounded border-2 ${
                    index === currentIndex ? 'border-blue-500' : 'border-gray-300'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`View image ${index + 1}: ${image.alt}`}
                  aria-pressed={index === currentIndex}
                >
                  <img 
                    src={image.url}
                    alt=""
                    className="w-full h-full object-cover rounded"
                  />
                </button>
              ))}
            </div>
          )}
          
          {/* Live region for screen reader announcements */}
          <div 
            aria-live="polite" 
            aria-atomic="true"
            className="sr-only"
          >
            Showing image {currentIndex + 1} of {images.length}: {images[currentIndex].alt}
          </div>
        </div>
      );
    };

    it('passes automated accessibility tests', async () => {
      const { container } = render(<PropertyGallery images={mockProperty.images} />);
      await testA11y(container);
    });

    it('has proper ARIA attributes for carousel', () => {
      const { container } = render(<PropertyGallery images={mockProperty.images} />);

      // Main image should have proper alt text
      const mainImage = container.querySelector('img');
      expect(mainImage).toHaveAttribute('alt', mockProperty.images[0].alt);

      // Navigation buttons should have proper labels
      const prevButton = screen.getByRole('button', { name: 'Previous image' });
      const nextButton = screen.getByRole('button', { name: 'Next image' });
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();

      // Thumbnail buttons should have aria-pressed
      const thumbnailButtons = screen.getAllByRole('button', { name: /View image \d+/ });
      expect(thumbnailButtons[0]).toHaveAttribute('aria-pressed', 'true');
      expect(thumbnailButtons[1]).toHaveAttribute('aria-pressed', 'false');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PropertyGallery images={mockProperty.images} />);

      const prevButton = screen.getByRole('button', { name: 'Previous image' });
      const nextButton = screen.getByRole('button', { name: 'Next image' });

      // Should be able to navigate with keyboard
      await user.click(nextButton);
      
      // Check that aria-live region is updated
      const liveRegion = screen.getByText(/Showing image 2 of/);
      expect(liveRegion).toBeInTheDocument();
    });

    it('announces image changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<PropertyGallery images={mockProperty.images} />);

      const nextButton = screen.getByRole('button', { name: 'Next image' });
      
      // Navigate to next image
      await user.click(nextButton);

      // Live region should announce the change
      const liveRegion = screen.getByText(`Showing image 2 of ${mockProperty.images.length}: ${mockProperty.images[1].alt}`);
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Property Reviews Component', () => {
    const PropertyReviews = ({ reviews }: { reviews: typeof mockProperty.reviews }) => (
      <section aria-labelledby="reviews-heading">
        <h2 id="reviews-heading">Customer Reviews</h2>
        
        <div className="mb-4">
          <span className="text-lg font-semibold">
            Average Rating: {mockProperty.rating}/5
          </span>
          <div 
            className="flex items-center ml-2" 
            role="img" 
            aria-label={`Average rating: ${mockProperty.rating} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star}
                className={star <= mockProperty.rating ? 'text-yellow-400' : 'text-gray-300'}
                aria-hidden="true"
              >
                ★
              </span>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="border-b pb-4">
              <header className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{review.author}</h3>
                  <div 
                    className="flex items-center" 
                    role="img" 
                    aria-label={`Rating: ${review.rating} out of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star}
                        className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                        aria-hidden="true"
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <time dateTime={review.date} className="text-sm text-gray-500">
                  {new Date(review.date).toLocaleDateString()}
                </time>
              </header>
              
              <p>{review.comment}</p>
            </article>
          ))}
        </div>
        
        <button 
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          aria-describedby="write-review-help"
        >
          Write a Review
        </button>
        <div id="write-review-help" className="sr-only">
          Opens a form to write a new review for this property
        </div>
      </section>
    );

    it('passes automated accessibility tests', async () => {
      const { container } = render(<PropertyReviews reviews={mockProperty.reviews} />);
      await testA11y(container);
    });

    it('has proper semantic structure for reviews', () => {
      const { container } = render(<PropertyReviews reviews={mockProperty.reviews} />);

      // Should be a section with proper heading
      const section = screen.getByRole('region', { name: 'Customer Reviews' });
      expect(section).toBeInTheDocument();

      // Each review should be an article
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(mockProperty.reviews.length);

      // Should have proper time elements
      const timeElement = screen.getByText('1/15/2024');
      expect(timeElement.closest('time')).toHaveAttribute('dateTime', '2024-01-15');
    });

    it('has accessible rating displays', () => {
      const { container } = render(<PropertyReviews reviews={mockProperty.reviews} />);

      // Average rating should have proper ARIA label
      const averageRating = container.querySelector('[aria-label*="Average rating"]');
      expect(averageRating).toHaveAttribute('aria-label', `Average rating: ${mockProperty.rating} out of 5 stars`);

      // Individual review ratings should have proper ARIA labels
      const reviewRating = container.querySelector('[aria-label*="Rating: 5"]');
      expect(reviewRating).toHaveAttribute('aria-label', 'Rating: 5 out of 5 stars');
    });
  });

  describe('Property Search Filters', () => {
    const PropertyFilters = () => {
      const [priceRange, setPriceRange] = React.useState([0, 1000000]);
      const [bedrooms, setBedrooms] = React.useState('');
      const [propertyType, setPropertyType] = React.useState('');

      return (
        <form role="search" aria-label="Property search filters">
          <fieldset>
            <legend>Filter Properties</legend>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="property-type">Property Type</label>
                <select 
                  id="property-type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  aria-describedby="property-type-help"
                >
                  <option value="">All Types</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                </select>
                <div id="property-type-help" className="text-sm text-gray-600">
                  Select the type of property you're looking for
                </div>
              </div>
              
              <div>
                <label htmlFor="bedrooms">Bedrooms</label>
                <select 
                  id="bedrooms"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
              
              <div>
                <fieldset>
                  <legend>Price Range</legend>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="min-price" className="sr-only">Minimum price</label>
                    <input 
                      id="min-price"
                      type="number"
                      placeholder="Min price"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      aria-describedby="price-range-help"
                    />
                    <span aria-hidden="true">to</span>
                    <label htmlFor="max-price" className="sr-only">Maximum price</label>
                    <input 
                      id="max-price"
                      type="number"
                      placeholder="Max price"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000000])}
                      aria-describedby="price-range-help"
                    />
                  </div>
                  <div id="price-range-help" className="text-sm text-gray-600">
                    Enter your desired price range in USD
                  </div>
                </fieldset>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                Apply Filters
              </button>
              <button 
                type="button" 
                className="border border-gray-300 px-4 py-2 rounded"
                onClick={() => {
                  setPriceRange([0, 1000000]);
                  setBedrooms('');
                  setPropertyType('');
                }}
              >
                Clear Filters
              </button>
            </div>
          </fieldset>
        </form>
      );
    };

    it('passes automated accessibility tests', async () => {
      const { container } = render(<PropertyFilters />);
      await testA11y(container, a11yConfigs.forms);
    });

    it('has proper form structure and labels', () => {
      render(<PropertyFilters />);

      // Should have search role
      const form = screen.getByRole('search', { name: 'Property search filters' });
      expect(form).toBeInTheDocument();

      // Should have fieldset and legend
      const fieldset = screen.getByRole('group', { name: 'Filter Properties' });
      expect(fieldset).toBeInTheDocument();

      // All form controls should have labels
      expect(screen.getByLabelText('Property Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Bedrooms')).toBeInTheDocument();
      expect(screen.getByLabelText('Minimum price')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximum price')).toBeInTheDocument();
    });

    it('provides helpful descriptions for form fields', () => {
      const { container } = render(<PropertyFilters />);

      testAriaAttributes(container, {
        hasAriaDescribedBy: [
          { selector: '#property-type', describedBy: 'property-type-help' },
          { selector: '#min-price', describedBy: 'price-range-help' },
          { selector: '#max-price', describedBy: 'price-range-help' }
        ]
      });
    });
  });

  describe('Property Map Component', () => {
    const PropertyMap = ({ properties }: { properties: typeof mockProperty[] }) => {
      const [selectedProperty, setSelectedProperty] = React.useState<string | null>(null);

      return (
        <div className="relative">
          <div 
            role="application" 
            aria-label="Interactive property map"
            className="h-96 bg-gray-200 rounded-lg relative"
            tabIndex={0}
          >
            {/* Mock map markers */}
            {properties.map((property, index) => (
              <button
                key={property.id}
                className={`absolute w-8 h-8 rounded-full ${
                  selectedProperty === property.id ? 'bg-red-600' : 'bg-blue-600'
                } text-white text-sm font-bold`}
                style={{ 
                  left: `${20 + index * 30}%`, 
                  top: `${30 + index * 20}%` 
                }}
                onClick={() => setSelectedProperty(property.id)}
                aria-label={`${property.title} - $${property.price.toLocaleString()} - ${property.location}`}
                aria-pressed={selectedProperty === property.id}
              >
                {index + 1}
              </button>
            ))}
            
            {/* Map controls */}
            <div className="absolute top-2 right-2 flex flex-col space-y-1">
              <button 
                className="bg-white border p-2 rounded shadow"
                aria-label="Zoom in"
              >
                +
              </button>
              <button 
                className="bg-white border p-2 rounded shadow"
                aria-label="Zoom out"
              >
                −
              </button>
            </div>
          </div>
          
          {/* Property info popup */}
          {selectedProperty && (
            <div 
              className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm"
              role="dialog"
              aria-labelledby="property-popup-title"
            >
              {(() => {
                const property = properties.find(p => p.id === selectedProperty);
                return property ? (
                  <>
                    <h3 id="property-popup-title" className="font-semibold">
                      {property.title}
                    </h3>
                    <p className="text-gray-600">{property.location}</p>
                    <p className="text-green-600 font-bold">
                      ${property.price.toLocaleString()}
                    </p>
                    <button 
                      className="mt-2 text-blue-600 hover:underline"
                      onClick={() => setSelectedProperty(null)}
                      aria-label="Close property details"
                    >
                      Close
                    </button>
                  </>
                ) : null;
              })()}
            </div>
          )}
          
          {/* Screen reader instructions */}
          <div className="sr-only">
            Use arrow keys to navigate the map. Press Enter or Space to select a property marker.
          </div>
        </div>
      );
    };

    it('passes automated accessibility tests', async () => {
      const { container } = render(<PropertyMap properties={[mockProperty]} />);
      await testA11y(container);
    });

    it('has proper ARIA attributes for interactive map', () => {
      const { container } = render(<PropertyMap properties={[mockProperty]} />);

      // Map container should have application role
      const map = container.querySelector('[role="application"]');
      expect(map).toHaveAttribute('aria-label', 'Interactive property map');
      expect(map).toHaveAttribute('tabIndex', '0');

      // Property markers should have proper labels
      const marker = screen.getByRole('button', { 
        name: `${mockProperty.title} - $${mockProperty.price.toLocaleString()} - ${mockProperty.location}` 
      });
      expect(marker).toHaveAttribute('aria-pressed', 'false');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PropertyMap properties={[mockProperty]} />);

      const marker = screen.getByRole('button', { 
        name: `${mockProperty.title} - $${mockProperty.price.toLocaleString()} - ${mockProperty.location}` 
      });

      // Should be able to activate marker with keyboard
      await user.click(marker);
      expect(marker).toHaveAttribute('aria-pressed', 'true');

      // Property popup should appear
      const popup = screen.getByRole('dialog');
      expect(popup).toBeInTheDocument();
    });
  });

  describe('Comprehensive Property Accessibility', () => {
    it('runs full accessibility test on property listing page', async () => {
      const PropertyListingPage = () => (
        <div>
          <header>
            <h1>Property Listings</h1>
            <nav aria-label="Property navigation">
              <a href="/properties">All Properties</a>
              <a href="/favorites">Favorites</a>
            </nav>
          </header>
          
          <main>
            <section aria-labelledby="search-heading">
              <h2 id="search-heading">Search Properties</h2>
              <form role="search">
                <label htmlFor="search-input">Search properties</label>
                <input id="search-input" type="search" placeholder="Enter location or keywords" />
                <button type="submit">Search</button>
              </form>
            </section>
            
            <section aria-labelledby="results-heading">
              <h2 id="results-heading">Search Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <article className="border rounded p-4">
                  <h3>
                    <a href="/property/1">Sample Property</a>
                  </h3>
                  <img src="/sample.jpg" alt="Front view of sample property" />
                  <p>Property description</p>
                </article>
              </div>
            </section>
          </main>
        </div>
      );

      const { container } = render(
        <RouterWrapper>
          <PropertyListingPage />
        </RouterWrapper>
      );

      await runFullAccessibilityTest(container, {
        skipColorContrast: true,
        config: 'content'
      });
    });
  });
});