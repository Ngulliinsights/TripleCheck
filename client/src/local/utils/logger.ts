/**
 * Client-Side Logger
 *
 * Features:
 *  - Structured log entries (level, message, timestamp, context, error)
 *  - Child loggers with inherited + merged context (à la Pino)
 *  - Pluggable transports: console, remote (batched), circular memory buffer
 *  - Environment-aware defaults (verbose in dev, silent in test, warn+ in prod)
 *  - Token-bucket rate limiting to prevent log flooding
 *  - `measure<T>` helper for timing async operations
 *  - Full TypeScript types — zero runtime dependencies
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export const LogLevel = {
  SILENT: -1,
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];
export type LogLevelName = "silent" | "error" | "warn" | "info" | "debug" | "trace";

export interface LogEntry {
  level: LogLevel;
  levelName: LogLevelName;
  message: string;
  timestamp: string; // ISO-8601
  context: Record<string, unknown>;
  error?: SerializedError;
}

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

export interface Transport {
  log(entry: LogEntry): void;
  /** Called on graceful shutdown (e.g. page unload). */
  flush?(): void | Promise<void>;
}

export interface LoggerOptions {
  level?: LogLevel;
  context?: Record<string, unknown>;
  transports?: Transport[];
  /** Max log entries per second before surplus entries are dropped (0 = unlimited). */
  rateLimit?: number;
  /** Optional hook called whenever a log entry is suppressed by the rate limiter. */
  onRateLimitDrop?: (message: string, level: LogLevel) => void;
}

// ─── Level helpers ────────────────────────────────────────────────────────────

const LEVEL_NAMES: Record<LogLevel, LogLevelName> = {
  [-1]: "silent",
  [0]: "error",
  [1]: "warn",
  [2]: "info",
  [3]: "debug",
  [4]: "trace",
};

const NAME_TO_LEVEL: Record<LogLevelName, LogLevel> = {
  silent: LogLevel.SILENT,
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
  trace: LogLevel.TRACE,
};

function parseLevelName(name: string): LogLevel {
  const level = NAME_TO_LEVEL[name as LogLevelName];
  if (level === undefined) {
    throw new RangeError(
      `Unknown log level: "${name}". Valid values: ${Object.keys(NAME_TO_LEVEL).join(", ")}`,
    );
  }
  return level;
}

function serializeError(err: unknown): SerializedError | undefined {
  if (err == null) return undefined;
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack, cause: err.cause };
  }
  return { name: "UnknownError", message: String(err) };
}

// ─── Built-in Transports ──────────────────────────────────────────────────────

/** Pretty, colour-coded console transport for human-readable development output. */
export class ConsoleTransport implements Transport {
  private readonly styles: Partial<Record<LogLevel, string>> = {
    [LogLevel.ERROR]: "color:#ef4444;font-weight:bold",
    [LogLevel.WARN]: "color:#f59e0b;font-weight:bold",
    [LogLevel.INFO]: "color:#3b82f6",
    [LogLevel.DEBUG]: "color:#6b7280",
    [LogLevel.TRACE]: "color:#9ca3af",
  };

  log(entry: LogEntry): void {
    const { levelName, message, timestamp, context, error } = entry;
    const style = this.styles[entry.level] ?? "";
    const time = timestamp.slice(11, 23); // HH:mm:ss.mmm
    const prefix = `${time} %c[${levelName.toUpperCase()}]%c ${message}`;
    const extras = Object.keys(context).length ? context : undefined;

    const fn =
      entry.level === LogLevel.ERROR ? console.error
      : entry.level === LogLevel.WARN ? console.warn
      : entry.level <= LogLevel.INFO ? console.info
      : console.debug;

    const details = [extras, error].filter(Boolean);
    if (details.length) {
      fn(prefix, style, "", ...details);
    } else {
      fn(prefix, style, "");
    }
  }
}

/** Circular in-memory buffer — useful for attaching recent logs to error reports. */
export class MemoryTransport implements Transport {
  private readonly buffer: LogEntry[];
  private head = 0;
  private size = 0;

  constructor(private readonly capacity = 200) {
    this.buffer = new Array(capacity);
  }

  log(entry: LogEntry): void {
    this.buffer[this.head] = entry;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) this.size++;
  }

  /** Returns up to `capacity` entries, oldest first. */
  drain(): LogEntry[] {
    if (this.size < this.capacity) return this.buffer.slice(0, this.size);
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }

  clear(): void {
    this.head = 0;
    this.size = 0;
  }
}

