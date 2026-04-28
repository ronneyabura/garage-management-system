import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalVehicles, vehiclesByStatus, activeJobCards, jobCardsByStatus,
      completedThisMonth, totalParts, lowStockParts, recentJobCards
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.groupBy({ by: ['status'], _count: true }),
      prisma.jobCard.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
      prisma.jobCard.groupBy({ by: ['status'], _count: true }),
      prisma.jobCard.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: new Date(new Date().setDate(1)) },
        },
      }),
      prisma.part.count(),
      prisma.part.count({ where: { quantity: { lte: 5 } } }),
      prisma.jobCard.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: { select: { plateNumber: true, make: true, model: true } },
          technician: { select: { name: true } },
        },
      }),
    ]);

    // Monthly repair trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await prisma.jobCard.groupBy({
      by: ['status'],
      where: { createdAt: { gte: sixMonthsAgo } },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        totalVehicles,
        vehiclesByStatus: Object.fromEntries(vehiclesByStatus.map(v => [v.status, v._count])),
        activeJobCards,
        jobCardsByStatus: Object.fromEntries(jobCardsByStatus.map(j => [j.status, j._count])),
        completedThisMonth,
        totalParts,
        lowStockParts,
        recentJobCards,
        monthlyTrends,
      },
    });
  } catch (err) { next(err); }
};

export const getMaintenanceCostReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query as any;
    const where: any = { status: 'COMPLETED' };
    if (startDate) where.completedAt = { gte: new Date(startDate) };
    if (endDate) where.completedAt = { ...where.completedAt, lte: new Date(endDate) };

    const jobCards = await prisma.jobCard.findMany({
      where,
      include: {
        vehicle: { select: { plateNumber: true, make: true, model: true } },
        repairs: { include: { parts: { include: { part: { select: { name: true } } } } } },
      },
    });

    const report = jobCards.map(jc => ({
      jobNumber: jc.jobNumber,
      vehicle: `${jc.vehicle.make} ${jc.vehicle.model} (${jc.vehicle.plateNumber})`,
      completedAt: jc.completedAt,
      laborCost: jc.repairs.reduce((s, r) => s + r.laborCost, 0),
      partsCost: jc.repairs.reduce((s, r) => s + r.parts.reduce((ps, p) => ps + p.unitCost * p.quantity, 0), 0),
      totalCost: jc.actualCost || 0,
    }));

    const totalCost = report.reduce((s, r) => s + r.totalCost, 0);
    res.json({ success: true, data: report, summary: { totalJobs: report.length, totalCost } });
  } catch (err) { next(err); }
};

export const getRepairFrequencyReport = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { _count: { select: { jobCards: true } } },
      orderBy: { jobCards: { _count: 'desc' } },
    });

    res.json({
      success: true,
      data: vehicles.map(v => ({
        id: v.id,
        plateNumber: v.plateNumber,
        make: v.make,
        model: v.model,
        totalRepairs: v._count.jobCards,
        status: v.status,
      })),
    });
  } catch (err) { next(err); }
};

export const getPartsConsumptionReport = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const repairParts = await prisma.repairPart.groupBy({
      by: ['partId'],
      _sum: { quantity: true, unitCost: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
    });

    const partIds = repairParts.map(r => r.partId);
    const parts = await prisma.part.findMany({ where: { id: { in: partIds } } });
    const partMap = Object.fromEntries(parts.map(p => [p.id, p]));

    const report = repairParts.map(r => ({
      partId: r.partId,
      partName: partMap[r.partId]?.name || 'Unknown',
      totalUsed: r._sum.quantity || 0,
      totalCost: (r._sum.quantity || 0) * (partMap[r.partId]?.unitCost || 0),
      currentStock: partMap[r.partId]?.quantity || 0,
      usageCount: r._count,
    }));

    res.json({ success: true, data: report });
  } catch (err) { next(err); }
};
