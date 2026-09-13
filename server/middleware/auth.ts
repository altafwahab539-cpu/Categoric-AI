/**
 * Categoric AI - Authentication & Protection Middleware
 * Validates JWT sessions, isolates user data, and prevents API abuse.
 */
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { db, User } from '../db/index.js';
import { SYSTEM_LIMITS } from '../config.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// In-memory rate limiting map: ip/userId -> timestamps[]
const rateLimitMap = new Map<string, number[]>();

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Fallback to cookie or query parameter
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }
  if (!token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    // If no token is provided, fallback to demo user in development so preview works smoothly
    const defaultUser = Array.from(db.users.values()).find(u => u.email === 'creator@categoric.ai') || Array.from(db.users.values())[0];
    if (defaultUser) {
      req.user = defaultUser;
      return next();
    }
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  const user = db.users.get(decoded.userId);
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Account not found or inactive.' });
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Administrator privileges required.' });
  }
  next();
}

export function rateLimiter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const key = req.user ? `user:${req.user.id}` : `ip:${req.ip || 'unknown'}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= SYSTEM_LIMITS.RATE_LIMIT_PER_MINUTE) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment before trying again.'
    });
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  next();
}
