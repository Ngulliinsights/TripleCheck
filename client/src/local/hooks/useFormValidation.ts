import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  /** Return an error string on failure, or null on success. */
  custom?: (value: any, formData?: any) => string | null;
  /** When this returns false the rule is skipped entirely. */
  when?: (formData: any) => boolean;
  /** Debounce validation by N ms (useful for async/expensive rules). */
  debounce?: number;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isValidating: boolean;
  submitCount: number;
  lastSubmissionTime: Date | undefined;
}

export interface UseFormValidationOptions<T> {
  initialData: T;
  validationRules: ValidationRules;
  onSubmit: (data: T) => Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  /** Transform data before validation and submission. */
  transformData?: (data: T) => T;
  /** Reset to initialData after a successful submission. */
  resetOnSuccess?: boolean;
  /** Ignore submissions within 1 second of each other. */
  preventDoubleSubmit?: boolean;
}

export interface UseFormValidationReturn<T> {
  formState: FormState<T>;
  setValue: (field: keyof T, value: any) => void;
  setMultipleValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  validateField: (field: keyof T, value: any) => Promise<string | null>;
  validateForm: () => Promise<boolean>;
  getFieldProps: (field: keyof T) => FieldProps;
  getFieldError: (field: keyof T) => string | null;
  isFieldValid: (field: keyof T) => boolean;
  clearForm: () => void;
  isDirty: boolean;
  canSubmit: boolean;
}

interface FieldProps {
  name: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: () => void;
  error: string;
  touched: boolean;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Safely coerce any value to a string. Never returns undefined/null. */
function toStr(value: unknown): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : String(value);
}

/** True for null, undefined, empty string (trimmed), empty array, empty object. */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

/**
 * Structural equality check that handles primitives, arrays, and plain objects.
 * Used for isDirty — avoids the pitfall of coercing booleans/numbers to strings.
 */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k =>
    isEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
  );
}