export interface RemoteTransportOptions {
  url: string;
  /** Number of queued entries that trigger an immediate flush. Default: 20 */
  batchSize?: number;
  /** Maximum ms between periodic flushes. Default: 5000 */
  flushInterval?: number;
  /**
   * Only entries at this severity level **or above** (lower numeric value)
   * are sent remotely. Default: `WARN` — INFO, DEBUG, and TRACE are not forwarded.
   */
  remoteLevel?: LogLevel;
  /** Additional request headers (e.g. authorization tokens). */
  headers?: Record<string, string>;
}

/** Batched remote transport. Queues entries and flushes via `sendBeacon` / `fetch`. */
export class RemoteTransport implements Transport {
  private queue: LogEntry[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly opts: Required<RemoteTransportOptions>;

  constructor(options: RemoteTransportOptions) {
    this.opts = {
      batchSize: 20,
      flushInterval: 5_000,
      remoteLevel: LogLevel.WARN,
      headers: {},
      ...options,
    };
    this.scheduleFlush();

    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") void this.flush();
      });
      window.addEventListener("pagehide", () => void this.flush());
    }
  }

  log(entry: LogEntry): void {
    // Higher numeric level = lower severity; drop anything below the threshold.
    if (entry.level > this.opts.remoteLevel) return;
    this.queue.push(entry);
    if (this.queue.length >= this.opts.batchSize) void this.flush();
  }

  async flush(): Promise<void> {
    if (!this.queue.length) return;
    const batch = this.queue.splice(0); // atomically drain the queue
    const payload = JSON.stringify(batch);

    // sendBeacon is preferred on page unload — it fires even as the page closes.
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(this.opts.url, new Blob([payload], { type: "application/json" }));
      return;
    }

    try {
      await fetch(this.opts.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this.opts.headers },
        body: payload,
        keepalive: true,
      });
    } catch {
      // Transport errors must never surface to the application.
    }
  }

  /** Cancel the periodic flush timer and send any remaining entries. */
  destroy(): void {
    if (this.timer !== null) clearInterval(this.timer);
    void this.flush();
  }

  private scheduleFlush(): void {
    if (typeof setInterval === "undefined") return;
    this.timer = setInterval(() => void this.flush(), this.opts.flushInterval);
  }
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(readonly maxPerSecond: number) {
    this.tokens = maxPerSecond;
    this.lastRefill = Date.now();
  }

  /** Returns `true` if the caller should proceed; `false` if the entry should be dropped. */
  allow(): boolean {
    if (this.maxPerSecond <= 0) return true;
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1_000;
    this.tokens = Math.min(this.maxPerSecond, this.tokens + elapsed * this.maxPerSecond);
    this.lastRefill = now;
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    return false;
  }
}

// ─── Core Logger ──────────────────────────────────────────────────────────────

