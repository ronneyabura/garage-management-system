import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth.middleware';

const generateJobNumber = () => {
  const d = new Date();
  return `JC-${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}-${Math.floor(Math.random()*9000)+1000}`;
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, vehicleId, search, priority } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (priority) where.priority = priority;
    if (search) where.OR = [
      { jobNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
    const [jobCards, total] = await Promise.all([
      prisma.jobCard.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          vehicle: { select: { id: true, plateNumber: true, make: true, model: true } },
          technician: { select: { id: true, name: true } },
        },
      }),
      prisma.jobCard.count({ where }),
    ]);
    sendSuccess(res, jobCards, 'Job cards fetched', 200, { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobCard = await prisma.jobCard.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        technician: { select: { id: true, name: true, email: true } },
        repairs: { include: { parts: { include: { part: true } } } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
      },
    });
    if (!jobCard) throw new AppError('Job card not found', 404);
    sendSuccess(res, jobCard);
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, technicianId, description, priority, estimatedCost, mileageAtService, notes } = req.body;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    const jobCard = await prisma.jobCard.create({
      data: {
        jobNumber: generateJobNumber(),
        vehicleId,
        technicianId: technicianId || null,
        description,
        priority: priority || 'NORMAL',
        estimatedCost: estimatedCost ? Number(estimatedCost) : null,
        mileageAtService: mileageAtService ? Number(mileageAtService) : null,
        notes,
        statusHistory: { create: { status: 'INTAKE', notes: 'Job card created', changedBy: req.user?.userId } },
      },
      include: {
        vehicle: { select: { id: true, plateNumber: true, make: true, model: true } },
        technician: { select: { id: true, name: true } },
      },
    });
    await prisma.vehicle.update({ where: { id: vehicleId }, data: { status: 'IN_SERVICE' } });
    sendSuccess(res, jobCard, 'Job card created', 201);
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobCard = await prisma.jobCard.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, jobCard, 'Job card updated');
  } catch (err) { next(err); }
};

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body;
    const jobCard = await prisma.jobCard.update({
      where: { id: req.params.id },
      data: {
        status,
        completionDate: status === 'COMPLETED' ? new Date() : undefined,
        statusHistory: { create: { status, notes, changedBy: req.user?.userId } },
      },
    });
    if (status === 'COMPLETED') await prisma.vehicle.update({ where: { id: jobCard.vehicleId }, data: { status: 'AVAILABLE' } });
    if (status === 'REPAIR') await prisma.vehicle.update({ where: { id: jobCard.vehicleId }, data: { status: 'UNDER_REPAIR' } });
    sendSuccess(res, jobCard, 'Status updated');
  } catch (err) { next(err); }
};

export const addRepair = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { description, laborCost, laborHours } = req.body;
    const repair = await prisma.repair.create({
      data: { jobCardId: req.params.id, description, laborCost: Number(laborCost) || 0, laborHours: Number(laborHours) || 0 },
      include: { parts: { include: { part: true } } },
    });
    sendSuccess(res, repair, 'Repair added', 201);
  } catch (err) { next(err); }
};

export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalVehicles, vehiclesByStatus, activeJobCards, completedToday, recentActivity] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.groupBy({ by: ['status'], _count: true }),
      prisma.jobCard.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
      prisma.jobCard.count({ where: { status: 'COMPLETED', completionDate: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      prisma.jobCard.findMany({ take: 5, orderBy: { updatedAt: 'desc' }, include: { vehicle: { select: { plateNumber: true } }, technician: { select: { name: true } } } }),
    ]);
    const statusMap = vehiclesByStatus.reduce((acc: any, item) => { acc[item.status] = item._count; return acc; }, {});
    sendSuccess(res, {
      totalVehicles,
      availableVehicles: statusMap.AVAILABLE || 0,
      inServiceVehicles: statusMap.IN_SERVICE || 0,
      underRepairVehicles: statusMap.UNDER_REPAIR || 0,
      outOfServiceVehicles: statusMap.OUT_OF_SERVICE || 0,
      activeJobCards,
      completedToday,
      delayedJobs: 0,
      recentActivity,
    });
  } catch (err) { next(err); }
};