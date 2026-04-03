/**
 * Rate limiting: uses Upstash Redis REST when UPSTASH_REDIS_REST_URL + TOKEN are set
 * (works across multiple instances / serverless). Otherwise fixed-window in-memory
 * (single Node process only).
 */

import { createHash } from "node:crypto";

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

type MemoryBucket = { count: number; resetAt: number };

const memoryStore = new Map<string, MemoryBucket>();
const MAX_MEMORY_KEYS = 20_000;

function pruneMemoryIfNeeded() {
  if (memoryStore.size < MAX_MEMORY_KEYS) return;
  const now = Date.now();
  for (const [k, b] of memoryStore) {
    if (now > b.resetAt) memoryStore.delete(k);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  pruneMemoryIfNeeded();
  const now = Date.now();
  const existing = memoryStore.get(key);
  if (!existing || now > existing.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { ok: true };
}

function redisKeyForWindow(compositeKey: string, windowMs: number): string {
  const bucket = Math.floor(Date.now() / windowMs);
  const h = createHash("sha256").update(compositeKey).digest("hex").slice(0, 32);
  return `rrb:rl:v1:${h}:${bucket}`;
}

type PipelineRow = { result?: unknown; error?: string };

async function upstashPipeline(
  base: string,
  token: string,
  commands: (string | number)[][],
): Promise<PipelineRow[] | null> {
  const res = await fetch(`${base}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return null;
  return data as PipelineRow[];
}

async function rateLimitUpstash(
  compositeKey: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const base = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const redisKey = redisKeyForWindow(compositeKey, windowMs);
  const ttlSec = Math.max(2, Math.ceil(windowMs / 1000) + 1);
  const now = Date.now();
  const windowEnd = (Math.floor(now / windowMs) + 1) * windowMs;
  const retryAfterSec = Math.max(1, Math.ceil((windowEnd - now) / 1000));

  try {
    const parts = await upstashPipeline(base, token, [
      ["INCR", redisKey],
      ["TTL", redisKey],
    ]);
    if (!parts || parts[0]?.error) {
      return rateLimitMemory(compositeKey, limit, windowMs);
    }

    const count = Number(parts[0]?.result ?? 0);
    const ttl = parts[1]?.result;

    if (ttl === -1) {
      await upstashPipeline(base, token, [["EXPIRE", redisKey, ttlSec]]);
    }

    if (count > limit) {
      return { ok: false, retryAfterSec };
    }
    return { ok: true };
  } catch {
    return rateLimitMemory(compositeKey, limit, windowMs);
  }
}

/**
 * @param compositeKey Stable id for this limiter (e.g. `review:post:user@x.com`).
 */
export async function rateLimit(
  compositeKey: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    return rateLimitUpstash(compositeKey, limit, windowMs);
  }
  return rateLimitMemory(compositeKey, limit, windowMs);
}
