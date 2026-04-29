import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/apiResponse';

export const getMaintenanceCost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, vehicleId } = req.query as any;
    const where: any = { status: 'COMPLETED' };
    if (startDate) where.intakeDate = { gte: new Date(startDate) };
    if (endDate) where.completionDate = { lte: new Date(endDate) };
    if (vehicleId) where.vehicleId = vehicleId;

    const jobCards = await prisma.jobCard.findMany({
      where,
      include: { vehicle: { select: { plateNumber: true, make: true, model: true } } },
    });

    const byVehicle: any = {};
    jobCards.forEach(jc => {
      const key = jc.vehicleId;
      if (!byVehicle[key]) byVehicle[key] = { vehicle: jc.vehicle, totalCost: 0, repairCount: 0 };
      byVehicle[key].totalCost += jc.actualCost || 0;
      byVehicle[key].repairCount++;
    });

    sendSuccess(res, {
      summary: Object.values(byVehicle),
      totalCost: jobCards.reduce((s, jc) => s + (jc.actualCost || 0), 0),
      totalJobs: jobCards.length,
    });
  } catch (err) { next(err); }
};

export const getRepairFrequency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { months = 6 } = req.query as any;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    const jobCards = await prisma.jobCard.findMany({ where: { createdAt: { gte: startDate } } });

    const byMonth: any = {};
    jobCards.forEach(jc => {
      const month = jc.createdAt.toISOString().slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { month, total: 0, completed: 0, pending: 0 };
      byMonth[month].total++;
      if (jc.status === 'COMPLETED') byMonth[month].completed++;
      else byMonth[month].pending++;
    });

    sendSuccess(res, {
      monthlyTrend: Object.values(byMonth).sort((a: any, b: any) => a.month.localeCompare(b.month)),
      totalJobs: jobCards.length,
      completionRate: jobCards.length
        ? Math.round((jobCards.filter(j => j.status === 'COMPLETED').length / jobCards.length) * 100)
        : 0,
    });
  } catch (err) { next(err); }
};

export const getDowntime = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query as any;
    const where: any = { status: 'COMPLETED' };
    if (startDate) where.intakeDate = { gte: new Date(startDate) };
    if (endDate) where.completionDate = { lte: new Date(endDate) };

    const jobCards = await prisma.jobCard.findMany({
      where,
      include: { vehicle: { select: { plateNumber: true, make: true, model: true } } },
    });

    const byVehicle: any = {};
    jobCards.forEach(jc => {
      const key = jc.vehicleId;
      if (!byVehicle[key]) byVehicle[key] = { vehicle: jc.vehicle, totalDowntimeHours: 0, repairCount: 0 };
      if (jc.completionDate) {
        byVehicle[key].totalDowntimeHours += (jc.completionDate.getTime() - jc.intakeDate.getTime()) / (1000 * 60 * 60);
      }
      byVehicle[key].repairCount++;
    });

    const result = Object.values(byVehicle).map((v: any) => ({
      ...v,
      totalDowntimeHours: Math.round(v.totalDowntimeHours * 10) / 10,
      avgDowntimeHours: v.repairCount ? Math.round((v.totalDowntimeHours / v.repairCount) * 10) / 10 : 0,
    }));

    sendSuccess(res, {
      byVehicle: result,
      totalDowntimeHours: result.reduce((s: number, v: any) => s + v.totalDowntimeHours, 0),
    });
  } catch (err) { next(err); }
};

export const getPartsConsumption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 20 } = req.query as any;
    const repairParts = await prisma.repairPart.findMany({
      include: { part: { select: { name: true, category: true, unitCost: true } } },
    });

    const byPart: any = {};
    repairParts.forEach(rp => {
      if (!byPart[rp.partId]) byPart[rp.partId] = { part: rp.part, totalQuantity: 0, totalCost: 0, usageCount: 0 };
      byPart[rp.partId].totalQuantity += rp.quantity;
      byPart[rp.partId].totalCost += rp.totalCost;
      byPart[rp.partId].usageCount++;
    });

    sendSuccess(res, Object.values(byPart)
      .sort((a: any, b: any) => b.totalCost - a.totalCost)
      .slice(0, Number(limit)));
  } catch (err) { next(err); }
};