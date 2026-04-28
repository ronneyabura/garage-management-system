import { Router } from 'express';
import { getUsers, updateUser, getTechnicians } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', authorize('ADMIN', 'MANAGER'), getUsers);
router.get('/technicians', getTechnicians);
router.patch('/:id', authorize('ADMIN'), updateUser);

export default router;
