import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/apiResponse';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { plateNumber: { contains: search, mode: 'insensitive' } },
      { make: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { assignedDriver: { contains: search, mode: 'insensitive' } },
    ];
    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.vehicle.count({ where }),
    ]);
    sendSuccess(res, vehicles, 'Vehicles fetched', 200, { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: { jobCards: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    sendSuccess(res, vehicle);
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plateNumber, make, model, year, color, vin, assignedDriver, status, mileage, fuelType } = req.body;
    const vehicle = await prisma.vehicle.create({
      data: { plateNumber, make, model, year: Number(year), color, vin, assignedDriver, status: status || 'AVAILABLE', mileage: Number(mileage) || 0, fuelType },
    });
    sendSuccess(res, vehicle, 'Vehicle created', 201);
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, vehicle, 'Vehicle updated');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Vehicle deleted');
  } catch (err) { next(err); }
};

export const getServiceHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await prisma.jobCard.findMany({
      where: { vehicleId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, history);
  } catch (err) { next(err); }
};

export const getDowntimeStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobCards = await prisma.jobCard.findMany({
      where: { vehicleId: req.params.id, status: 'COMPLETED' },
      select: { intakeDate: true, completionDate: true, actualCost: true },
    });
    const totalDowntime = jobCards.reduce((sum, jc) => {
      if (jc.completionDate) return sum + (jc.completionDate.getTime() - jc.intakeDate.getTime()) / (1000 * 60 * 60);
      return sum;
    }, 0);
    sendSuccess(res, {
      totalRepairs: jobCards.length,
      totalDowntimeHours: Math.round(totalDowntime * 10) / 10,
      totalMaintenanceCost: jobCards.reduce((s, jc) => s + (jc.actualCost || 0), 0),
      averageRepairTime: jobCards.length ? Math.round((totalDowntime / jobCards.length) * 10) / 10 : 0,
    });
  } catch (err) { next(err); }
};