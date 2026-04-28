import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// Simulated ERP integration endpoints
export const syncFromERP = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Simulate incoming job cards from ERP system
    const mockERPData = {
      jobCards: [
        { erpId: 'ERP-001', vehiclePlate: 'KDA 123A', description: 'Routine 10,000km service', priority: 'NORMAL' },
        { erpId: 'ERP-002', vehiclePlate: 'KDB 456B', description: 'Engine overheating complaint', priority: 'HIGH' },
      ],
      syncedAt: new Date().toISOString(),
      source: 'ERP_SYSTEM_V2',
    };

    res.json({
      success: true,
      message: 'ERP sync simulated successfully',
      data: mockERPData,
    });
  } catch (err) { next(err); }
};

export const syncInventoryFromExternal = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Simulate incoming inventory data from external system
    const parts = await prisma.part.findMany({ take: 5, select: { id: true, name: true, quantity: true, unitCost: true } });

    const mockInventorySync = {
      updatedParts: parts.map(p => ({ ...p, externalId: `EXT-${p.id.substring(0, 8)}`, syncStatus: 'synced' })),
      syncedAt: new Date().toISOString(),
      source: 'INVENTORY_SYSTEM_V1',
    };

    res.json({ success: true, message: 'Inventory sync simulated', data: mockInventorySync });
  } catch (err) { next(err); }
};

export const exportJobCardsToERP = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const completedJobs = await prisma.jobCard.findMany({
      where: { status: 'COMPLETED' },
      take: 10,
      include: { vehicle: { select: { plateNumber: true } } },
    });

    res.json({
      success: true,
      message: `${completedJobs.length} job cards exported to ERP (simulated)`,
      data: completedJobs.map(jc => ({
        erpRef: `ERP-${jc.jobNumber}`,
        jobNumber: jc.jobNumber,
        vehicle: jc.vehicle.plateNumber,
        cost: jc.actualCost,
        exported: true,
      })),
    });
  } catch (err) { next(err); }
};
