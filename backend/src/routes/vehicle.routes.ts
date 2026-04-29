import { Router } from 'express';
import { getAll, getById, create, update, remove, getServiceHistory, getDowntimeStats } from '../controllers/vehicle.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/service-history', getServiceHistory);
router.get('/:id/downtime', getDowntimeStats);
router.post('/', authorize('ADMIN', 'WORKSHOP_STAFF'), create);
router.put('/:id', authorize('ADMIN', 'WORKSHOP_STAFF'), update);
router.delete('/:id', authorize('ADMIN'), remove);

export default router;