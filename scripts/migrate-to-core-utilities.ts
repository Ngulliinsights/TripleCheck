#!/usr/bin/env node

/**
 * Comprehensive Migration Script for Core Utilities
 * 
 * This script migrates all references from old service implementations
 * to the new consolidated core utilities.
 */

import * as fs from './add-b2b-messaging';
import * as path from './fix-core-import-paths';
import { glob } from 'glob';

interface MigrationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
  filePatterns?: string[];
}

class CoreUtilitiesMigrator {
  private migrationRules: MigrationRule[] = [];
  private processedFiles: Set<st