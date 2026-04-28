import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { partNumber: { contains: search, mode: 'insensitive' } },
    ];
    if (category) where.category = category;
    const [parts, total] = await Promise.all([
      prisma.part.findMany({ where, skip, take: Number(limit), orderBy: { name: 'asc' } }),
      prisma.part.count({ where }),
    ]);
    const partsWithAlerts = parts.map(p => ({ ...p, isLowStock: p.quantity <= p.minimumStock }));
    sendSuccess(res, partsWithAlerts, 'Parts fetched', 200, { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const part = await prisma.part.findUnique({
      where: { id: req.params.id },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!part) throw new AppError('Part not found', 404);
    sendSuccess(res, { ...part, isLowStock: part.quantity <= part.minimumStock });
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partNumber, name, description, category, unitCost, quantity, minimumStock, unit, supplier, location } = req.body;
    const part = await prisma.part.create({
      data: { partNumber, name, description, category, unitCost: Number(unitCost), quantity: Number(quantity) || 0, minimumStock: Number(minimumStock) || 5, unit: unit || 'piece', supplier, location },
    });
    sendSuccess(res, part, 'Part created', 201);
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const part = await prisma.part.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, part, 'Part updated');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.part.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Part deleted');
  } catch (err) { next(err); }
};

export const adjustStock = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, quantity, reason, reference } = req.body;
    const part = await prisma.part.findUnique({ where: { id: req.params.id } });
    if (!part) throw new AppError('Part not found', 404);
    if (type === 'OUT' && part.quantity < quantity) throw new AppError(`Insufficient stock. Available: ${part.quantity}`, 400);
    const [transaction, updatedPart] = await prisma.$transaction([
      prisma.inventoryTransaction.create({ data: { partId: req.params.id, type, quantity: Number(quantity), reason, reference, performedBy: req.user?.name } }),
      prisma.part.update({ where: { id: req.params.id }, data: { quantity: type === 'IN' ? { increment: Number(quantity) } : { decrement: Number(quantity) } } }),
    ]);
    sendSuccess(res, { transaction, part: updatedPart }, 'Stock adjusted');
  } catch (err) { next(err); }
};

export const getLowStock = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const parts = await prisma.part.findMany({ orderBy: { quantity: 'asc' } });
    const lowStock = parts.filter(p => p.quantity <= p.minimumStock).map(p => ({ ...p, shortage: p.minimumStock - p.quantity }));
    sendSuccess(res, lowStock);
  } catch (err) { next(err); }
};

export const getSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const parts = await prisma.part.findMany();
    sendSuccess(res, {
      totalParts: parts.length,
      totalValue: Math.round(parts.reduce((s, p) => s + p.unitCost * p.quantity, 0) * 100) / 100,
      lowStockCount: parts.filter(p => p.quantity <= p.minimumStock).length,
      outOfStockCount: parts.filter(p => p.quantity === 0).length,
    });
  } catch (err) { next(err); }
};