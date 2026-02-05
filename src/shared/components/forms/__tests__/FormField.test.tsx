import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormField from '../FormField'

describe('FormField', () => {
  it('should render basic text input correctly', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        value="test value"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('should show required indicator', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        required
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByLabelText(/required/)).toBeInTheDocument();
  });

  it('should display error message when touched and has error', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        error="This field is required"
        touched
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should not display error when not touched', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        error="This field is required"
        touched={false}
        onChange={vi.fn()}
      />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show success indicator when valid', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        value="valid value"
        touched
        onChange={vi.fn()}
      />
    );

    // Should show green checkmark icon
    expect(screen.getByTestId('check-circle') || screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('should render textarea when type is textarea', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        type="textarea"
        rows={5}
        onChange={vi.fn()}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('should render select when type is select', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];

    render(
      <FormField
        name="test"
        label="Test Field"
        type="select"
        options={options}
        onChange={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should render file input when type is file', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        type="file"
        accept="image/*"
        multiple
        onChange={vi.fn()}
      />
    );

    const fileInput = screen.getByLabelText('Test Field');
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'image/*');
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('should call onChange when value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <FormField
        name="test"
        label="Test Field"
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText('Test Field');
    await user.type(input, 'new value');

    expect(onChange).toHaveBeenCalled();
  });

  it('should call onBlur when field loses focus', async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();

    render(
      <FormField
        name="test"
        label="Test Field"
        onBlur={onBlur}
        onChange={vi.fn()}
      />
    );

    const input = screen.getByLabelText('Test Field');
    await user.click(input);
    await user.tab();

    expect(onBlur).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        disabled
        onChange={vi.fn()}
      />
    );

    const input = screen.getByLabelText('Test Field');
    expect(input).toBeDisabled();
  });

  it('should display help text', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        helpText="This is help text"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('This is help text')).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        error="Error message"
        touched
        helpText="Help text"
        onChange={vi.fn()}
      />
    );

    const input = screen.getByLabelText('Test Field');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
    
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toContain('test-error');
    expect(describedBy).toContain('test-help');
  });

  it('should handle number input with min/max/step', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        type="number"
        min={0}
        max={100}
        step={5}
        onChange={vi.fn()}
      />
    );

    const input = screen.getByLabelText('Test Field');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
    expect(input).toHaveAttribute('step', '5');
  });

  it('should apply custom CSS classes', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        className="custom-field"
        inputClassName="custom-input"
        labelClassName="custom-label"
        errorClassName="custom-error"
        error="Error"
        touched
        onChange={vi.fn()}
      />
    );

    const fieldContainer = screen.getByLabelText('Test Field').closest('.custom-field');
    expect(fieldContainer).toBeInTheDocument();

    const input = screen.getByLabelText('Test Field');
    expect(input).toHaveClass('custom-input');

    const label = screen.getByText('Test Field');
    expect(label).toHaveClass('custom-label');

    const error = screen.getByRole('alert');
    expect(error).toHaveClass('custom-error');
  });

  it('should handle select with placeholder', () => {
    const options = [
      { value: 'option1', label: 'Option 1' }
    ];

    render(
      <FormField
        name="test"
        label="Test Field"
        type="select"
        placeholder="Choose an option"
        options={options}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Choose an option')).toBeInTheDocument();
    const placeholderOption = screen.getByRole('option', { name: 'Choose an option' });
    expect(placeholderOption).toHaveAttribute('disabled');
  });

  it('should handle keyboard navigation for accessibility', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <FormField
        name="test"
        label="Test Field"
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText('Test Field');
    
    // Tab to focus the input
    await user.tab();
    expect(input).toHaveFocus();

    // Type in the input
    await user.keyboard('test value');
    expect(onChange).toHaveBeenCalled();
  });

  it('should handle error state styling', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        error="Error message"
        touched
        onChange={vi.fn()}
      />
    );

    const input = screen.getByLabelText('Test Field');
    const label = screen.getByText('Test Field');

    // Check for error styling classes
    expect(input).toHaveClass('border-red-500');
    expect(label).toHaveClass('text-red-600');
  });

  it('should handle valid state styling', () => {
    render(
      <FormField
        name="test"
        label="Test Field"
        value="valid value"
        touched
        onChange={vi.fn()}
      />
    );

    const input = screen.getByLabelText('Test Field');
    const label = screen.getByText('Test Field');

    // Check for valid styling classes
    expect(input).toHaveClass('border-green-500');
    expect(label).toHaveClass('text-green-600');
  });
});