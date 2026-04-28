import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const partSchema = z.object({
  partNumber: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  minQuantity: z.number().int().min(0).optional(),
  unitCost: z.number().min(0),
  unitPrice: z.number().min(0).optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
});

export const getParts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, lowStock, category, page = '1', limit = '20' } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (lowStock === 'true') {
      // Parts where quantity <= minQuantity
      where.quantity = { lte: prisma.part.fields.minQuantity };
    }
    if (category) where.category = category;

    const [parts, total] = await Promise.all([
      prisma.part.findMany({ where, skip, take: parseInt(limit), orderBy: { name: 'asc' } }),
      prisma.part.count({ where }),
    ]);

    // Apply lowStock filter manually if needed
    const filteredParts = lowStock === 'true' ? parts.filter(p => p.quantity <= p.minQuantity) : parts;

    res.json({ success: true, data: filteredParts, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

export const getLowStockParts = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parts = await prisma.part.findMany({ orderBy: { quantity: 'asc' } });
    const lowStock = parts.filter(p => p.quantity <= p.minQuantity);
    res.json({ success: true, data: lowStock, count: lowStock.length });
  } catch (err) { next(err); }
};

export const getPart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const part = await prisma.part.findUnique({
      where: { id: req.params.id },
      include: {
        inventoryTransactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { repairParts: true } },
      },
    });
    if (!part) throw new AppError('Part not found', 404);
    res.json({ success: true, data: part });
  } catch (err) { next(err); }
};

export const createPart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = partSchema.parse(req.body);
    const part = await prisma.part.create({ data });
    res.status(201).json({ success: true, data: part });
  } catch (err) { next(err); }
};

export const updatePart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = partSchema.partial().parse(req.body);
    const part = await prisma.part.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: part });
  } catch (err) { next(err); }
};

export const deletePart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.part.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Part deleted' });
  } catch (err) { next(err); }
};

export const addInventoryTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, quantity, reference, notes } = z.object({
      type: z.enum(['IN', 'OUT']),
      quantity: z.number().int().min(1),
      reference: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body);

    const part = await prisma.part.findUnique({ where: { id: req.params.id } });
    if (!part) throw new AppError('Part not found', 404);
    if (type === 'OUT' && part.quantity < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const t = await tx.inventoryTransaction.create({
        data: { partId: req.params.id, type, quantity, reference, notes, createdById: req.user!.id },
      });
      await tx.part.update({
        where: { id: req.params.id },
        data: { quantity: type === 'IN' ? { increment: quantity } : { decrement: quantity } },
      });
      return t;
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err) { next(err); }
};

export const getTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { partId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: transactions });
  } catch (err) { next(err); }
};
