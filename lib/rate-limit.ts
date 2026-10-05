type RateLimitInfo = {
  count: number
  lastRequestTime: number
}

// In-memory cache for rate limiting (Note: In serverless this resets per instance, but still mitigates basic DoS)
const rateLimitCache = new Map<string, RateLimitInfo>()

/**
 * Checks if the given IP has exceeded the rate limit.
 * @param ip Client IP address
 * @param limit Maximum number of requests allowed
 * @param windowMs Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitCache.get(ip)

  if (!record) {
    rateLimitCache.set(ip, { count: 1, lastRequestTime: now })
    return true
  }

  // If the time window has passed, reset the count
  if (now - record.lastRequestTime > windowMs) {
    rateLimitCache.set(ip, { count: 1, lastRequestTime: now })
    return true
  }

  // If within the window, check the count
  if (record.count >= limit) {
    return false // Rate limit exceeded
  }

  // Increment count
  record.count += 1
  rateLimitCache.set(ip, record)
  return true
}

// Cleanup function to prevent memory leaks (runs every minute)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, record] of rateLimitCache.entries()) {
      if (now - record.lastRequestTime > 3600000) { // Clear records older than 1 hour
        rateLimitCache.delete(ip)
      }
    }
  }, 60000)
}
