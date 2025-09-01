#!/usr/bin/env node

/**
 * Comprehensive Migration Script for Core Utilities
 * 
 * This script migrates all references from old service implementations
 * to the new consolidated core utilities.
 */

import * as fs from 'fs';
import * as path from 'path';
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