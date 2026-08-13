import type { Request, Response, NextFunction } from 'express';

/**
 * Guard that allows the request to continue only when the authenticated
 * user's `role` claim is in the supplied allow-list. Must run AFTER
 * `authMiddleware`, otherwise `req.user` is undefined and we 401.
 *
 * Example:
 *   router.use(authMiddleware);
 *   router.put('/hospital', requireRole('admin'), controller.update);
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: missing user context' });
      return;
    }
    const userRole = String(user.role || '').toLowerCase();
    const allowed = allowedRoles.map((r) => r.toLowerCase());
    if (!userRole || !allowed.includes(userRole)) {
      res.status(403).json({ error: `Forbidden: requires role ${allowedRoles.join(' or ')}` });
      return;
    }
    next();
  };
};
