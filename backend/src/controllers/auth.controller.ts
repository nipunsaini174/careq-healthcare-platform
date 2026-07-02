import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authService } from '../services/auth.service.js';
import { prisma } from '../prisma/client.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_change_me';

export class AuthController {
  // Use arrow functions to auto-bind 'this' if needed, or stick to normal async methods and bind them in routes
  // The simplest way to preserve 'this' is to use arrow functions for methods passed to Express routers
  register = async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, role, hospitalId, phone, dob, gender, abhaId } = req.body;
      const data = await authService.signUp(email, password, fullName, role, hospitalId, { phone, dob, gender, abhaId });
      res.status(201).json({ message: 'User registered successfully', data });
    } catch (error: any) {
      console.error('Registration Error Details:', error);
      const errorMsg = typeof error === 'string' ? error : (error?.message || 'An unknown error occurred');
      res.status(400).json({ error: errorMsg });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const data = await authService.signIn(email, password);
      res.status(200).json({ message: 'Login successful', data });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      await authService.signOut();
      res.status(200).json({ message: 'Logout successful' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /api/auth/admin-dev-token
   *
   * Dev-only convenience endpoint. The hospital admin frontend currently
   * uses a mocked AuthContext (no login UI yet), so this endpoint issues
   * a real backend-signed JWT for the first admin in the DB. The token
   * shape is identical to a real login token so the rest of the system
   * (auth middleware, role guards, hospital scoping) runs unchanged.
   *
   * Gated by NODE_ENV — refuses outside of development to avoid handing
   * out admin tokens in production. Replace with a real admin login UI
   * before deploying.
   */
  adminDevToken = async (req: Request, res: Response) => {
    if ((process.env.NODE_ENV || 'development') === 'production') {
      res.status(404).json({ error: 'Not available' });
      return;
    }
    try {
      const admin = await prisma.users.findFirst({
        where: { role: 'admin', status: 'active' },
        orderBy: { user_id: 'asc' },
      });
      if (!admin) {
        res.status(404).json({ error: 'No active admin user found in the database' });
        return;
      }
      const token = jwt.sign(
        { userId: Number(admin.user_id), email: admin.email, role: admin.role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );
      const { password_hash: _, ...adminSafe } = admin;
      res.status(200).json({ data: { token, user: adminSafe } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

export const authController = new AuthController();
