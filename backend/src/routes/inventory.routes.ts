import { Router } from 'express';
import { getParts, getLowStockParts, getPart, createPart, updatePart, deletePart, addInventoryTransaction, getTransactions } from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getParts);
router.get('/low-stock', getLowStockParts);
router.get('/:id', getPart);
router.get('/:id/transactions', getTransactions);
router.post('/', authorize('ADMIN', 'WORKSHOP_STAFF'), createPart);
router.patch('/:id', authorize('ADMIN', 'WORKSHOP_STAFF'), updatePart);
router.delete('/:id', authorize('ADMIN'), deletePart);
router.post('/:id/transactions', authorize('ADMIN', 'WORKSHOP_STAFF'), addInventoryTransaction);

export default router;
