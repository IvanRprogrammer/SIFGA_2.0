const { Router } = require('express');
const router = Router();
const facturaController = require('../controllers/facturaController');
const { authenticate, authorize } = require('../middleware/auth');
const { facturaRules, handleValidationErrors } = require('../middleware/validator');

router.use(authenticate);

router.get('/', facturaController.getAll);
router.get('/estados', facturaController.getEstados);
router.get('/search', facturaController.search);
router.get('/:id', facturaController.getById);

router.post('/', authorize(1, 2), facturaRules, handleValidationErrors, facturaController.create);

module.exports = router;