function makeRecord<T extends Record<string, any>, V>(
  obj: T,
  value: V
): Record<keyof T, V> {
  return Object.keys(obj).reduce((acc, key) => {
    (acc as any)[key] = value;
    return acc;
  }, {} as Record<keyof T, V>);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFormValidation<T extends Record<string, any>>({
  initialData,
  validationRules,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
  transformData,
  resetOnSuccess = false,
  preventDoubleSubmit = true,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {

  // ── State ────────────────────────────────────────────────────────────────

  const [data, setData] = useState<T>(() => ({ ...initialData }));
  const [errors, setErrors] = useState<Record<keyof T, string>>(
    () => makeRecord(initialData, '')
  );
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>(
    () => makeRecord(initialData, false)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<Date | undefined>();

  // ── Refs ─────────────────────────────────────────────────────────────────

  // Keep a live ref to data so validators always see the current snapshot,
  // solving the stale-closure problem without adding data to every dep array.
  const dataRef = useRef<T>(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const initialDataRef = useRef<T>(initialData);
  useEffect(() => { initialDataRef.current = initialData; }, [initialData]);

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastSubmissionTimeRef = useRef<Date | undefined>();

  // ── Field validation ─────────────────────────────────────────────────────

  const validateField = useCallback(async (
    field: keyof T,
    value: any
  ): Promise<string | null> => {
    const key = field as string;
    const rule = validationRules[key];
    if (!rule) return null;

    // Conditional skip
    if (rule.when && !rule.when(dataRef.current)) return null;

    // Required
    if (rule.required && isEmpty(value)) return 'This field is required';

    // Skip remaining checks when empty and optional
    if (isEmpty(value)) return null;

    const str = toStr(value);

    if (rule.minLength !== undefined && str.length < rule.minLength)
      return `Must be at least ${rule.minLength} characters`;

    if (rule.maxLength !== undefined && str.length > rule.maxLength)
      return `Must be no more than ${rule.maxLength} characters`;

    if (rule.pattern) {
      try {
        if (!rule.pattern.test(str)) return 'Invalid format';
      } catch (err) {
        console.warn(`[useFormValidation] Regex error on field "${key}":`, err);
        return 'Validation error occurred';
      }
    }

    if (rule.custom) {
      try {
        return rule.custom(value, dataRef.current);
      } catch (err) {
        console.error(`[useFormValidation] Custom validator error on field "${key}":`, err);
        return 'Validation error occurred';
      }
    }

    return null;
  }, [validationRules]); // dataRef is a stable ref — not needed in deps

  // Runs validation and writes result to errors, respecting debounce config.
  const scheduleValidation = useCallback((field: keyof T, value: any): void => {
    const key = field as string;
    const rule = validationRules[key];
    const delay = rule?.debounce ?? 0;

    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);

    if (delay > 0) {
      debounceTimers.current[key] = setTimeout(async () => {
        const error = await validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error ?? '' }));
      }, delay);
    } else {
      // Fire synchronously (still async under the hood via validateField)
      validateField(field, value).then(error => {
        setErrors(prev => ({ ...prev, [field]: error ?? '' }));
      });
    }
  }, [validateField, validationRules]);

  // ── Full-form validation ─────────────────────────────────────────────────

  const validateForm = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    try {
      const snapshot = dataRef.current;
      const results = await Promise.all(
        Object.keys(snapshot).map(async key => {
          const field = key as keyof T;
          const error = await validateField(field, snapshot[field]);
          return [field, error ?? ''] as const;
        })
      );

      const newErrors = Object.fromEntries(results) as Record<keyof T, string>;
      setErrors(newErrors);
      return results.every(([, error]) => !error);
    } catch (err) {
      console.error('[useFormValidation] validateForm error:', err);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [validateField]); // dataRef is stable — not needed in deps

  // ── Reset (defined before handleSubmit so it can be referenced safely) ───

  const handleReset = useCallback(() => {
    const initial = initialDataRef.current;
    setData({ ...initial });
    setErrors(makeRecord(initial, ''));
    setTouchedState(makeRecord(initial, false));
    setIsSubmitting(false);
    setIsValidating(false);
    setSubmitCount(0);
    setLastSubmissionTime(undefined);
    lastSubmissionTimeRef.current = undefined;
  }, []); // initialDataRef is stable

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (preventDoubleSubmit && isSubmitting) return;

    // 1-second cooldown guard (use ref to avoid stale closure)
    if (preventDoubleSubmit && lastSubmissionTimeRef.current) {
      if (Date.now() - lastSubmissionTimeRef.current.getTime() < 1000) return;
    }

    const now = new Date();
    lastSubmissionTimeRef.current = now;
    setLastSubmissionTime(now);
    setIsSubmitting(true);

    try {
      // Mark everything touched so errors are visible
      setTouchedState(makeRecord(dataRef.current, true));

      const isValid = await validateForm();
      if (!isValid) return;

      const submissionData = transformData
        ? transformData({ ...dataRef.current })
        : { ...dataRef.current };

      await onSubmit(submissionData);
      setSubmitCount(prev => prev + 1);

      if (resetOnSuccess) handleReset();
    } catch (err) {
      // Bubble up so callers can show error toasts etc.
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    preventDoubleSubmit,
    validateForm,
    transformData,
    onSubmit,
    resetOnSuccess,
    handleReset,
  ]);

  // ── Field mutators ───────────────────────────────────────────────────────

  const setValue = useCallback((field: keyof T, value: any) => {
    const safe = value === undefined ? null : value;
    setData(prev => ({ ...prev, [field]: safe }));
    // Always clear the error immediately so typing feels responsive
    setErrors(prev => ({ ...prev, [field]: '' }));
    if (validateOnChange) scheduleValidation(field, safe);
  }, [validateOnChange, scheduleValidation]);

  const setMultipleValues = useCallback((values: Partial<T>) => {
    setData(prev => ({ ...prev, ...values }));
    setErrors(prev => {
      const next = { ...prev };
      for (const key of Object.keys(values)) next[key as keyof T] = '';
      return next;
    });
    if (validateOnChange) {
      Object.entries(values).forEach(([field, value]) =>
        scheduleValidation(field as keyof T, value)
      );
    }
  }, [validateOnChange, scheduleValidation]);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: toStr(error) }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const setTouched = useCallback((field: keyof T, value = true) => {
    setTouchedState(prev => ({ ...prev, [field]: Boolean(value) }));
  }, []);

  // Resets to empty values (not initialData) while preserving field types.
  const clearForm = useCallback(() => {
    const initial = initialDataRef.current;
    const emptyData = Object.keys(initial).reduce((acc, key) => {
      const k = key as keyof T;
      const orig = initial[k];
      let empty: unknown;
      if (typeof orig === 'boolean') empty = false;
      else if (typeof orig === 'number') empty = 0;
      else if (Array.isArray(orig)) empty = [];
      else if (orig !== null && typeof orig === 'object') empty = {};
      else empty = '';
      (acc as any)[k] = empty;
      return acc;
    }, {} as T);

    setData(emptyData);
    setErrors(makeRecord(emptyData, ''));
    setTouchedState(makeRecord(emptyData, false));
  }, []); // initialDataRef is stable

  // ── Field accessors ──────────────────────────────────────────────────────

  const getFieldProps = useCallback((field: keyof T): FieldProps => ({
    name: field as string,
    value: data[field] ?? '',
    onChange: (e) => {
      const value =
        e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setValue(field, value);
    },
    onBlur: () => {
      setTouched(field, true);
      if (validateOnBlur) scheduleValidation(field, dataRef.current[field]);
    },
    error: toStr(errors[field]),
    touched: Boolean(touched[field]),
  }), [data, errors, touched, setValue, setTouched, validateOnBlur, scheduleValidation]);

  const getFieldError = useCallback((field: keyof T): string | null => {
    const error = toStr(errors[field]);
    return touched[field] && error ? error : null;
  }, [errors, touched]);

  const isFieldValid = useCallback((field: keyof T): boolean => {
    return !(touched[field] && toStr(errors[field]));
  }, [errors, touched]);

  // ── Derived values ───────────────────────────────────────────────────────

  const isValid = useMemo(
    () => Object.values(errors).every(e => !toStr(e)),
    [errors]
  );

  // Uses structural equality so booleans, numbers, and objects are compared correctly.
  const isDirty = useMemo(() => {
    return Object.keys(data).some(key => {
      const k = key as keyof T;
      return !isEqual(data[k], initialDataRef.current[k]);
    });
  }, [data]);

  const canSubmit = useMemo(
    () => isValid && !isSubmitting && !isValidating,
    [isValid, isSubmitting, isValidating]
  );

  // ── Cleanup ──────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // ── Return ───────────────────────────────────────────────────────────────

  const formState: FormState<T> = {
    data,
    errors,
    touched,
    isSubmitting,
    isValid,
    isValidating,
    submitCount,
    lastSubmissionTime,
  };

  return {
    formState,
    setValue,
    setMultipleValues,
    setError,
    clearError,
    setTouched,
    handleSubmit,
    handleReset,
    validateField,
    validateForm,
    getFieldProps,
    getFieldError,
    isFieldValid,
    clearForm,
    isDirty,
    canSubmit,
  };
}

