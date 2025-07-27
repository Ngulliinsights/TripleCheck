// Export all utilities from a single entry point
export * from './render';
export * from './user-event';
export * from './msw-server';
export * from './api-handlers';
export * from './accessibility';
export * from './fixtures';
export * from './patterns';
export * from './error-testing';

// Re-export testing-library utilities for convenience - avoid conflicts
export {
  render as rtlRender,
  screen,
  fireEvent,
  act,
  renderHook,
  within,
  getByRole,
  getByText,
  getByLabelText,
  getByTestId,
  queryByRole,
  queryByText,
  queryByLabelText,
  queryByTestId,
  findByRole,
  findByText,
  findByLabelText,
  findByTestId
} from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export commonly used test utilities
export { vi, expect, describe, it, test, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';