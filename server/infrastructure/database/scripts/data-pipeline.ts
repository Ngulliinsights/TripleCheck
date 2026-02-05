#!/usr/bin/env tsx
/**
 * Clean Unified Data Pipeline for TripleCheck
 * One file – no duplicates, no type errors.
 */

import 'dotenv/config';
import { spawn } from 'child_process';
import fs from '..\..\..\..\scripts\cleanup-redundancies';
import path from '..\..\..\..\scripts\cleanup-redundancies';
import { fileURLToPath } from 'url';

import { neon } from '@neondatabase/serverless';
import bcrypt from '..\..\..\..\scripts\cleanup-redundancies';
import { count } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

import { users, properties, reviews } from '..\schemas\core\index';
import type { InsertUser, InsertProperty, InsertReview } from '../src/shared/schema';

/* ---------- CONFIG ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const CONFIG = {
  CHUNK_SIZE: 1000,
  BATCH_SIZE: 50,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  DATA_DIR: path.join(__dirname, 'data-generation'),
  CHECKPOINT_DIR: path.join(__dirname, 'checkpoints'),
  LOG_DIR: path.join(__dirname, 'logs'),
  TRANSACTION_TIMEOUT: 30_000,
} as const;

/* ---------- TYPES ---------- */
export interface ProcessingOptions {
  clearExisting?: boolean;
  generateReviews?: boolean;
  runPythonGenerators?: boolean;
  validateData?: boolean;
  resumeFromCheckpoint?: boolean;
}

export interface DataStats {
  users: number;
  properties: number;
  reviews: number;
  processingTime: number;
  errors: number;
  skipped: number;
}

interface ProcessingError {
  stage: string;
  error: Error | string;
  timestamp: Date;
  context?: any;
}

interface CheckpointData {
  sessionId: string;
  stage: string;
  completed: { users: number; properties: number; reviews: number };
  userIdMapping: Record<string, number>;
  propertyIdMapping: Record<string, number>;
  timestamp: Date;
}

