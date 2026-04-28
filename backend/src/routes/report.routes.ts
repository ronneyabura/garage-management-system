import { Router } from 'express';
import { getDashboardStats, getMaintenanceCostReport, getRepairFrequencyReport, getPartsConsumptionReport } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/dashboard', getDashboardStats);
router.get('/maintenance-cost', getMaintenanceCostReport);
router.get('/repair-frequency', getRepairFrequencyReport);
router.get('/parts-consumption', getPartsConsumptionReport);

export default router;
