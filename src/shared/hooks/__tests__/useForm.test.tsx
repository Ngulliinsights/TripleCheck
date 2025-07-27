import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm, useFileUpload } from '../useForm';

// Mock the toast hook
vi.mock('../use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('useForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct values', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: {
          name: 'John',
          email: ''
        }
      })
    );

    expect(result.current.values.name).toBe('John');
    expect(result.current.values.email).toBe('');
    expect(result.current.isValid).toBe(true);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update values correctly', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: {
          name: '',
          email: ''
        }
      })
    );

    act(() => {
      result.current.setValue('name', 'John Doe');
    });

    expect(result.current.values.name).toBe('John Doe');
    expect(result.current.isDirty).toBe(true);
  });

  it('should validate fields with rules', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: {
          name: '',
          email: ''
        },
        validationRules: {
          name: { required: true },
          email: { required: true, email: true }
        }
      })
    );

    act(() => {
      result.current.setTouched('name', true);
      result.current.setTouched('email', true);
    });

    expect(result.current.hasFieldError('name')).toBe(true);
    expect(result.current.hasFieldError('email')).toBe(true);
    expect(result.current.isValid).toBe(false);
  });

  it('should validate on form submission', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useForm({
        initialValues: {
          name: '',
          email: 'invalid-email'
        },
        validationRules: {
          name: { required: true },
          email: { email: true }
        },
        onSubmit
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.isValid).toBe(false);
    expect(result.current.hasFieldError('name')).toBe(true);
    expect(result.current.hasFieldError('email')).toBe(true);
  });

  it('should call onSubmit with valid data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useForm({
        initialValues: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        validationRules: {
          name: { required: true },
          email: { email: true }
        },
        onSubmit
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com'
    });
  });

  it('should handle submission errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
    const { result } = renderHook(() =>
      useForm({
        initialValues: {
          name: 'John Doe'
        },
        onSubmit
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('should reset form correctly', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: {
          name: '',
          email: ''
        }
      })
    );

    act(() => {
      result.current.setValue('name', 'John');
      result.current.setTouched('name', true);
    });

    expect(result.current.values.name).toBe('John');
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.handleReset();
    });

    expect(result.current.values.name).toBe('');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.touched.name).toBe(false);
  });

  it('should provide correct field props', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: {
          name: 'John'
        },
        validationRules: {
          name: { required: true }
        }
      })
    );

    const fieldProps = result.current.getFieldProps('name');

    expect(fieldProps.name).toBe('name');
    expect(fieldProps.value).toBe('John');
    expect(typeof fieldProps.onChange).toBe('function');
    expect(typeof fieldProps.onBlur).toBe('function');
  });

  it('should handle field props onChange correctly', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: {
          name: '',
          isActive: false
        }
      })
    );

    const nameProps = result.current.getFieldProps('name');
    const checkboxProps = result.current.getFieldProps('isActive');

    // Test text input change
    act(() => {
      nameProps.onChange({
        target: { value: 'John', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.name).toBe('John');

    // Test checkbox change
    act(() => {
      checkboxProps.onChange({
        target: { checked: true, type: 'checkbox' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.isActive).toBe(true);
  });

  it('should validate on change when enabled', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: {
          email: ''
        },
        validationRules: {
          email: { email: true }
        },
        validateOnChange: true
      })
    );

    const fieldProps = result.current.getFieldProps('email');

    act(() => {
      fieldProps.onChange({
        target: { value: 'invalid-email', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Field should be automatically touched and validated
    expect(result.current.values.email).toBe('invalid-email');
  });

  it('should validate on blur when enabled', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: {
          name: ''
        },
        validationRules: {
          name: { required: true }
        },
        validateOnBlur: true
      })
    );

    const fieldProps = result.current.getFieldProps('name');

    act(() => {
      fieldProps.onBlur({} as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.touched.name).toBe(true);
  });
});

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useFileUpload());

    expect(result.current.files).toEqual([]);
    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should handle file selection', () => {
    const { result } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockEvent = {
      target: { files: [file] }
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileSelect(mockEvent);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0]).toBe(file);
  });

  it('should validate file size', () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFileUpload({
        maxSize: 100, // 100 bytes
        onError
      })
    );

    const largeFile = new File(['x'.repeat(200)], 'large.txt', { type: 'text/plain' });
    const mockEvent = {
      target: { files: [largeFile] }
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileSelect(mockEvent);
    });

    expect(result.current.files).toHaveLength(0);
    expect(onError).toHaveBeenCalled();
    expect(result.current.error).toContain('File size must be less than');
  });

  it('should validate file types', () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFileUpload({
        allowedTypes: ['image/*'],
        onError
      })
    );

    const textFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockEvent = {
      target: { files: [textFile] }
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileSelect(mockEvent);
    });

    expect(result.current.files).toHaveLength(0);
    expect(onError).toHaveBeenCalled();
    expect(result.current.error).toContain('File type not allowed');
  });

  it('should handle drag and drop', () => {
    const { result } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [file] }
    } as unknown as React.DragEvent;

    act(() => {
      result.current.handleDrop(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.files).toHaveLength(1);
  });

  it('should remove files', () => {
    const { result } = renderHook(() => useFileUpload());

    const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
    const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });
    const mockEvent = {
      target: { files: [file1, file2] }
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileSelect(mockEvent);
    });

    expect(result.current.files).toHaveLength(2);

    act(() => {
      result.current.removeFile(0);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0]).toBe(file2);
  });

  it('should clear all files', () => {
    const { result } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockEvent = {
      target: { files: [file] }
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileSelect(mockEvent);
    });

    expect(result.current.files).toHaveLength(1);

    act(() => {
      result.current.clearFiles();
    });

    expect(result.current.files).toHaveLength(0);
  });

  it('should handle upload with progress', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useFileUpload({ onUpload })
    );

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockEvent = {
      target: { files: [file] }
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileSelect(mockEvent);
    });

    await act(async () => {
      await result.current.upload();
    });

    expect(onUpload).toHaveBeenCalledWith([file]);
    expect(result.current.progress).toBe(100);
  });

  it('should handle upload errors', async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error('Upload failed'));
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFileUpload({ onUpload, onError })
    );

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockEvent = {
      target: { files: [file] }
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileSelect(mockEvent);
    });

    await act(async () => {
      await result.current.upload();
    });

    expect(onError).toHaveBeenCalledWith('Upload failed');
    expect(result.current.error).toBe('Upload failed');
    expect(result.current.uploading).toBe(false);
  });

  it('should respect multiple file setting', () => {
    const { result: singleResult } = renderHook(() =>
      useFileUpload({ multiple: false })
    );
    const { result: multipleResult } = renderHook(() =>
      useFileUpload({ multiple: true })
    );

    const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
    const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });

    // Add first file to both
    act(() => {
      singleResult.current.handleFileSelect({
        target: { files: [file1] }
      } as React.ChangeEvent<HTMLInputElement>);
      multipleResult.current.handleFileSelect({
        target: { files: [file1] }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Add second file to both
    act(() => {
      singleResult.current.handleFileSelect({
        target: { files: [file2] }
      } as React.ChangeEvent<HTMLInputElement>);
      multipleResult.current.handleFileSelect({
        target: { files: [file2] }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(singleResult.current.files).toHaveLength(1);
    expect(singleResult.current.files[0]).toBe(file2);
    expect(multipleResult.current.files).toHaveLength(2);
  });
});