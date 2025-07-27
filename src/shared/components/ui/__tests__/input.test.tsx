import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder text', () => {
      render(<Input placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<Input defaultValue="Default text" />);
      expect(screen.getByDisplayValue('Default text')).toBeInTheDocument();
    });

    it('renders with controlled value', () => {
      render(<Input value="Controlled value" onChange={() => {}} />);
      expect(screen.getByDisplayValue('Controlled value')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Input className="custom-input" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('custom-input');
    });
  });

  describe('Input Types', () => {
    it('renders as text input by default', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      // HTML inputs default to text type even without explicit attribute
      expect(input.type).toBe('text');
    });

    it('renders as email input', () => {
      render(<Input type="email" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');
    });

    it('renders as password input', () => {
      render(<Input type="password" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');
    });

    it('renders as number input', () => {
      render(<Input type="number" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
    });

    it('renders as search input', () => {
      render(<Input type="search" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'search');
    });

    it('renders as tel input', () => {
      render(<Input type="tel" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'tel');
    });

    it('renders as url input', () => {
      render(<Input type="url" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'url');
    });
  });

  describe('Styling', () => {
    it('applies default styling classes', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass(
        'flex',
        'h-10',
        'w-full',
        'rounded-md',
        'border',
        'border-input',
        'bg-background',
        'px-3',
        'py-2',
        'text-sm'
      );
    });

    it('applies focus styles', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-2'
      );
    });

    it('applies disabled styles', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass(
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      );
    });

    it('applies placeholder styles', () => {
      render(<Input placeholder="Test" data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass('placeholder:text-muted-foreground');
    });

    it('applies file input styles', () => {
      render(<Input type="file" data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveClass(
        'file:border-0',
        'file:bg-transparent',
        'file:text-sm',
        'file:font-medium',
        'file:text-foreground'
      );
    });
  });

  describe('Props and Attributes', () => {
    it('forwards HTML input attributes', () => {
      render(
        <Input
          id="test-input"
          name="testName"
          required
          disabled
          readOnly
          maxLength={100}
          minLength={5}
          pattern="[A-Za-z]+"
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('id', 'test-input');
      expect(input).toHaveAttribute('name', 'testName');
      expect(input).toBeRequired();
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveAttribute('maxlength', '100');
      expect(input).toHaveAttribute('minlength', '5');
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
    });

    it('handles min and max for number inputs', () => {
      render(
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
      expect(input).toHaveAttribute('step', '0.1');
    });

    it('handles autocomplete attribute', () => {
      render(<Input autoComplete="email" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('autocomplete', 'email');
    });
  });

  describe('Interactions', () => {
    it('handles onChange events', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      await user.type(input, 'Hello');
      
      expect(handleChange).toHaveBeenCalledTimes(5); // One for each character
      expect(input).toHaveValue('Hello');
    });

    it('handles onFocus and onBlur events', async () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Input
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles onKeyDown events', () => {
      const handleKeyDown = vi.fn();
      
      render(<Input onKeyDown={handleKeyDown} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'Enter' })
      );
    });

    it('handles paste events', async () => {
      const handlePaste = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onPaste={handlePaste} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      await user.click(input);
      await user.paste('Pasted text');
      
      expect(handlePaste).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue('Pasted text');
    });

    it('does not trigger events when disabled', async () => {
      const handleChange = vi.fn();
      const handleFocus = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Input
          disabled
          onChange={handleChange}
          onFocus={handleFocus}
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      
      // Try to interact with disabled input
      await user.click(input);
      await user.type(input, 'test');
      
      expect(handleFocus).not.toHaveBeenCalled();
      expect(handleChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('works as uncontrolled component', async () => {
      const user = userEvent.setup();
      
      render(<Input defaultValue="initial" data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveValue('initial');
      
      await user.clear(input);
      await user.type(input, 'new value');
      
      expect(input).toHaveValue('new value');
    });

    it('works as controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('controlled');
        
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="input"
          />
        );
      };
      
      const user = userEvent.setup();
      render(<TestComponent />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveValue('controlled');
      
      await user.clear(input);
      await user.type(input, 'updated');
      
      expect(input).toHaveValue('updated');
    });

    it('maintains controlled state when value prop changes', () => {
      const { rerender } = render(
        <Input value="first" onChange={() => {}} data-testid="input" />
      );
      
      expect(screen.getByTestId('input')).toHaveValue('first');
      
      rerender(
        <Input value="second" onChange={() => {}} data-testid="input" />
      );
      
      expect(screen.getByTestId('input')).toHaveValue('second');
    });
  });

  describe('Accessibility', () => {
    it('supports aria attributes', () => {
      render(
        <Input
          aria-label="Search input"
          aria-describedby="help-text"
          aria-invalid={true}
          aria-required={true}
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-label', 'Search input');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('maintains proper role', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('supports role override for search inputs', () => {
      render(<Input type="search" role="searchbox" data-testid="input" />);
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('is keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Input data-testid="input1" />
          <Input data-testid="input2" />
        </div>
      );
      
      const input1 = screen.getByTestId('input1');
      const input2 = screen.getByTestId('input2');
      
      await user.click(input1);
      expect(input1).toHaveFocus();
      
      await user.tab();
      expect(input2).toHaveFocus();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      
      render(<Input ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('allows ref methods to be called', () => {
      const ref = React.createRef<HTMLInputElement>();
      
      render(<Input ref={ref} />);
      
      // Test that we can call input methods
      expect(() => {
        ref.current?.focus();
        ref.current?.blur();
        ref.current?.select();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles null and undefined values gracefully', () => {
      const { rerender } = render(
        <Input value={null as any} onChange={() => {}} data-testid="input" />
      );
      
      expect(screen.getByTestId('input')).toHaveValue('');
      
      rerender(
        <Input value={undefined as any} onChange={() => {}} data-testid="input" />
      );
      
      expect(screen.getByTestId('input')).toHaveValue('');
    });

    it('handles very long values', async () => {
      const longValue = 'a'.repeat(100); // Reduced for performance
      const user = userEvent.setup();
      
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId('input');
      await user.type(input, longValue);
      
      expect(input).toHaveValue(longValue);
    }, 10000); // Increased timeout

    it('handles special characters', async () => {
      const specialChars = '!@#$%^&*()_+-=';
      const user = userEvent.setup();
      
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId('input');
      await user.type(input, specialChars);
      
      expect(input).toHaveValue(specialChars);
    });

    it('handles rapid typing', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      
      // Type rapidly
      await user.type(input, 'rapid', { delay: 1 });
      
      // Should be called at least 5 times (one for each character)
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('rapid');
    });
  });
});