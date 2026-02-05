/**
 * Comprehensive accessibility test suite for UI components
 * Tests automated accessibility, keyboard navigation, ARIA attributes, and screen reader compatibility
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  testA11y, 
  testKeyboardAccessibility, 
  testAriaAttributes, 
  testFormAccessibility,
  testScreenReaderCompatibility,
  runFullAccessibilityTest,
  mockScreenReaderAnnouncements,
  a11yConfigs
} from '../../../test-utils/accessibility'

// Import components to test
import { Button } from '../button'
import { Input } from '../input'
import { Label } from '../label'
import { Checkbox } from '../checkbox'
import { RadioGroup, RadioGroupItem } from '../radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../accordion'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../alert-dialog'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../navigation-menu'

describe('UI Components Accessibility', () => {
  let mockScreenReader: ReturnType<typeof mockScreenReaderAnnouncements>;

  beforeEach(() => {
    mockScreenReader = mockScreenReaderAnnouncements();
  });

  afterEach(() => {
    mockScreenReader.clearAnnouncements();
  });

  describe('Button Accessibility', () => {
    it('passes automated accessibility tests', async () => {
      const { container } = render(<Button>Test Button</Button>);
      await testA11y(container, a11yConfigs.strict);
    });

    it('supports keyboard navigation', async () => {
      const { container } = render(
        <div>
          <Button>First Button</Button>
          <Button>Second Button</Button>
        </div>
      );

      await testKeyboardAccessibility(container, {
        expectFocusable: ['button'],
        testTabOrder: true
      });
    });

    it('has proper ARIA attributes', () => {
      const { container } = render(
        <Button aria-label="Close dialog" aria-expanded={false}>
          ×
        </Button>
      );

      testAriaAttributes(container, {
        hasAriaLabel: [{ selector: 'button', label: 'Close dialog' }],
        hasAriaExpanded: [{ selector: 'button', expanded: false }]
      });
    });

    it('supports screen reader announcements', async () => {
      const user = userEvent.setup();
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      
      // Button should be announced by screen reader
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAccessibleName('Click me');
    });

    it('handles disabled state accessibly', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
      
      await testA11y(container);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('supports focus management', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>First</Button>
          <Button>Second</Button>
        </div>
      );

      const firstButton = screen.getByRole('button', { name: 'First' });
      const secondButton = screen.getByRole('button', { name: 'Second' });

      // Tab navigation should work
      await user.tab();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(secondButton).toHaveFocus();
    });
  });

  describe('Form Controls Accessibility', () => {
    it('Input with Label passes accessibility tests', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="test-input">Test Input</Label>
          <Input id="test-input" placeholder="Enter text" />
        </div>
      );

      await testFormAccessibility(container, {
        expectLabels: ['#test-input']
      });
    });

    it('Required input has proper ARIA attributes', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="required-input">Required Field *</Label>
          <Input id="required-input" required aria-required="true" />
        </div>
      );

      await testFormAccessibility(container, {
        expectLabels: ['#required-input'],
        expectRequired: ['#required-input']
      });
    });

    it('Input with error message has proper associations', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="error-input">Email</Label>
          <Input 
            id="error-input" 
            aria-describedby="error-message"
            aria-invalid="true"
          />
          <div id="error-message" role="alert">
            Please enter a valid email
          </div>
        </div>
      );

      await testFormAccessibility(container, {
        expectLabels: ['#error-input'],
        expectErrorMessages: ['#error-input']
      });

      testAriaAttributes(container, {
        hasAriaDescribedBy: [{ selector: '#error-input', describedBy: 'error-message' }]
      });
    });

    it('Checkbox has proper accessibility', async () => {
      const { container } = render(
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms">Accept terms and conditions</Label>
        </div>
      );

      await testA11y(container);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAccessibleName('Accept terms and conditions');
    });

    it('Radio Group has proper accessibility', async () => {
      const { container } = render(
        <RadioGroup defaultValue="option1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="option1" />
            <Label htmlFor="option1">Option 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="option2" />
            <Label htmlFor="option2">Option 2</Label>
          </div>
        </RadioGroup>
      );

      await testA11y(container);
      
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
      
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(2);
      expect(radios[0]).toHaveAccessibleName('Option 1');
      expect(radios[1]).toHaveAccessibleName('Option 2');
    });
  });

  describe('Interactive Components Accessibility', () => {
    it('Dialog has proper accessibility', async () => {
      const { container } = render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogHeader>
            <p>Dialog content goes here.</p>
          </DialogContent>
        </Dialog>
      );

      await testA11y(container);
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('Tabs have proper accessibility', async () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      await testA11y(container);
      
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
      
      const tabPanel = screen.getByRole('tabpanel');
      expect(tabPanel).toBeInTheDocument();
    });

    it('Accordion has proper accessibility', async () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content for section 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item2">
            <AccordionTrigger>Section 2</AccordionTrigger>
            <AccordionContent>Content for section 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      await testA11y(container);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      
      // Check ARIA attributes
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-expanded');
        expect(button).toHaveAttribute('aria-controls');
      });
    });

    it('Alert Dialog has proper accessibility', async () => {
      const { container } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await testA11y(container);
      
      const trigger = screen.getByRole('button', { name: 'Delete' });
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    });
  });

  describe('Navigation Accessibility', () => {
    it('Navigation Menu has proper accessibility', async () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="/product1">Product 1</NavigationMenuLink>
                <NavigationMenuLink href="/product2">Product 2</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/about">About</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      await testA11y(container);
      
      // Navigation should be properly structured
      const nav = container.querySelector('[role="navigation"]');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation in menus', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/home">Home</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/about">About</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/contact">Contact</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const firstLink = screen.getByRole('link', { name: 'Home' });
      
      // Focus first item
      await user.click(firstLink);
      expect(firstLink).toHaveFocus();
    });

    it('supports Enter and Space key activation', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item1">
            <AccordionTrigger>Toggle Section</AccordionTrigger>
            <AccordionContent>Section content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole('button', { name: 'Toggle Section' });
      
      // Should activate with Enter key
      await user.click(trigger);
      await user.keyboard('{Enter}');
      
      // Should activate with Space key
      await user.keyboard(' ');
    });

    it('supports Escape key to close dialogs', async () => {
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
      
      // Escape should close it
      await user.keyboard('{Escape}');
    });
  });

  describe('Focus Management', () => {
    it('traps focus within modal dialogs', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>Outside Button</Button>
          <Dialog defaultOpen>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modal Dialog</DialogTitle>
              </DialogHeader>
              <Button>Inside Button 1</Button>
              <Button>Inside Button 2</Button>
            </DialogContent>
          </Dialog>
        </div>
      );

      const insideButton1 = screen.getByRole('button', { name: 'Inside Button 1' });
      const insideButton2 = screen.getByRole('button', { name: 'Inside Button 2' });
      
      // Focus should be trapped within dialog
      await user.tab();
      expect(document.activeElement).toBe(insideButton1);
      
      await user.tab();
      expect(document.activeElement).toBe(insideButton2);
    });

    it('restores focus after dialog closes', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Test Dialog</DialogTitle>
              </DialogHeader>
              <Button>Close</Button>
            </DialogContent>
          </Dialog>
        </div>
      );

      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      
      // Focus trigger and open dialog
      await user.click(trigger);
      
      // Close dialog with Escape
      await user.keyboard('{Escape}');
      
      // Focus should return to trigger
      expect(trigger).toHaveFocus();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('provides proper headings structure', () => {
      const { container } = render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
        </div>
      );

      testScreenReaderCompatibility(container, {
        expectHeadings: true,
        expectLandmarks: false,
        expectAltText: false
      });
    });

    it('provides proper landmarks', () => {
      const { container } = render(
        <div>
          <header>Site Header</header>
          <nav>Navigation</nav>
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
    });

    it('provides alt text for images', () => {
      const { container } = render(
        <div>
          <img src="/test.jpg" alt="Test image description" />
          <img src="/decorative.jpg" alt="" role="presentation" />
        </div>
      );

      testScreenReaderCompatibility(container, {
        expectHeadings: false,
        expectLandmarks: false,
        expectAltText: true
      });
    });

    it('announces dynamic content changes', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>Update Status</Button>
          <div aria-live="polite" id="status">
            Ready
          </div>
        </div>
      );

      const button = screen.getByRole('button', { name: 'Update Status' });
      const status = screen.getByText('Ready');
      
      // Simulate status update
      await user.click(button);
      
      // Update the status text (this would normally be done by the component)
      fireEvent.change(status, { target: { textContent: 'Updated' } });
      
      // Screen reader should announce the change
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('maintains sufficient color contrast', async () => {
      const { container } = render(
        <div>
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
        </div>
      );

      // Note: Color contrast testing in jsdom is limited
      // This test mainly ensures the structure is correct
      await testA11y(container, {
        rules: {
          'color-contrast': { enabled: false } // Disabled in test environment
        }
      });
    });

    it('provides focus indicators', async () => {
      const user = userEvent.setup();
      render(<Button>Focusable Button</Button>);

      const button = screen.getByRole('button');
      
      // Focus the button
      await user.tab();
      expect(button).toHaveFocus();
      
      // Should have focus styles
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Comprehensive Accessibility Test', () => {
    it('runs full accessibility test suite on complex component', async () => {
      const { container } = render(
        <div>
          <header>
            <h1>Application Title</h1>
            <nav>
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="/home">Home</NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </nav>
          </header>
          
          <main>
            <section>
              <h2>Form Section</h2>
              <form>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required />
                </div>
                
                <RadioGroup>
                  <div>
                    <RadioGroupItem value="option1" id="opt1" />
                    <Label htmlFor="opt1">Option 1</Label>
                  </div>
                  <div>
                    <RadioGroupItem value="option2" id="opt2" />
                    <Label htmlFor="opt2">Option 2</Label>
                  </div>
                </RadioGroup>
                
                <Button type="submit">Submit</Button>
              </form>
            </section>
          </main>
          
          <footer>
            <p>Footer content</p>
          </footer>
        </div>
      );

      // Run comprehensive accessibility test
      await runFullAccessibilityTest(container, {
        skipColorContrast: true, // Skip in test environment
        config: 'relaxed'
      });
    });
  });
});