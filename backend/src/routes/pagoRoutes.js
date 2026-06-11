const { Router } = require('express');
const router = Router();
const pagoController = require('../controllers/pagoController');
const { authenticate, authorize } = require('../middleware/auth');
const { pagoRules, handleValidationErrors } = require('../middleware/validator');

router.use(authenticate);

router.get('/', pagoController.getAll);
router.get('/medios-pago', pagoController.getMediosPago);
router.get('/resumen-municipios', authorize(1), pagoController.getResumenMunicipio);

router.post('/', authorize(1, 2, 3), pagoRules, handleValidationErrors, pagoController.create);

module.exports = router;
