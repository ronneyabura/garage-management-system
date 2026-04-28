import { Router } from 'express';
import { syncFromERP, syncInventoryFromExternal, exportJobCardsToERP } from '../controllers/integration.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'MANAGER'));
router.post('/erp/sync', syncFromERP);
router.post('/inventory/sync', syncInventoryFromExternal);
router.post('/erp/export-jobs', exportJobCardsToERP);

export default router;
