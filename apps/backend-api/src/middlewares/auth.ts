import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export function requireClientAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || (req.body && req.body.token) || req.query.token;
    if (!auth) return res.status(401).json({ success: false, error: { message: 'Missing token' } });
    const token = String(auth).startsWith('Bearer ') ? String(auth).slice(7) : String(auth);
    const payload = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as any;
    // attach to req.user per project types
    req.user = { ...payload, token };
    return next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: { message: 'Invalid token', details: err?.message } });
  }
}
