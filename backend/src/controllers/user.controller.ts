import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/apiResponse';

export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    sendSuccess(res, users);
  } catch (err) { next(err); }
};

export const getTechnicians = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const technicians = await prisma.user.findMany({
      where: { role: { in: ['WORKSHOP_STAFF', 'ADMIN'] }, isActive: true },
      select: { id: true, name: true, email: true, role: true },
    });
    sendSuccess(res, technicians);
  } catch (err) { next(err); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: req.body.isActive },
    });
    sendSuccess(res, user, 'User status updated');
  } catch (err) { next(err); }
};