export class Logger {
  private level: LogLevel;
  private context: Record<string, unknown>;
  private transports: Transport[];
  private rateLimiter: RateLimiter;
  private onRateLimitDrop?: (message: string, level: LogLevel) => void;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? inferDefaultLevel();
    this.context = { ...options.context };
    this.transports = options.transports ?? [new ConsoleTransport()];
    this.rateLimiter = new RateLimiter(options.rateLimit ?? 0);
    this.onRateLimitDrop = options.onRateLimitDrop;
  }

  // ── Configuration ──────────────────────────────────────────────────────────

  setLevel(level: LogLevel | LogLevelName): void {
    this.level = typeof level === "string" ? parseLevelName(level) : level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  isLevelEnabled(level: LogLevel): boolean {
    return level <= this.level;
  }

  /** Merges additional fields into this logger's base context in-place. */
  setContext(extra: Record<string, unknown>): void {
    Object.assign(this.context, extra);
  }

  addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  removeTransport(transport: Transport): void {
    this.transports = this.transports.filter((t) => t !== transport);
  }

  // ── Child loggers ──────────────────────────────────────────────────────────

  /**
   * Creates a child logger that inherits this logger's level and transports,
   * and automatically includes `childContext` in every log entry it produces.
   * Transport additions on the parent are reflected in existing children
   * (transports are shared by reference).
   *
   * @example
   * const reqLog = logger.child({ requestId: "abc-123", userId: 42 });
   * reqLog.info("Request started"); // context includes requestId + userId
   */
  child(childContext: Record<string, unknown>): Logger {
    return new Logger({
      level: this.level,
      context: { ...this.context, ...childContext },
      transports: this.transports, // shared reference — parent transport changes propagate
      rateLimit: this.rateLimiter.maxPerSecond,
      onRateLimitDrop: this.onRateLimitDrop,
    });
  }

  // ── Core emit ──────────────────────────────────────────────────────────────

  private emit(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: unknown,
  ): void {
    if (level > this.level || level === LogLevel.SILENT) return;
    if (!this.rateLimiter.allow()) {
      this.onRateLimitDrop?.(message, level);
      return;
    }

    const entry: LogEntry = {
      level,
      levelName: LEVEL_NAMES[level],
      message,
      timestamp: new Date().toISOString(),
      context: context ? { ...this.context, ...context } : { ...this.context },
      ...(error != null ? { error: serializeError(error) } : {}),
    };

    for (const transport of this.transports) {
      try {
        transport.log(entry);
      } catch {
        // Transports must never crash the application.
      }
    }
  }

  // ── Public log methods ─────────────────────────────────────────────────────

  /**
   * `error(msg, context?, error?)` — structured context and/or an Error object.
   * `error(msg, error?)` — shorthand when there is no extra context.
   */
  error(message: string, contextOrError?: Record<string, unknown> | unknown, error?: unknown): void {
    if (contextOrError instanceof Error || (contextOrError != null && typeof contextOrError !== "object")) {
      this.emit(LogLevel.ERROR, message, undefined, contextOrError);
    } else {
      this.emit(LogLevel.ERROR, message, contextOrError as Record<string, unknown>, error);
    }
  }

  /**
   * `warn(msg, context?, error?)` — same overload pattern as `error`.
   */
  warn(message: string, contextOrError?: Record<string, unknown> | unknown, error?: unknown): void {
    if (contextOrError instanceof Error || (contextOrError != null && typeof contextOrError !== "object")) {
      this.emit(LogLevel.WARN, message, undefined, contextOrError);
    } else {
      this.emit(LogLevel.WARN, message, contextOrError as Record<string, unknown>, error);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.DEBUG, message, context);
  }

  trace(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.TRACE, message, context);
  }

  // ── Utility methods ────────────────────────────────────────────────────────

  /**
   * Wraps an async operation and logs its duration automatically.
   * Emits INFO on success, ERROR (and re-throws) on failure.
   *
   * @example
   * const user = await logger.measure("db.users.find", () => db.find({ id }), { id });
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      this.emit(LogLevel.INFO, label, {
        ...context,
        durationMs: Math.round(performance.now() - start),
      });
      return result;
    } catch (err) {
      this.emit(
        LogLevel.ERROR,
        label,
        { ...context, durationMs: Math.round(performance.now() - start) },
        err,
      );
      throw err;
    }
  }

  /** Log a completed HTTP request with standard structured fields. */
  apiRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    extra?: Record<string, unknown>,
  ): void {
    const level =
      statusCode >= 500 ? LogLevel.ERROR
      : statusCode >= 400 ? LogLevel.WARN
      : LogLevel.INFO;
    this.emit(level, `${method} ${path}`, { statusCode, durationMs, ...extra });
  }

  /** Log a completed AI/LLM call with standard structured fields. */
  aiOperation(
    operation: string,
    durationMs: number,
    extra?: { tokens?: number; model?: string; [k: string]: unknown },
  ): void {
    this.emit(LogLevel.INFO, `ai:${operation}`, { durationMs, ...extra });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /** Flush all transports. Call before page unload if not using `RemoteTransport`. */
  async flush(): Promise<void> {
    await Promise.allSettled(this.transports.map((t) => t.flush?.()));
  }
}

// ─── Environment default ──────────────────────────────────────────────────────

function inferDefaultLevel(): LogLevel {
  if (typeof process !== "undefined") {
    const { NODE_ENV } = process.env;
    if (NODE_ENV === "test") return LogLevel.SILENT;
    if (NODE_ENV === "production") return LogLevel.WARN;
  }
  return LogLevel.DEBUG; // development / unknown
}

// ─── Factory & singleton ──────────────────────────────────────────────────────

/** Preferred way to create a Logger instance. Identical to `new Logger(options)`. */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}

/** Module-level singleton for quick usage without manual instantiation. */
export const logger = createLogger();