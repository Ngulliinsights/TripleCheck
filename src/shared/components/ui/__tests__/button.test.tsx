import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Button>Test Button</Button>);
      expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveTextContent('Link Button');
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('applies destructive variant styles', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-input', 'bg-background');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('applies link variant styles', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });

    it('applies coral variant styles', () => {
      render(<Button variant="coral">Coral</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('applies coral-outline variant styles', () => {
      render(<Button variant="coral-outline">Coral Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-secondary', 'text-secondary');
    });

    it('applies coral-ghost variant styles', () => {
      render(<Button variant="coral-ghost">Coral Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-secondary', 'hover:bg-secondary/10');
    });
  });

  describe('Sizes', () => {
    it('applies default size styles', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-4', 'py-2');
    });

    it('applies small size styles', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-3');
    });

    it('applies large size styles', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-8');
    });

    it('applies icon size styles', () => {
      render(<Button size="icon">🔍</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('Props and Attributes', () => {
    it('forwards HTML button attributes', () => {
      render(
        <Button 
          type="submit" 
          disabled 
          aria-label="Submit form"
          data-testid="submit-button"
        >
          Submit
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-label', 'Submit form');
      expect(button).toHaveAttribute('data-testid', 'submit-button');
    });

    it('applies disabled styles when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
      expect(button).toBeDisabled();
    });
  });

  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger click when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard events', () => {
      const handleKeyDown = vi.fn();
      
      render(<Button onKeyDown={handleKeyDown}>Keyboard</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('handles focus and blur events', async () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Button onFocus={handleFocus} onBlur={handleBlur}>
          Focus me
        </Button>
      );
      
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });

    it('supports aria attributes', () => {
      render(
        <Button 
          aria-describedby="help-text"
          aria-expanded={false}
          aria-haspopup="menu"
        >
          Menu
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('maintains semantic button role', () => {
      render(<Button>Semantic Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('maintains semantic link role when asChild with anchor', () => {
      render(
        <Button asChild>
          <a href="/test">Link</a>
        </Button>
      );
      expect(screen.getByRole('link')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      
      render(<Button ref={ref}>Ref Button</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Ref Button');
    });

    it('forwards ref when using asChild', () => {
      const ref = React.createRef<HTMLAnchorElement>();
      
      render(
        <Button asChild ref={ref}>
          <a href="/test">Link</a>
        </Button>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
      expect(ref.current?.href).toContain('/test');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      render(<Button></Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('combines multiple variant props correctly', () => {
      render(<Button variant="outline" size="lg">Combined</Button>);
      const button = screen.getByRole('button');
      
      // Should have both variant and size classes
      expect(button).toHaveClass('border', 'border-input'); // outline variant
      expect(button).toHaveClass('h-11', 'px-8'); // lg size
    });

    it('handles undefined variant and size gracefully', () => {
      render(<Button variant={undefined} size={undefined}>Default</Button>);
      const button = screen.getByRole('button');
      
      // Should fall back to default variants
      expect(button).toHaveClass('bg-primary'); // default variant
      expect(button).toHaveClass('h-10'); // default size
    });
  });
});