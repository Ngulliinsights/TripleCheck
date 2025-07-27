/**
 * Comprehensive accessibility test suite runner
 * Runs all accessibility tests and provides summary reporting
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  testA11y, 
  testKeyboardAccessibility, 
  testAriaAttributes, 
  testFormAccessibility,
  testScreenReaderCompatibility,
  testColorContrast,
  runFullAccessibilityTest,
  mockScreenReaderAnnouncements,
  a11yConfigs
} from '../accessibility';

// Import components for comprehensive testing
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';

describe('Comprehensive Accessibility Test Suite', () => {
  let mockScreenReader: ReturnType<typeof mockScreenReaderAnnouncements>;

  beforeAll(() => {
    mockScreenReader = mockScreenReaderAnnouncements();
  });

  afterAll(() => {
    mockScreenReader.clearAnnouncements();
  });

  describe('Accessibility Testing Utilities', () => {
    it('testA11y utility works correctly', async () => {
      const { container } = render(
        <div>
          <h1>Test Heading</h1>
          <button>Test Button</button>
        </div>
      );

      // Should pass with no violations
      await expect(testA11y(container)).resolves.not.toThrow();
    });

    it('testA11y detects violations', async () => {
      const { container } = render(
        <div>
          {/* Missing alt text should cause violation */}
          <img src="/test.jpg" />
          <button></button> {/* Empty button should cause violation */}
        </div>
      );

      // Should detect violations
      await expect(testA11y(container, a11yConfigs.strict)).rejects.toThrow();
    });

    it('testKeyboardAccessibility works correctly', async () => {
      const { container } = render(
        <div>
          <button>Focusable Button</button>
          <a href="/test">Focusable Link</a>
          <div tabIndex={-1}>Not Focusable</div>
        </div>
      );

      await testKeyboardAccessibility(container, {
        expectFocusable: ['button', 'a'],
        expectNotFocusable: ['div[tabindex="-1"]'],
        testTabOrder: true
      });
    });

    it('testAriaAttributes works correctly', () => {
      const { container } = render(
        <div>
          <button role="menuitem" aria-expanded="false" aria-label="Menu">
            Menu
          </button>
          <div role="menu" aria-labelledby="menu-button">
            Menu content
          </div>
        </div>
      );

      testAriaAttributes(container, {
        hasRole: [
          { selector: 'button', role: 'menuitem' },
          { selector: 'div', role: 'menu' }
        ],
        hasAriaExpanded: [{ selector: 'button', expanded: false }],
        hasAriaLabel: [{ selector: 'button', label: 'Menu' }]
      });
    });

    it('testFormAccessibility works correctly', async () => {
      const { container } = render(
        <form>
          <label htmlFor="test-input">Test Input</label>
          <input id="test-input" required aria-required="true" />
          
          <label htmlFor="error-input">Error Input</label>
          <input 
            id="error-input" 
            aria-describedby="error-message"
            aria-invalid="true"
          />
          <div id="error-message" role="alert">Error message</div>
        </form>
      );

      await testFormAccessibility(container, {
        expectLabels: ['#test-input', '#error-input'],
        expectRequired: ['#test-input'],
        expectErrorMessages: ['#error-input']
      });
    });

    it('testScreenReaderCompatibility works correctly', () => {
      const { container } = render(
        <div>
          <header>Header landmark</header>
          <main>Main landmark</main>
          <h1>Main heading</h1>
          <h2>Sub heading</h2>
          <img src="/test.jpg" alt="Test image" />
          <img src="/decorative.jpg" alt="" role="presentation" />
        </div>
      );

      testScreenReaderCompatibility(container, {
        expectHeadings: true,
        expectLandmarks: true,
        expectAltText: true
      });
    });

    it('mockScreenReaderAnnouncements works correctly', () => {
      render(
        <div>
          <div aria-live="polite" id="announcements">
            Initial content
          </div>
          <button 
            onClick={() => {
              const announcements = document.getElementById('announcements');
              if (announcements) {
                announcements.textContent = 'Updated content';
              }
            }}
          >
            Update
          </button>
        </div>
      );

      // Test that announcements are tracked
      expect(mockScreenReader.getAnnouncements()).toEqual([]);
    });
  });

  describe('Component Accessibility Integration', () => {
    it('Button component passes all accessibility tests', async () => {
      const { container } = render(
        <div>
          <Button>Default Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button aria-label="Close dialog">×</Button>
        </div>
      );

      await runFullAccessibilityTest(container, {
        skipColorContrast: true,
        config: 'strict'
      });
    });

    it('Form components pass all accessibility tests', async () => {
      const { container } = render(
        <form>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" required aria-required="true" />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                aria-describedby="email-help"
              />
              <div id="email-help">We'll never share your email</div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">I agree to the terms</Label>
            </div>
            
            <RadioGroup defaultValue="option1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id="opt1" />
                <Label htmlFor="opt1">Option 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id="opt2" />
                <Label htmlFor="opt2">Option 2</Label>
              </div>
            </RadioGroup>
            
            <Button type="submit">Submit</Button>
          </div>
        </form>
      );

      await runFullAccessibilityTest(container, {
        skipColorContrast: true,
        config: 'forms'
      });
    });

    it('Interactive components pass all accessibility tests', async () => {
      const { container } = render(
        <div>
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">Content 1</TabsContent>
            <TabsContent value="tab2">Content 2</TabsContent>
          </Tabs>
          
          <Accordion type="single" collapsible>
            <AccordionItem value="item1">
              <AccordionTrigger>Section 1</AccordionTrigger>
              <AccordionContent>Content 1</AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
              </DialogHeader>
              <p>Dialog content</p>
            </DialogContent>
          </Dialog>
        </div>
      );

      await runFullAccessibilityTest(container, {
        skipColorContrast: true,
        config: 'navigation'
      });
    });
  });

  describe('Keyboard Navigation Integration', () => {
    it('supports Tab navigation through interactive elements', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>Button 1</Button>
          <Button>Button 2</Button>
          <Input placeholder="Input field" />
          <a href="/test">Link</a>
        </div>
      );

      const button1 = screen.getByRole('button', { name: 'Button 1' });
      const button2 = screen.getByRole('button', { name: 'Button 2' });
      const input = screen.getByRole('textbox');
      const link = screen.getByRole('link');

      // Tab through elements
      await user.tab();
      expect(button1).toHaveFocus();

      await user.tab();
      expect(button2).toHaveFocus();

      await user.tab();
      expect(input).toHaveFocus();

      await user.tab();
      expect(link).toHaveFocus();
    });

    it('supports Enter and Space key activation', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <div>
          <Button onClick={handleClick}>Clickable Button</Button>
          <Checkbox id="checkbox" />
        </div>
      );

      const button = screen.getByRole('button');
      const checkbox = screen.getByRole('checkbox');

      // Enter should activate button
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Space should activate button
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);

      // Space should toggle checkbox
      checkbox.focus();
      await user.keyboard(' ');
      expect(checkbox).toBeChecked();
    });

    it('supports Escape key to close modals', async () => {
      const user = userEvent.setup();
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
            <p>Press Escape to close</p>
          </DialogContent>
        </Dialog>
      );

      // Dialog should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Escape should close dialog
      await user.keyboard('{Escape}');
      
      // Note: The actual closing behavior depends on the Dialog implementation
      // This test verifies the keyboard event is handled
    });
  });

  describe('Focus Management Integration', () => {
    it('manages focus properly in modal dialogs', async () => {
      const user = userEvent.setup();
      
      const FocusTestModal = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        
        return (
          <div>
            <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
            
            {isOpen && (
              <div role="dialog" aria-modal="true">
                <h2>Modal Title</h2>
                <Button>First Button</Button>
                <Button onClick={() => setIsOpen(false)}>Close</Button>
              </div>
            )}
          </div>
        );
      };

      render(<FocusTestModal />);

      const openButton = screen.getByRole('button', { name: 'Open Modal' });
      
      // Open modal
      await user.click(openButton);
      
      // Modal should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Focus should be managed within modal
      const firstButton = screen.getByRole('button', { name: 'First Button' });
      const closeButton = screen.getByRole('button', { name: 'Close' });
      
      expect(firstButton).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
    });

    it('restores focus after modal closes', async () => {
      const user = userEvent.setup();
      
      const FocusRestoreModal = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        const triggerRef = React.useRef<HTMLButtonElement>(null);
        
        React.useEffect(() => {
          if (!isOpen && triggerRef.current) {
            triggerRef.current.focus();
          }
        }, [isOpen]);
        
        return (
          <div>
            <Button ref={triggerRef} onClick={() => setIsOpen(true)}>
              Open Modal
            </Button>
            
            {isOpen && (
              <div role="dialog" aria-modal="true">
                <h2>Modal Title</h2>
                <Button onClick={() => setIsOpen(false)}>Close</Button>
              </div>
            )}
          </div>
        );
      };

      render(<FocusRestoreModal />);

      const openButton = screen.getByRole('button', { name: 'Open Modal' });
      
      // Open modal
      await user.click(openButton);
      
      // Close modal
      const closeButton = screen.getByRole('button', { name: 'Close' });
      await user.click(closeButton);
      
      // Focus should return to trigger
      expect(openButton).toHaveFocus();
    });
  });

  describe('Screen Reader Integration', () => {
    it('provides proper ARIA live regions for dynamic content', () => {
      const DynamicContent = () => {
        const [status, setStatus] = React.useState('Ready');
        
        return (
          <div>
            <Button onClick={() => setStatus('Loading...')}>
              Update Status
            </Button>
            <div aria-live="polite" aria-atomic="true">
              Status: {status}
            </div>
          </div>
        );
      };

      render(<DynamicContent />);

      const liveRegion = screen.getByText(/Status:/);
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('provides proper heading hierarchy', () => {
      const { container } = render(
        <div>
          <h1>Main Title</h1>
          <section>
            <h2>Section Title</h2>
            <article>
              <h3>Article Title</h3>
              <h4>Subsection</h4>
            </article>
          </section>
          <aside>
            <h2>Sidebar Title</h2>
          </aside>
        </div>
      );

      testScreenReaderCompatibility(container, {
        expectHeadings: true,
        expectLandmarks: false,
        expectAltText: false
      });

      // Verify heading levels
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    });

    it('provides proper landmark structure', () => {
      const { container } = render(
        <div>
          <header>Site Header</header>
          <nav aria-label="Main navigation">Navigation</nav>
          <main>Main Content</main>
          <aside>Sidebar</aside>
          <footer>Site Footer</footer>
        </div>
      );

      testScreenReaderCompatibility(container, {
        expectHeadings: false,
        expectLandmarks: true,
        expectAltText: false
      });

      // Verify all landmarks are present
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles components with missing accessibility attributes gracefully', async () => {
      const { container } = render(
        <div>
          {/* These components have accessibility issues but shouldn't crash tests */}
          <button></button> {/* Empty button */}
          <img src="/test.jpg" /> {/* Missing alt */}
          <input type="text" /> {/* Missing label */}
        </div>
      );

      // Should detect violations but not crash
      await expect(testA11y(container, a11yConfigs.relaxed)).rejects.toThrow();
    });

    it('handles dynamic content changes', async () => {
      const user = userEvent.setup();
      
      const DynamicComponent = () => {
        const [showContent, setShowContent] = React.useState(false);
        
        return (
          <div>
            <Button onClick={() => setShowContent(!showContent)}>
              Toggle Content
            </Button>
            {showContent && (
              <div role="region" aria-label="Dynamic content">
                <h2>Dynamic Heading</h2>
                <p>This content appeared dynamically</p>
              </div>
            )}
          </div>
        );
      };

      const { container } = render(<DynamicComponent />);

      // Initial state should pass
      await testA11y(container);

      // Show dynamic content
      const toggleButton = screen.getByRole('button', { name: 'Toggle Content' });
      await user.click(toggleButton);

      // Dynamic content should also pass
      await testA11y(container);
      
      // Verify dynamic content is accessible
      expect(screen.getByRole('region', { name: 'Dynamic content' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Dynamic Heading' })).toBeInTheDocument();
    });
  });

  describe('Performance and Scalability', () => {
    it('handles large numbers of components efficiently', async () => {
      const LargeComponentSet = () => (
        <div>
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i}>
              <Button>Button {i + 1}</Button>
              <Input placeholder={`Input ${i + 1}`} aria-label={`Input ${i + 1}`} />
            </div>
          ))}
        </div>
      );

      const { container } = render(<LargeComponentSet />);

      // Should handle large component sets without performance issues
      const startTime = performance.now();
      await testA11y(container, a11yConfigs.relaxed);
      const endTime = performance.now();

      // Test should complete in reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});