type RateLimitEntry = { count: number; resetAt: number };
const limitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
): boolean {
    const now = Date.now();
    const entry = limitMap.get(key)

    if (!entry || now > entry.resetAt) {
        limitMap.set(key, { count: 1, resetAt: now + windowMs })
        return true
    }

    if (entry.resetAt >= maxRequests) {
        return false
    }

    entry.count++;
    return true
}