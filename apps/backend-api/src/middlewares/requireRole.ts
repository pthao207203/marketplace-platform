import type { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: Array<'shop' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role as any)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}
