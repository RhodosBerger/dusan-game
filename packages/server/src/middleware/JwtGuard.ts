// ────────────────────────────────────────────────────────────────────────────
// JwtGuard.ts — JWT issuance and Socket.io middleware
//
// Flow:
//   1. Client POSTs to /auth with username → receives signed JWT
//   2. Client passes JWT in socket.handshake.auth.token
//   3. jwtSocketMiddleware verifies the token before any game event fires
//
// Environment variable: JWT_SECRET (set in .env, NEVER commit the secret)
// ────────────────────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';

const JWT_SECRET  = process.env.JWT_SECRET  || 'dev-only-secret-CHANGE-IN-PROD';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '4h';

export interface JwtPayload {
    sub:      string;   // playerId
    username: string;
    iat?:     number;
}

// Extend Socket type to carry decoded player info
export interface AuthenticatedSocket extends Socket {
    playerId?: string;
    username?: string;
}

// ── Issuance ──────────────────────────────────────────────────────────────────
/**
 * Issue a signed JWT for a player.
 * Call this when a player successfully enters the lobby (POST /auth).
 */
export function issuePlayerToken(playerId: string, username: string): string {
    const payload: JwtPayload = { sub: playerId, username };
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES as any,
        algorithm: 'HS256',
    });
}

// ── Socket.io Middleware ──────────────────────────────────────────────────────
/**
 * Socket.io `use` middleware that validates the JWT on every new connection.
 *
 * Usage:
 *   io.use(jwtSocketMiddleware);
 *
 * If the token is missing or invalid, the connection is rejected with
 * an error code that the client can catch and redirect to /auth.
 */
export function jwtSocketMiddleware(
    socket: AuthenticatedSocket,
    next:   (err?: Error) => void,
): void {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
        console.warn(`[JWT] Connection rejected — no token. Socket: ${socket.id}`);
        return next(new Error('AUTH_MISSING_TOKEN'));
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
        socket.playerId = payload.sub;
        socket.username = payload.username;
        next();
    } catch (err) {
        const msg = err instanceof jwt.TokenExpiredError ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_INVALID_TOKEN';
        console.warn(`[JWT] Connection rejected (${msg}). Socket: ${socket.id}`);
        next(new Error(msg));
    }
}

// ── Server-Side Hex Range Validator ──────────────────────────────────────────
/**
 * Validates that a card play or move target hex is within the acting thread's reach.
 * Call this in the play_card and move_character handlers.
 *
 * Returns `true` if action is valid, `false` if it should be rejected.
 */
export function validateHexReach(
    fromCubeCoords: [number, number],
    toCubeCoords:   [number, number],
    reach:          number,
): boolean {
    const [fq, fr] = fromCubeCoords;
    const [tq, tr] = toCubeCoords;
    const fs = -fq - fr;
    const ts = -tq - tr;

    const dist = Math.max(
        Math.abs(fq - tq),
        Math.abs(fr - tr),
        Math.abs(fs - ts),
    );

    if (dist > reach) {
        console.warn(`[ANTI-CHEAT] Hex reach violation: dist=${dist}, allowed=${reach}`);
        return false;
    }
    return true;
}
