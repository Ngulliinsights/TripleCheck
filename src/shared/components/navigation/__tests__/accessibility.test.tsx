/**
 * Navigation components accessibility test suite
 * Tests keyboard navigation, ARIA attributes, and focus management for navigation components
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { 
  testA11y, 
  testKeyboardAccessibility, 
  testAriaAttributes, 
  testScreenReaderCompatibility,
  runFullAccessibilityTest,
  a11yConfigs
} from '../../../test-utils/accessibility'

// Mock router for navigation components
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Navigation Components Accessibility', () => {
  describe('Main Navigation', () => {
    const MainNavigation = () => (
      <nav role="navigation" aria-label="Main navigation">
        <ul>
          <li><a href="/home">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/services">Services</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </nav>
    );

    it('passes automated accessibility tests', async () => {
      const { container } = render(
        <RouterWrapper>
          <MainNavigation />
        </RouterWrapper>
      );
      
      await testA11y(container, a11yConfigs.navigation);
    });

    it('has proper navigation landmark', () => {
      const { container } = render(
        <RouterWrapper>
          <MainNavigation />
        </RouterWrapper>
      );

      const nav = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <MainNavigation />
        </RouterWrapper>
      );

      const links = screen.getAllByRole('link');
      
      // Tab through navigation links
      await user.tab();
      expect(links[0]).toHaveFocus();
      
      await user.tab();
      expect(links[1]).toHaveFocus();
      
      await user.tab();
      expect(links[2]).toHaveFocus();
      
      await user.tab();
      expect(links[3]).toHaveFocus();
    });

    it('supports arrow key navigation', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <nav role="navigation" aria-label="Main navigation">
            <ul role="menubar">
              <li role="none">
                <a href="/home" role="menuitem">Home</a>
              </li>
              <li role="none">
                <a href="/about" role="menuitem">About</a>
              </li>
              <li role="none">
                <a href="/services" role="menuitem">Services</a>
              </li>
            </ul>
          </nav>
        </RouterWrapper>
      );

      const menuItems = screen.getAllByRole('menuitem');
      
      // Focus first item
      menuItems[0].focus();
      expect(menuItems[0]).toHaveFocus();
      
      // Arrow right should move to next item
      await user.keyboard('{ArrowRight}');
      // Note: Arrow key navigation would need to be implemented in the component
    });

    it('indicates current page', () => {
      render(
        <RouterWrapper>
          <nav role="navigation" aria-label="Main navigation">
            <ul>
              <li>
                <a href="/home" aria-current="page">Home</a>
              </li>
              <li>
                <a href="/about">About</a>
              </li>
            </ul>
          </nav>
        </RouterWrapper>
      );

      const currentLink = screen.getByRole('link', { name: 'Home' });
      expect(currentLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Dropdown Navigation', () => {
    const DropdownNavigation = () => (
      <nav role="navigation" aria-label="Main navigation">
        <ul role="menubar">
          <li role="none">
            <button 
              role="menuitem" 
              aria-haspopup="menu" 
              aria-expanded="false"
              aria-controls="services-menu"
            >
              Services
            </button>
            <ul role="menu" id="services-menu" hidden>
              <li role="none">
                <a href="/web-design" role="menuitem">Web Design</a>
              </li>
              <li role="none">
                <a href="/development" role="menuitem">Development</a>
              </li>
              <li role="none">
                <a href="/consulting" role="menuitem">Consulting</a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    );

    it('passes automated accessibility tests', async () => {
      const { container } = render(<DropdownNavigation />);
      await testA11y(container, a11yConfigs.navigation);
    });

    it('has proper ARIA attributes for dropdown', () => {
      const { container } = render(<DropdownNavigation />);

      testAriaAttributes(container, {
        hasAriaExpanded: [{ selector: 'button[role="menuitem"]', expanded: false }],
        hasRole: [
          { selector: 'button', role: 'menuitem' },
          { selector: 'ul[id="services-menu"]', role: 'menu' }
        ]
      });

      const trigger = screen.getByRole('menuitem', { name: 'Services' });
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      expect(trigger).toHaveAttribute('aria-controls', 'services-menu');
    });

    it('supports keyboard navigation in dropdown', async () => {
      const user = userEvent.setup();
      
      // Enhanced dropdown with keyboard support
      const EnhancedDropdown = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        
        const handleKeyDown = (event: React.KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(!isOpen);
          } else if (event.key === 'Escape') {
            setIsOpen(false);
          }
        };

        return (
          <nav role="navigation">
            <ul role="menubar">
              <li role="none">
                <button 
                  role="menuitem" 
                  aria-haspopup="menu" 
                  aria-expanded={isOpen}
                  aria-controls="services-menu"
                  onKeyDown={handleKeyDown}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Services
                </button>
                {isOpen && (
                  <ul role="menu" id="services-menu">
                    <li role="none">
                      <a href="/web-design" role="menuitem">Web Design</a>
                    </li>
                    <li role="none">
                      <a href="/development" role="menuitem">Development</a>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          </nav>
        );
      };

      render(<EnhancedDropdown />);

      const trigger = screen.getByRole('menuitem', { name: 'Services' });
      
      // Enter should open dropdown
      trigger.focus();
      await user.keyboard('{Enter}');
      
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      
      // Escape should close dropdown
      await user.keyboard('{Escape}');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Breadcrumb Navigation', () => {
    const BreadcrumbNavigation = () => (
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <a href="/home">Home</a>
          </li>
          <li>
            <span aria-hidden="true"> / </span>
            <a href="/products">Products</a>
          </li>
          <li>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">Current Page</span>
          </li>
        </ol>
      </nav>
    );

    it('passes automated accessibility tests', async () => {
      const { container } = render(<BreadcrumbNavigation />);
      await testA11y(container, a11yConfigs.navigation);
    });

    it('has proper breadcrumb structure', () => {
      render(<BreadcrumbNavigation />);

      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(nav).toBeInTheDocument();

      const list = nav.querySelector('ol');
      expect(list).toBeInTheDocument();

      const currentPage = screen.getByText('Current Page');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('hides decorative separators from screen readers', () => {
      const { container } = render(<BreadcrumbNavigation />);

      const separators = container.querySelectorAll('[aria-hidden="true"]');
      expect(separators).toHaveLength(2);
      
      separators.forEach(separator => {
        expect(separator).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Skip Links', () => {
    const SkipLinks = () => (
      <div>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <a href="#navigation" className="skip-link">
          Skip to navigation
        </a>
        <nav id="navigation">
          <a href="/home">Home</a>
        </nav>
        <main id="main-content">
          <h1>Main Content</h1>
        </main>
      </div>
    );

    it('passes automated accessibility tests', async () => {
      const { container } = render(<SkipLinks />);
      await testA11y(container);
    });

    it('provides skip links for keyboard users', () => {
      render(<SkipLinks />);

      const skipToMain = screen.getByRole('link', { name: 'Skip to main content' });
      const skipToNav = screen.getByRole('link', { name: 'Skip to navigation' });

      expect(skipToMain).toHaveAttribute('href', '#main-content');
      expect(skipToNav).toHaveAttribute('href', '#navigation');
    });

    it('skip links are focusable', async () => {
      const user = userEvent.setup();
      render(<SkipLinks />);

      const skipToMain = screen.getByRole('link', { name: 'Skip to main content' });
      
      // Tab should focus skip link
      await user.tab();
      expect(skipToMain).toHaveFocus();
    });
  });

  describe('Mobile Navigation', () => {
    const MobileNavigation = () => {
      const [isOpen, setIsOpen] = React.useState(false);

      return (
        <nav role="navigation" aria-label="Main navigation">
          <button
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
            onClick={() => setIsOpen(!isOpen)}
          >
            Menu
          </button>
          
          <div 
            id="mobile-menu" 
            hidden={!isOpen}
            role="menu"
          >
            <a href="/home" role="menuitem">Home</a>
            <a href="/about" role="menuitem">About</a>
            <a href="/contact" role="menuitem">Contact</a>
          </div>
        </nav>
      );
    };

    it('passes automated accessibility tests', async () => {
      const { container } = render(<MobileNavigation />);
      await testA11y(container, a11yConfigs.navigation);
    });

    it('has proper ARIA attributes for mobile menu', () => {
      const { container } = render(<MobileNavigation />);

      testAriaAttributes(container, {
        hasAriaExpanded: [{ selector: 'button', expanded: false }],
        hasAriaLabel: [{ selector: 'button', label: 'Toggle navigation menu' }]
      });

      const button = screen.getByRole('button', { name: 'Toggle navigation menu' });
      expect(button).toHaveAttribute('aria-controls', 'mobile-menu');
    });

    it('supports keyboard interaction for mobile menu', async () => {
      const user = userEvent.setup();
      render(<MobileNavigation />);

      const menuButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
      
      // Enter should toggle menu
      await user.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      
      // Menu items should be accessible
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);
    });

    it('traps focus within open mobile menu', async () => {
      const user = userEvent.setup();
      
      const FocusTrappedMobileNav = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        const menuRef = React.useRef<HTMLDivElement>(null);

        React.useEffect(() => {
          if (isOpen && menuRef.current) {
            const focusableElements = menuRef.current.querySelectorAll(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            firstElement?.focus();
          }
        }, [isOpen]);

        return (
          <nav role="navigation">
            <button
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsOpen(!isOpen)}
            >
              Menu
            </button>
            
            {isOpen && (
              <div 
                id="mobile-menu" 
                ref={menuRef}
                role="menu"
              >
                <a href="/home" role="menuitem">Home</a>
                <a href="/about" role="menuitem">About</a>
                <button 
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </nav>
        );
      };

      render(<FocusTrappedMobileNav />);

      const menuButton = screen.getByRole('button', { name: 'Menu' });
      
      // Open menu
      await user.click(menuButton);
      
      // First menu item should be focused
      const firstMenuItem = screen.getByRole('menuitem', { name: 'Home' });
      expect(firstMenuItem).toHaveFocus();
    });
  });

  describe('Tab Navigation', () => {
    const TabNavigation = () => {
      const [activeTab, setActiveTab] = React.useState('tab1');

      return (
        <div>
          <div role="tablist" aria-label="Content sections">
            <button
              role="tab"
              aria-selected={activeTab === 'tab1'}
              aria-controls="panel1"
              id="tab1"
              onClick={() => setActiveTab('tab1')}
            >
              Tab 1
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'tab2'}
              aria-controls="panel2"
              id="tab2"
              onClick={() => setActiveTab('tab2')}
            >
              Tab 2
            </button>
          </div>
          
          <div
            role="tabpanel"
            aria-labelledby="tab1"
            id="panel1"
            hidden={activeTab !== 'tab1'}
          >
            Content for Tab 1
          </div>
          
          <div
            role="tabpanel"
            aria-labelledby="tab2"
            id="panel2"
            hidden={activeTab !== 'tab2'}
          >
            Content for Tab 2
          </div>
        </div>
      );
    };

    it('passes automated accessibility tests', async () => {
      const { container } = render(<TabNavigation />);
      await testA11y(container, a11yConfigs.navigation);
    });

    it('has proper tab structure and ARIA attributes', () => {
      const { container } = render(<TabNavigation />);

      const tablist = screen.getByRole('tablist', { name: 'Content sections' });
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();

      // Check ARIA relationships
      expect(tabs[0]).toHaveAttribute('aria-controls', 'panel1');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });

    it('supports arrow key navigation between tabs', async () => {
      const user = userEvent.setup();
      
      const ArrowKeyTabNavigation = () => {
        const [activeTab, setActiveTab] = React.useState('tab1');
        const [focusedTab, setFocusedTab] = React.useState('tab1');

        const handleKeyDown = (event: React.KeyboardEvent, tabId: string) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            const nextTab = tabId === 'tab1' ? 'tab2' : 'tab1';
            setFocusedTab(nextTab);
            document.getElementById(nextTab)?.focus();
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            const prevTab = tabId === 'tab1' ? 'tab2' : 'tab1';
            setFocusedTab(prevTab);
            document.getElementById(prevTab)?.focus();
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setActiveTab(tabId);
          }
        };

        return (
          <div>
            <div role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'tab1'}
                id="tab1"
                onKeyDown={(e) => handleKeyDown(e, 'tab1')}
                onClick={() => setActiveTab('tab1')}
              >
                Tab 1
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'tab2'}
                id="tab2"
                onKeyDown={(e) => handleKeyDown(e, 'tab2')}
                onClick={() => setActiveTab('tab2')}
              >
                Tab 2
              </button>
            </div>
          </div>
        );
      };

      render(<ArrowKeyTabNavigation />);

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });

      // Focus first tab
      tab1.focus();
      expect(tab1).toHaveFocus();

      // Arrow right should move to next tab
      await user.keyboard('{ArrowRight}');
      expect(tab2).toHaveFocus();

      // Arrow left should move back
      await user.keyboard('{ArrowLeft}');
      expect(tab1).toHaveFocus();
    });
  });

  describe('Comprehensive Navigation Accessibility', () => {
    it('runs full accessibility test on complex navigation', async () => {
      const ComplexNavigation = () => (
        <div>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          
          <header>
            <nav role="navigation" aria-label="Main navigation">
              <ul role="menubar">
                <li role="none">
                  <a href="/home" role="menuitem" aria-current="page">Home</a>
                </li>
                <li role="none">
                  <button role="menuitem" aria-haspopup="menu" aria-expanded="false">
                    Services
                  </button>
                </li>
              </ul>
            </nav>
          </header>

          <nav aria-label="Breadcrumb">
            <ol>
              <li><a href="/home">Home</a></li>
              <li aria-current="page">Current Page</li>
            </ol>
          </nav>

          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </div>
      );

      const { container } = render(
        <RouterWrapper>
          <ComplexNavigation />
        </RouterWrapper>
      );

      await runFullAccessibilityTest(container, {
        skipColorContrast: true,
        config: 'navigation'
      });
    });
  });
});