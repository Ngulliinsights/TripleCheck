/**
 * Layout components accessibility test suite
 * Tests semantic structure, landmarks, and responsive accessibility
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  testA11y, 
  testScreenReaderCompatibility,
  runFullAccessibilityTest,
  a11yConfigs
} from '../../../test-utils/accessibility'

describe('Layout Components Accessibility', () => {
  describe('Page Layout Structure', () => {
    const PageLayout = ({ children }: { children: React.ReactNode }) => (
      <div className="min-h-screen flex flex-col">
        <header role="banner">
          <h1>Site Title</h1>
          <nav role="navigation" aria-label="Main navigation">
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </nav>
        </header>
        
        <main role="main" id="main-content">
          {children}
        </main>
        
        <aside role="complementary" aria-label="Sidebar">
          <h2>Related Links</h2>
          <ul>
            <li><a href="/link1">Link 1</a></li>
            <li><a href="/link2">Link 2</a></li>
          </ul>
        </aside>
        
        <footer role="contentinfo">
          <p>&copy; 2024 Company Name</p>
        </footer>
      </div>
    );

    it('passes automated accessibility tests', async () => {
      const { container } = render(
        <PageLayout>
          <h1>Page Title</h1>
          <p>Page content goes here.</p>
        </PageLayout>
      );
      
      await testA11y(container, a11yConfigs.content);
    });

    it('has proper landmark structure', () => {
      render(
        <PageLayout>
          <h1>Page Title</h1>
          <p>Content</p>
        </PageLayout>
      );

      // Check all required landmarks
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
      expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      const { container } = render(
        <PageLayout>
          <h1>Main Page Title</h1>
          <section>
            <h2>Section Title</h2>
            <h3>Subsection Title</h3>
          </section>
        </PageLayout>
      );

      testScreenReaderCompatibility(container, {
        expectHeadings: true,
        expectLandmarks: true,
        expectAltText: false
      });

      // Check heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1, name: 'Site Title' });
      const mainH1 = screen.getByRole('heading', { level: 1, name: 'Main Page Title' });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(mainH1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
      expect(h3).toBeInTheDocument();
    });

    it('provides skip links for keyboard navigation', () => {
      const LayoutWithSkipLinks = () => (
        <div>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <a href="#navigation" className="skip-link">
            Skip to navigation
          </a>
          
          <header>
            <nav id="navigation" role="navigation">
              <a href="/home">Home</a>
            </nav>
          </header>
          
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </div>
      );

      render(<LayoutWithSkipLinks />);

      const skipToMain = screen.getByRole('link', { name: 'Skip to main content' });
      const skipToNav = screen.getByRole('link', { name: 'Skip to navigation' });

      expect(skipToMain).toHaveAttribute('href', '#main-content');
      expect(skipToNav).toHaveAttribute('href', '#navigation');
    });
  });

  describe('Responsive Layout', () => {
    const ResponsiveLayout = () => {
      const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

      return (
        <div>
          <header>
            <h1>Site Title</h1>
            
            {/* Mobile menu button */}
            <button
              className="md:hidden"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label="Toggle navigation menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              Menu
            </button>
            
            {/* Desktop navigation */}
            <nav className="hidden md:block" role="navigation" aria-label="Main navigation">
              <ul>
                <li><a href="/home">Home</a></li>
                <li><a href="/about">About</a></li>
              </ul>
            </nav>
            
            {/* Mobile navigation */}
            <nav
              id="mobile-navigation"
              className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}
              role="navigation"
              aria-label="Mobile navigation"
            >
              <ul>
                <li><a href="/home">Home</a></li>
                <li><a href="/about">About</a></li>
              </ul>
            </nav>
          </header>
          
          <main>
            <h1>Page Content</h1>
          </main>
        </div>
      );
    };

    it('passes automated accessibility tests', async () => {
      const { container } = render(<ResponsiveLayout />);
      await testA11y(container);
    });

    it('has proper ARIA attributes for mobile menu', () => {
      render(<ResponsiveLayout />);

      const menuButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-navigation');
      expect(menuButton).toHaveAttribute('aria-label', 'Toggle navigation menu');
    });

    it('manages focus properly when mobile menu opens', async () => {
      const user = userEvent.setup();
      render(<ResponsiveLayout />);

      const menuButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
      
      // Open mobile menu
      await user.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      
      // Mobile navigation should be visible
      const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });
      expect(mobileNav).not.toHaveClass('hidden');
    });
  });

  describe('Grid and Flexbox Layouts', () => {
    const GridLayout = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="col-span-1 md:col-span-2">
          <h2>Main Article</h2>
          <p>Article content goes here.</p>
        </article>
        
        <aside className="col-span-1" role="complementary" aria-label="Related content">
          <h3>Related Articles</h3>
          <ul>
            <li><a href="/article1">Article 1</a></li>
            <li><a href="/article2">Article 2</a></li>
          </ul>
        </aside>
      </div>
    );

    it('passes automated accessibility tests', async () => {
      const { container } = render(<GridLayout />);
      await testA11y(container);
    });

    it('maintains semantic structure in grid layout', () => {
      render(<GridLayout />);

      const article = screen.getByRole('article');
      const aside = screen.getByRole('complementary', { name: 'Related content' });

      expect(article).toBeInTheDocument();
      expect(aside).toBeInTheDocument();

      // Check heading structure
      const h2 = screen.getByRole('heading', { level: 2, name: 'Main Article' });
      const h3 = screen.getByRole('heading', { level: 3, name: 'Related Articles' });

      expect(h2).toBeInTheDocument();
      expect(h3).toBeInTheDocument();
    });

    const FlexLayout = () => (
      <div className="flex flex-col md:flex-row gap-4">
        <main className="flex-1">
          <h1>Main Content</h1>
          <p>Main content area.</p>
        </main>
        
        <aside className="w-full md:w-64" role="complementary" aria-label="Sidebar">
          <h2>Sidebar</h2>
          <nav aria-label="Secondary navigation">
            <ul>
              <li><a href="/link1">Link 1</a></li>
              <li><a href="/link2">Link 2</a></li>
            </ul>
          </nav>
        </aside>
      </div>
    );

    it('maintains accessibility in flex layouts', async () => {
      const { container } = render(<FlexLayout />);
      await testA11y(container);

      const main = screen.getByRole('main');
      const aside = screen.getByRole('complementary', { name: 'Sidebar' });
      const secondaryNav = screen.getByRole('navigation', { name: 'Secondary navigation' });

      expect(main).toBeInTheDocument();
      expect(aside).toBeInTheDocument();
      expect(secondaryNav).toBeInTheDocument();
    });
  });

  describe('Card Layouts', () => {
    const CardLayout = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((num) => (
          <article key={num} className="border rounded-lg p-4">
            <h3>Card Title {num}</h3>
            <p>Card description goes here.</p>
            <img 
              src={`/image${num}.jpg`} 
              alt={`Descriptive alt text for image ${num}`}
              className="w-full h-48 object-cover rounded"
            />
            <a href={`/card${num}`} aria-label={`Read more about Card Title ${num}`}>
              Read More
            </a>
          </article>
        ))}
      </div>
    );

    it('passes automated accessibility tests', async () => {
      const { container } = render(<CardLayout />);
      await testA11y(container);
    });

    it('has proper semantic structure for cards', () => {
      const { container } = render(<CardLayout />);

      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(3);

      // Check images have alt text
      testScreenReaderCompatibility(container, {
        expectHeadings: true,
        expectLandmarks: false,
        expectAltText: true
      });

      // Check links have descriptive labels
      const readMoreLinks = screen.getAllByRole('link', { name: /Read more about Card Title/ });
      expect(readMoreLinks).toHaveLength(3);
    });
  });

  describe('Modal and Overlay Layouts', () => {
    const ModalLayout = () => {
      const [isOpen, setIsOpen] = React.useState(false);

      return (
        <div>
          <button onClick={() => setIsOpen(true)}>
            Open Modal
          </button>
          
          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
              
              {/* Modal */}
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
                className="fixed inset-0 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h2 id="modal-title">Modal Title</h2>
                  <p id="modal-description">Modal content goes here.</p>
                  
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setIsOpen(false)}>
                      Cancel
                    </button>
                    <button onClick={() => setIsOpen(false)}>
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      );
    };

    it('passes automated accessibility tests when modal is open', async () => {
      const user = userEvent.setup();
      const { container } = render(<ModalLayout />);

      // Open modal
      const openButton = screen.getByRole('button', { name: 'Open Modal' });
      await user.click(openButton);

      await testA11y(container);
    });

    it('has proper modal ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<ModalLayout />);

      // Open modal
      const openButton = screen.getByRole('button', { name: 'Open Modal' });
      await user.click(openButton);

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(modal).toHaveAttribute('aria-describedby', 'modal-description');

      const title = screen.getByText('Modal Title');
      const description = screen.getByText('Modal content goes here.');
      
      expect(title).toHaveAttribute('id', 'modal-title');
      expect(description).toHaveAttribute('id', 'modal-description');
    });

    it('traps focus within modal', async () => {
      const user = userEvent.setup();
      
      const FocusTrappedModal = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        const modalRef = React.useRef<HTMLDivElement>(null);

        React.useEffect(() => {
          if (isOpen && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            const handleKeyDown = (e: KeyboardEvent) => {
              if (e.key === 'Tab') {
                if (e.shiftKey) {
                  if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                  }
                } else {
                  if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                  }
                }
              } else if (e.key === 'Escape') {
                setIsOpen(false);
              }
            };

            document.addEventListener('keydown', handleKeyDown);
            firstElement?.focus();

            return () => {
              document.removeEventListener('keydown', handleKeyDown);
            };
          }
        }, [isOpen]);

        return (
          <div>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>
            
            {isOpen && (
              <div
                role="dialog"
                aria-modal="true"
                ref={modalRef}
                className="fixed inset-0 flex items-center justify-center"
              >
                <div className="bg-white p-6">
                  <h2>Modal Title</h2>
                  <button>First Button</button>
                  <button onClick={() => setIsOpen(false)}>Close</button>
                </div>
              </div>
            )}
          </div>
        );
      };

      render(<FocusTrappedModal />);

      const openButton = screen.getByRole('button', { name: 'Open Modal' });
      await user.click(openButton);

      // First focusable element should be focused
      const firstButton = screen.getByRole('button', { name: 'First Button' });
      expect(firstButton).toHaveFocus();

      // Tab should move to next element
      await user.tab();
      const closeButton = screen.getByRole('button', { name: 'Close' });
      expect(closeButton).toHaveFocus();

      // Tab again should wrap to first element
      await user.tab();
      expect(firstButton).toHaveFocus();
    });
  });

  describe('Form Layouts', () => {
    const FormLayout = () => (
      <form>
        <fieldset>
          <legend>Personal Information</legend>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName">First Name *</label>
              <input 
                id="firstName" 
                type="text" 
                required 
                aria-required="true"
              />
            </div>
            
            <div>
              <label htmlFor="lastName">Last Name *</label>
              <input 
                id="lastName" 
                type="text" 
                required 
                aria-required="true"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email">Email Address *</label>
            <input 
              id="email" 
              type="email" 
              required 
              aria-required="true"
              aria-describedby="email-help"
            />
            <div id="email-help" className="text-sm text-gray-600">
              We'll never share your email with anyone else.
            </div>
          </div>
        </fieldset>
        
        <fieldset>
          <legend>Preferences</legend>
          
          <div role="group" aria-labelledby="notification-legend">
            <div id="notification-legend" className="font-medium">
              Email Notifications
            </div>
            
            <div>
              <input type="checkbox" id="newsletter" />
              <label htmlFor="newsletter">Newsletter</label>
            </div>
            
            <div>
              <input type="checkbox" id="updates" />
              <label htmlFor="updates">Product Updates</label>
            </div>
          </div>
        </fieldset>
        
        <button type="submit">Submit Form</button>
      </form>
    );

    it('passes automated accessibility tests', async () => {
      const { container } = render(<FormLayout />);
      await testA11y(container, a11yConfigs.forms);
    });

    it('has proper form structure and labels', () => {
      render(<FormLayout />);

      // Check fieldsets and legends
      const fieldsets = screen.getAllByRole('group');
      expect(fieldsets.length).toBeGreaterThanOrEqual(2);

      // Check form controls have labels
      const firstNameInput = screen.getByLabelText('First Name *');
      const lastNameInput = screen.getByLabelText('Last Name *');
      const emailInput = screen.getByLabelText('Email Address *');

      expect(firstNameInput).toBeRequired();
      expect(lastNameInput).toBeRequired();
      expect(emailInput).toBeRequired();

      // Check email has help text association
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-help');
      expect(screen.getByText("We'll never share your email with anyone else.")).toHaveAttribute('id', 'email-help');
    });
  });

  describe('Comprehensive Layout Accessibility', () => {
    it('runs full accessibility test on complex layout', async () => {
      const ComplexLayout = () => (
        <div className="min-h-screen flex flex-col">
          <a href="#main-content" className="skip-link">Skip to main content</a>
          
          <header role="banner" className="bg-blue-600 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-2xl font-bold">Site Title</h1>
              
              <nav role="navigation" aria-label="Main navigation">
                <ul className="flex space-x-4">
                  <li><a href="/home" className="hover:underline">Home</a></li>
                  <li><a href="/about" className="hover:underline">About</a></li>
                  <li><a href="/contact" className="hover:underline">Contact</a></li>
                </ul>
              </nav>
            </div>
          </header>
          
          <nav aria-label="Breadcrumb" className="bg-gray-100 p-2">
            <ol className="container mx-auto flex space-x-2">
              <li><a href="/home">Home</a></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Current Page</li>
            </ol>
          </nav>
          
          <div className="flex-1 container mx-auto flex flex-col lg:flex-row gap-6 p-4">
            <main role="main" id="main-content" className="flex-1">
              <h1 className="text-3xl font-bold mb-4">Page Title</h1>
              
              <section>
                <h2 className="text-2xl font-semibold mb-3">Section Title</h2>
                <p>Main content goes here.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <article className="border rounded p-4">
                    <h3 className="font-semibold mb-2">Article 1</h3>
                    <p>Article content.</p>
                  </article>
                  
                  <article className="border rounded p-4">
                    <h3 className="font-semibold mb-2">Article 2</h3>
                    <p>Article content.</p>
                  </article>
                </div>
              </section>
            </main>
            
            <aside role="complementary" aria-label="Sidebar" className="w-full lg:w-64">
              <h2 className="text-xl font-semibold mb-3">Related Links</h2>
              <nav aria-label="Related navigation">
                <ul className="space-y-2">
                  <li><a href="/related1" className="text-blue-600 hover:underline">Related Link 1</a></li>
                  <li><a href="/related2" className="text-blue-600 hover:underline">Related Link 2</a></li>
                </ul>
              </nav>
            </aside>
          </div>
          
          <footer role="contentinfo" className="bg-gray-800 text-white p-4 mt-8">
            <div className="container mx-auto text-center">
              <p>&copy; 2024 Company Name. All rights reserved.</p>
            </div>
          </footer>
        </div>
      );

      const { container } = render(<ComplexLayout />);

      await runFullAccessibilityTest(container, {
        skipColorContrast: true,
        config: 'content'
      });
    });
  });
});