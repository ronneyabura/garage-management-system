import { Router } from 'express';
import { getAll, getById, create, update, remove, adjustStock, getLowStock, getSummary } from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/summary', getSummary);
router.get('/low-stock', getLowStock);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authorize('ADMIN', 'WORKSHOP_STAFF'), create);
router.put('/:id', authorize('ADMIN', 'WORKSHOP_STAFF'), update);
router.delete('/:id', authorize('ADMIN'), remove);
router.post('/:id/adjust', authorize('ADMIN', 'WORKSHOP_STAFF'), adjustStock);

export default router;