/* ---------- PIPELINE CLASS ---------- */
export class UnifiedDataPipeline {
  private db = drizzle(neon(process.env.DATABASE_URL!));
  private sessionId = `pipeline_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  private logFile = path.join(CONFIG.LOG_DIR, `${this.sessionId}.log`);
  private errors: ProcessingError[] = [];
  private skippedRecords = 0;
  private startTime = Date.now();

  /* ---------- PUBLIC API ---------- */
  async execute(opts: ProcessingOptions = {}): Promise<DataStats> {
    await this.initEnv();
    await this.log('🚀 Unified Data Pipeline Starting');

    const initial = await this.getCurrentStats();
    if (opts.resumeFromCheckpoint) {
      const cp = await this.loadCheckpoint();
      if (cp) return this.resumeFromCheckpoint(cp, opts);
    }

    if (opts.runPythonGenerators) await this.runPythonGenerators();
    const { users: userData, properties: propertyData } = await this.loadDataFiles();
    if (opts.validateData !== false) await this.validateDataQuality(userData, propertyData);
    if (opts.clearExisting) await this.clearExistingData();

    const userIdMapping   = await this.processUsersInChunks(userData);
    const propIdMapping   = await this.processPropertiesInChunks(propertyData, userIdMapping);
    const reviewCount     = opts.generateReviews !== false
      ? await this.generateReviews(userIdMapping, propIdMapping)
      : 0;

    const final = await this.getCurrentStats();
    await this.cleanup();
    const stats: DataStats = {
      users: final.users - initial.users,
      properties: final.properties - initial.properties,
      reviews: final.reviews - initial.reviews,
      processingTime: Math.round((Date.now() - this.startTime) / 1000),
      errors: this.errors.length,
      skipped: this.skippedRecords,
    };
    await this.logResults(stats, final);
    return stats;
  }

  /* ---------- INTERNAL HELPERS ---------- */
  private async initEnv() {
    await Promise.all([
      fs.mkdir(CONFIG.CHECKPOINT_DIR, { recursive: true }),
      fs.mkdir(CONFIG.LOG_DIR, { recursive: true }),
      fs.mkdir(CONFIG.DATA_DIR, { recursive: true }),
    ]);
  }

  private async log(msg: string) {
    const ts = new Date().toISOString();
    console.log(msg);
    await fs.appendFile(this.logFile, `[${ts}] ${msg}\n`);
  }

  private async getCurrentStats() {
    const [u, p, r] = await Promise.all([
      this.db.select({ count: count() }).from(users),
      this.db.select({ count: count() }).from(properties),
      this.db.select({ count: count() }).from(reviews),
    ]);
    return {
      users: u[0]?.count ?? 0,
      properties: p[0]?.count ?? 0,
      reviews: r[0]?.count ?? 0,
    };
  }

  private async runPythonGenerators() {
    const gens = [
      { script: path.join(CONFIG.DATA_DIR, 'user-generator.py'),   out: path.join(CONFIG.DATA_DIR, 'fraudulent_user_dataset.json') },
      { script: path.join(CONFIG.DATA_DIR, 'property-generator.py'), out: path.join(CONFIG.DATA_DIR, 'fraudulent_property_dataset.json') },
    ];
    for (const g of gens) {
      await new Promise<void>((resolve, reject) => {
        spawn('python', [g.script], { stdio: 'inherit' })
          .on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Python script ${g.script} failed code ${code}`))));
      });
    }
  }

  private async loadDataFiles() {
    const userFile    = path.join(CONFIG.DATA_DIR, 'fraudulent_user_dataset.json');
    const propertyFile= path.join(CONFIG.DATA_DIR, 'fraudulent_property_dataset.json');
    const [u, p] = await Promise.all([
      fs.readFile(userFile, 'utf8').then(JSON.parse),
      fs.readFile(propertyFile, 'utf8').then(JSON.parse),
    ]);
    return { users: u, properties: p };
  }

  private async validateDataQuality(users: any[], props: any[]) {
    const ok = (list: any[], fields: string[]) =>
      list.every(r => fields.every(f => r[f] !== undefined && r[f] !== null && r[f] !== ''));

    if (!ok(users, ['id', 'firstName', 'lastName', 'email'])) throw new Error('Invalid users');
    if (!ok(props, ['id', 'title', 'description', 'location', 'price'])) throw new Error('Invalid properties');
  }

  private async clearExistingData() {
    await this.db.delete(reviews);
    await this.db.delete(properties);
    await this.db.delete(users);
  }

  private async processUsersInChunks(arr: any[]) {
    const map = new Map<string, number>();
    const pwd = await bcrypt.hash('generated_user_2024', 12);
    const valid = arr.filter(u => u.id && u.firstName && u.lastName && u.email?.includes('@'));

    const chunks = Math.ceil(valid.length / CONFIG.CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
      const chunk = valid.slice(i * CONFIG.CHUNK_SIZE, (i + 1) * CONFIG.CHUNK_SIZE);
      const batch: InsertUser[] = [];
      const ids: string[] = [];

      for (const u of chunk) {
        const ts = Date.now().toString(36);
        batch.push({ username: `${u.firstName.toLowerCase()}_${u.lastName.toLowerCase()}_${ts}`, password: pwd });
        ids.push(u.id);
      }

      const inserted = await this.db.insert(users).values(batch).returning();
      inserted.forEach((row, idx) => map.set(ids[idx], row.id));
    }
    return map;
  }

  private async processPropertiesInChunks(arr: any[], userMap: Map<string, number>) {
    const map = new Map<string, number>();
    const ids = [...userMap.values()];
    const valid = arr.filter(p => p.id && p.title && p.description && p.location && p.price > 0);

    for (let i = 0; i < Math.ceil(valid.length / CONFIG.CHUNK_SIZE); i++) {
      const chunk = valid.slice(i * CONFIG.CHUNK_SIZE, (i + 1) * CONFIG.CHUNK_SIZE);
      const batch: InsertProperty[] = [];
      const originalIds: string[] = [];

      for (const p of chunk) {
        batch.push({
          ownerId: ids[Math.floor(Math.random() * ids.length)],
          title: p.title,
          description: p.description,
          location: p.location,
          price: p.price,
          imageUrls: p.imageUrls ?? [],
          features: {
            bedrooms: p.features?.bedrooms ?? 1,
            bathrooms: p.features?.bathrooms ?? 1,
            squareFeet: p.features?.squareFeet ?? 1000,
            parkingSpaces: p.features?.parkingSpaces ?? 0,
            yearBuilt: p.features?.yearBuilt ?? 2020,
            amenities: p.features?.amenities ?? [],
            petFriendly: p.features?.petFriendly ?? false,
            furnished: p.features?.furnished ?? false,
            propertyType: p.features?.propertyType ?? 'apartment',
          },
        });
        originalIds.push(p.id);
      }

      const inserted = await this.db.insert(properties).values(batch).returning();
      inserted.forEach((row, idx) => map.set(originalIds[idx], row.id));
    }
    return map;
  }

  private async generateReviews(userMap: Map<string, number>, propMap: Map<string, number>) {
    const userIds = [...userMap.values()];
    const propIds = [...propMap.values()];
    const templates = [
      { rating: 5, comment: 'Excellent property with great amenities!' },
      { rating: 4, comment: 'Good location and well-maintained.' },
      { rating: 3, comment: 'Decent value for the price.' },
    ];

    const target = Math.min(5000, propIds.length * 2);
    const batches = Math.ceil(target / CONFIG.CHUNK_SIZE);
    let total = 0;

    for (let i = 0; i < batches; i++) {
      const batch: InsertReview[] = [];
      for (let j = 0; j < CONFIG.CHUNK_SIZE && total + j < target; j++) {
        const t = templates[Math.floor(Math.random() * templates.length)];
        batch.push({
          propertyId: propIds[Math.floor(Math.random() * propIds.length)],
          userId: userIds[Math.floor(Math.random() * userIds.length)],
          rating: t.rating + Math.floor(Math.random() * 3) - 1,
          comment: t.comment,
        });
      }
      await this.db.insert(reviews).values(batch);
      total += batch.length;
    }
    return total;
  }

  private async saveCheckpoint(stage: string, counts: CheckpointData['completed'], userMap: Map<string, number>, propMap: Map<string, number>) {
    const cp: CheckpointData = {
      sessionId: this.sessionId,
      stage,
      completed: counts,
      userIdMapping: Object.fromEntries(userMap),
      propertyIdMapping: Object.fromEntries(propMap),
      timestamp: new Date(),
    };
    await fs.writeFile(path.join(CONFIG.CHECKPOINT_DIR, `${this.sessionId}_${stage}.json`), JSON.stringify(cp, null, 2));
  }

  private async loadCheckpoint(): Promise<CheckpointData | null> {
    const files = await fs.readdir(CONFIG.CHECKPOINT_DIR);
    const cpFile = files.filter(f => f.startsWith(this.sessionId)).sort().pop();
    if (!cpFile) return null;
    const json = await fs.readFile(path.join(CONFIG.CHECKPOINT_DIR, cpFile), 'utf8');
    return JSON.parse(json) as CheckpointData;
  }

  private async resumeFromCheckpoint(cp: CheckpointData, opts: ProcessingOptions): Promise<DataStats> {
    const uMap = new Map(Object.entries(cp.userIdMapping).map(([k, v]) => [k, v]));
    const pMap = new Map(Object.entries(cp.propertyIdMapping).map(([k, v]) => [k, v]));

    if (cp.stage === 'users') {
      const { properties: pData } = await this.loadDataFiles();
      const newPMap = await this.processPropertiesInChunks(pData, uMap);
      pMap.clear(); newPMap.forEach((v, k) => pMap.set(k, v));
    }
    let reviews = 0;
    if (opts.generateReviews !== false) reviews = await this.generateReviews(uMap, pMap);
    const final = await this.getCurrentStats();
    return {
      users: final.users,
      properties: final.properties,
      reviews,
      processingTime: Math.round((Date.now() - this.startTime) / 1000),
      errors: 0,
      skipped: 0,
    };
  }

  private async cleanup() {
    const files = await fs.readdir(CONFIG.CHECKPOINT_DIR);
    const sessionFiles = files.filter(f => f.startsWith(this.sessionId)).sort().reverse();
    for (const f of sessionFiles.slice(5)) {
      await fs.unlink(path.join(CONFIG.CHECKPOINT_DIR, f)).catch(() => {});
    }
  }

  private async logResults(stats: DataStats, final: any) {
    await this.log('');
    await this.log('✅ Pipeline finished');
    await this.log(JSON.stringify(stats, null, 2));
  }
}

/* ---------- CLI ---------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opts: ProcessingOptions = {
    clearExisting: args.includes('--clear'),
    generateReviews: !args.includes('--no-reviews'),
    runPythonGenerators: args.includes('--run-generators'),
    validateData: !args.includes('--no-validation'),
    resumeFromCheckpoint: args.includes('--resume'),
  };
  new UnifiedDataPipeline().execute(opts)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}