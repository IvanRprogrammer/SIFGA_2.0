const { Router } = require('express');
const router = Router();
const lecturaController = require('../controllers/lecturaController');
const { authenticate, authorize } = require('../middleware/auth');
const { lecturaRules, handleValidationErrors } = require('../middleware/validator');

router.use(authenticate);

router.get('/', lecturaController.getAll);
router.get('/:id', lecturaController.getById);
router.get('/cliente/:clienteId/historial', lecturaController.getHistorialByCliente);

router.post('/', authorize(1, 2), lecturaRules, handleValidationErrors, lecturaController.create);

module.exports = router;
