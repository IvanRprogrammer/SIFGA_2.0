const { Router } = require('express');
const router = Router();
const reporteController = require('../controllers/reporteController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize(1));

router.get('/dashboard', reporteController.getDashboardStats);
router.get('/mensual', reporteController.getMonthlyReport);
router.get('/anual', reporteController.getAnnualReport);
router.get('/auditoria', reporteController.getAuditLog);

module.exports = router;
