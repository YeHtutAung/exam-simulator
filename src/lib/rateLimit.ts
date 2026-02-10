type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

const globalRateMap: Map<string, RateLimitEntry> =
  (globalThis as { __rateLimitMap?: Map<string, RateLimitEntry> }).__rateLimitMap ??
  new Map<string, RateLimitEntry>();

if (!(globalThis as { __rateLimitMap?: Map<string, RateLimitEntry> }).__rateLimitMap) {
  (globalThis as { __rateLimitMap?: Map<string, RateLimitEntry> }).__rateLimitMap =
    globalRateMap;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = globalRateMap.get(key);
  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    globalRateMap.set(key, { count: 1, resetAt });
    return { ok: true, remaining: Math.max(0, limit - 1), resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  globalRateMap.set(key, existing);
  return { ok: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

type HeaderLike = Headers | Record<string, string | string[] | undefined> | null | undefined;

export function getClientIp(headers?: HeaderLike) {
  if (!headers) return "unknown";
  if (headers instanceof Headers) {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() || "unknown";
    }
    return headers.get("x-real-ip") ?? "unknown";
  }
  const forwarded = headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) {
    return forwarded[0]?.split(",")[0]?.trim() || "unknown";
  }
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  const realIp = headers["x-real-ip"];
  if (Array.isArray(realIp)) return realIp[0] ?? "unknown";
  return realIp ?? "unknown";
}
