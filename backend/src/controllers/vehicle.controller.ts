import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const vehicleSchema = z.object({
  plateNumber: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  vin: z.string().optional(),
  color: z.string().optional(),
  mileage: z.number().optional(),
  assignedDriver: z.string().optional(),
  fuelType: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['AVAILABLE', 'IN_SERVICE', 'UNDER_REPAIR', 'OUT_OF_SERVICE']).optional(),
});

export const getVehicles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { plateNumber: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { assignedDriver: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { jobCards: true } } },
      }),
      prisma.vehicle.count({ where }),
    ]);

    res.json({ success: true, data: vehicles, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

export const getVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        jobCards: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { technician: { select: { name: true } } },
        },
      },
    });
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
};

export const createVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = vehicleSchema.parse(req.body);
    const vehicle = await prisma.vehicle.create({ data });
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) { next(err); }
};

export const updateVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = vehicleSchema.partial().parse(req.body);
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
};

export const deleteVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) { next(err); }
};

export const getVehicleHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const jobCards = await prisma.jobCard.findMany({
      where: { vehicleId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        technician: { select: { name: true } },
        repairs: { include: { parts: { include: { part: true } } } },
        statusLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
    res.json({ success: true, data: jobCards });
  } catch (err) { next(err); }
};

export const getDowntimeStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        jobCards: {
          where: { status: 'COMPLETED' },
          select: { startedAt: true, completedAt: true, createdAt: true, status: true },
        },
      },
    });

    const stats = vehicles.map((v) => {
      const totalDowntimeMs = v.jobCards
        .filter((j) => j.startedAt && j.completedAt)
        .reduce((sum, j) => sum + (j.completedAt!.getTime() - j.startedAt!.getTime()), 0);
      const totalDowntimeDays = Math.round(totalDowntimeMs / (1000 * 60 * 60 * 24));
      return {
        id: v.id,
        plateNumber: v.plateNumber,
        make: v.make,
        model: v.model,
        totalRepairs: v.jobCards.length,
        totalDowntimeDays,
        status: v.status,
      };
    });

    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};
