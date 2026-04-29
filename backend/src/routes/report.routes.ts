import { Router } from 'express';
import { getMaintenanceCost, getRepairFrequency, getDowntime, getPartsConsumption } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'MANAGER'));

router.get('/maintenance-cost', getMaintenanceCost);
router.get('/repair-frequency', getRepairFrequency);
router.get('/downtime', getDowntime);
router.get('/parts-consumption', getPartsConsumption);

export default router;