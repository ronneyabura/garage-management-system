import { Router } from 'express';
import { getAll, getById, create, update, updateStatus, addRepair, getDashboardStats } from '../controllers/jobcard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authorize('ADMIN', 'WORKSHOP_STAFF'), create);
router.put('/:id', authorize('ADMIN', 'WORKSHOP_STAFF'), update);
router.patch('/:id/status', authorize('ADMIN', 'WORKSHOP_STAFF'), updateStatus);
router.post('/:id/repairs', authorize('ADMIN', 'WORKSHOP_STAFF'), addRepair);

export default router;