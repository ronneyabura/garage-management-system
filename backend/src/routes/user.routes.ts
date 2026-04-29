import { Router } from 'express';
import { getAll, getTechnicians, updateStatus } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), getAll);
router.get('/technicians', getTechnicians);
router.put('/:id/status', authorize('ADMIN'), updateStatus);

export default router;