import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { renderWithProviders, userEventInstance, createTestQueryClient } from '../../../shared/test-utils';
import { TestDataFactory } from '../../../shared/test-u