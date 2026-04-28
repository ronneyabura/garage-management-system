import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateJobNumber } from '../utils/jobNumber';

const jobCardSchema = z.object({
  vehicleId: z.string().uuid(),
  technicianId: z.string().uuid().optional(),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  mileageIn: z.number().optional(),
  scheduledDate: z.string().optional(),
  estimatedCost: z.number().optional(),
});

const statusFlow: Record<string, string[]> = {
  INTAKE: ['DIAGNOSIS', 'CANCELLED'],
  DIAGNOSIS: ['REPAIR', 'CANCELLED'],
  REPAIR: ['TESTING', 'CANCELLED'],
  TESTING: ['COMPLETED', 'REPAIR'],
  COMPLETED: [],
  CANCELLED: [],
};

export const getJobCards = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, vehicleId, technicianId, page = '1', limit = '20', search } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (technicianId) where.technicianId = technicianId;
    if (search) {
      where.OR = [
        { jobNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { vehicle: { plateNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [jobCards, total] = await Promise.all([
      prisma.jobCard.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: { select: { plateNumber: true, make: true, model: true } },
          technician: { select: { name: true } },
          createdBy: { select: { name: true } },
          _count: { select: { repairs: true } },
        },
      }),
      prisma.jobCard.count({ where }),
    ]);

    res.json({ success: true, data: jobCards, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

export const getJobCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const jobCard = await prisma.jobCard.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        technician: { select: { id: true, name: true, email: true } },
        createdBy: { select: { name: true } },
        repairs: { include: { parts: { include: { part: true } } } },
        statusLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!jobCard) throw new AppError('Job card not found', 404);
    res.json({ success: true, data: jobCard });
  } catch (err) { next(err); }
};

export const createJobCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = jobCardSchema.parse(req.body);

    const jobCard = await prisma.$transaction(async (tx) => {
      const jc = await tx.jobCard.create({
        data: {
          ...data,
          jobNumber: generateJobNumber(),
          createdById: req.user!.id,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        },
        include: { vehicle: true, technician: { select: { name: true } } },
      });

      await tx.statusLog.create({ data: { jobCardId: jc.id, status: 'INTAKE', notes: 'Job card created' } });
      await tx.vehicle.update({ where: { id: data.vehicleId }, data: { status: 'IN_SERVICE' } });
      return jc;
    });

    res.status(201).json({ success: true, data: jobCard });
  } catch (err) { next(err); }
};

export const updateJobCardStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = z.object({
      status: z.enum(['INTAKE', 'DIAGNOSIS', 'REPAIR', 'TESTING', 'COMPLETED', 'CANCELLED']),
      notes: z.string().optional(),
    }).parse(req.body);

    const jobCard = await prisma.jobCard.findUnique({ where: { id: req.params.id } });
    if (!jobCard) throw new AppError('Job card not found', 404);

    const allowed = statusFlow[jobCard.status] || [];
    if (!allowed.includes(status)) {
      throw new AppError(`Cannot transition from ${jobCard.status} to ${status}`, 400);
    }

    const now = new Date();
    const updateData: any = { status };
    if (status === 'REPAIR' || status === 'DIAGNOSIS') updateData.startedAt = jobCard.startedAt || now;
    if (status === 'COMPLETED') {
      updateData.completedAt = now;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const jc = await tx.jobCard.update({ where: { id: req.params.id }, data: updateData });
      await tx.statusLog.create({ data: { jobCardId: jc.id, status, notes } });

      if (status === 'COMPLETED') {
        await tx.vehicle.update({ where: { id: jc.vehicleId }, data: { status: 'AVAILABLE' } });
      } else if (status === 'CANCELLED') {
        await tx.vehicle.update({ where: { id: jc.vehicleId }, data: { status: 'AVAILABLE' } });
      } else {
        await tx.vehicle.update({ where: { id: jc.vehicleId }, data: { status: 'UNDER_REPAIR' } });
      }
      return jc;
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

export const updateJobCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = jobCardSchema.partial().parse(req.body);
    const jc = await prisma.jobCard.update({
      where: { id: req.params.id },
      data: {
        ...data,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      },
    });
    res.json({ success: true, data: jc });
  } catch (err) { next(err); }
};

export const addRepair = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const repairSchema = z.object({
      description: z.string().min(1),
      laborCost: z.number().min(0).optional(),
      notes: z.string().optional(),
      parts: z.array(z.object({
        partId: z.string().uuid(),
        quantity: z.number().int().min(1),
        unitCost: z.number().min(0),
      })).optional(),
    });

    const data = repairSchema.parse(req.body);

    const repair = await prisma.$transaction(async (tx) => {
      const r = await tx.repair.create({
        data: { jobCardId: req.params.id, description: data.description, laborCost: data.laborCost || 0, notes: data.notes },
      });

      if (data.parts?.length) {
        for (const p of data.parts) {
          const part = await tx.part.findUnique({ where: { id: p.partId } });
          if (!part) throw new AppError(`Part ${p.partId} not found`, 404);
          if (part.quantity < p.quantity) throw new AppError(`Insufficient stock for ${part.name}`, 400);

          await tx.repairPart.create({ data: { repairId: r.id, partId: p.partId, quantity: p.quantity, unitCost: p.unitCost } });
          await tx.part.update({ where: { id: p.partId }, data: { quantity: { decrement: p.quantity } } });
          await tx.inventoryTransaction.create({
            data: { partId: p.partId, type: 'OUT', quantity: p.quantity, reference: req.params.id, notes: `Used in repair ${r.id}`, createdById: req.user!.id },
          });
        }
      }

      // Recalculate actual cost
      const allRepairs = await tx.repair.findMany({
        where: { jobCardId: req.params.id },
        include: { parts: true },
      });
      const actualCost = allRepairs.reduce((sum, rp) => {
        const partsCost = rp.parts.reduce((s, p) => s + p.unitCost * p.quantity, 0);
        return sum + rp.laborCost + partsCost;
      }, 0);
      await tx.jobCard.update({ where: { id: req.params.id }, data: { actualCost } });

      return r;
    });

    res.status(201).json({ success: true, data: repair });
  } catch (err) { next(err); }
};
