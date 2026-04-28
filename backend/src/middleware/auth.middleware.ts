import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from './errorHandler';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; name: string };
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId, active: true },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) throw new AppError('User not found or inactive', 401);
    req.user = user;
    next();
  } catch (err) {
    if ((err as any).name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if ((err as any).name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    next(err);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Access denied: insufficient permissions', 403));
    }
    next();
  };
};
