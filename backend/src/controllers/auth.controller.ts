import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already registered', 409);
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'WORKSHOP_STAFF' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    sendSuccess(res, { user, token }, 'Registered successfully', 201);
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Invalid credentials', 401);
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const { password: _, ...userWithoutPassword } = user;
    sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (err) { next(err); }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('User not found', 404);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user!.userId }, data: { password: hashed } });
    sendSuccess(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};