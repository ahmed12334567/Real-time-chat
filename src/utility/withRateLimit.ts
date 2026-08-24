import type { AuthenticatedSocket } from '../middlewares/socketAuth.middleware.js';
import { checkRateLimit } from "../utility/socketRateLimiter.js";

export function withRateLimit(
    socket: AuthenticatedSocket,
    eventName: string,
    handler: (data: any) => Promise<any> | any,
    { max, windowMs }: { max: number; windowMs: number }
) {
    return async (data: any) => {
        const userId = socket.user?.id;
        const allowed = checkRateLimit(`${userId}:${eventName}`, max, windowMs);

        if (!allowed) {
            return socket.emit('error', { message: `Too many ${eventName} requests, slow down` });
        }

        return handler(data);
    };
}