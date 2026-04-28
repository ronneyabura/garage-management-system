import { Router } from 'express';
import { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, getVehicleHistory, getDowntimeStats } from '../controllers/vehicle.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getVehicles);
router.get('/downtime', getDowntimeStats);
router.get('/:id', getVehicle);
router.get('/:id/history', getVehicleHistory);
router.post('/', authorize('ADMIN', 'WORKSHOP_STAFF'), createVehicle);
router.patch('/:id', authorize('ADMIN', 'WORKSHOP_STAFF'), updateVehicle);
router.delete('/:id', authorize('ADMIN'), deleteVehicle);

export default router;
