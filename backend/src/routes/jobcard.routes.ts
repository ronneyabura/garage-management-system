import { Router } from 'express';
import { getJobCards, getJobCard, createJobCard, updateJobCardStatus, updateJobCard, addRepair } from '../controllers/jobcard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getJobCards);
router.get('/:id', getJobCard);
router.post('/', authorize('ADMIN', 'WORKSHOP_STAFF'), createJobCard);
router.patch('/:id', authorize('ADMIN', 'WORKSHOP_STAFF'), updateJobCard);
router.patch('/:id/status', authorize('ADMIN', 'WORKSHOP_STAFF'), updateJobCardStatus);
router.post('/:id/repairs', authorize('ADMIN', 'WORKSHOP_STAFF'), addRepair);

export default router;
