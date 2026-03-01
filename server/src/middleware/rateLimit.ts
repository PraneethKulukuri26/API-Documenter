const rateLimits = new Map<string, { count: number; windowStart: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

export function rateLimit(token: string): void {
    const now = Date.now();
    const limit = rateLimits.get(token);

    if (!limit || now - limit.windowStart > WINDOW_MS) {
        rateLimits.set(token, { count: 1, windowStart: now });
        return;
    }

    if (limit.count >= MAX_REQUESTS) {
        throw new Error('Too many requests. Please try again later.');
    }

    limit.count++;
}