// ---------------------------------------------------------------------------
// Common validation rules
// ---------------------------------------------------------------------------

export const commonValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      const s = toStr(value);
      return s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
        ? 'Please enter a valid email address'
        : null;
    },
  },
  phone: {
    pattern: /^(\+254|0)[17]\d{8}$/,
    custom: (value: string) => {
      const s = toStr(value).replace(/\s/g, '');
      return s && !/^(\+254|0)[17]\d{8}$/.test(s)
        ? 'Please enter a valid Kenyan phone number'
        : null;
    },
  },
  required: {
    required: true,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value: string) => {
      const s = toStr(value);
      return s && !/^[a-zA-Z\s'-]+$/.test(s)
        ? 'Name can only contain letters, spaces, hyphens, and apostrophes'
        : null;
    },
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 1000,
  },
  rating: {
    required: true,
    custom: (value: any) => {
      const n = Number(value);
      return isNaN(n) || n < 1 || n > 5 ? 'Rating must be between 1 and 5' : null;
    },
  },
  url: {
    pattern: /^https?:\/\/.+/,
    custom: (value: string) => {
      const s = toStr(value);
      if (!s) return null;
      try {
        new URL(s);
        return null;
      } catch {
        return 'Please enter a valid URL';
      }
    },
  },
  positiveNumber: {
    custom: (value: any) => {
      const n = Number(value);
      return value && (isNaN(n) || n <= 0) ? 'Must be a positive number' : null;
    },
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      const s = toStr(value);
      if (!s || s.length < 8) return null;
      const ok =
        /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s) && /[!@#$%^&*(),.?":{}|<>]/.test(s);
      return ok
        ? null
        : 'Password must contain uppercase, lowercase, number, and special character';
    },
  },
} as const;

// Expose the helper so consumers can use it in custom validators.
export { toStr as safeStringValue };

export default useFormValidation;