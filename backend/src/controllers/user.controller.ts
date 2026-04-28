import { Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getUsers = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, phone: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      role: z.enum(['ADMIN', 'WORKSHOP_STAFF', 'MANAGER']).optional(),
      active: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, phone: true, active: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const getTechnicians = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const techs = await prisma.user.findMany({
      where: { role: 'WORKSHOP_STAFF', active: true },
      select: { id: true, name: true, email: true, _count: { select: { assignedJobCards: true } } },
    });
    res.json({ success: true, data: techs });
  } catch (err) { next(err); }
};
