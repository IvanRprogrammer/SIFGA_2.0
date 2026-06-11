const { Router } = require('express');
const router = Router();
const configController = require('../controllers/configController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', configController.getConfig);
router.put('/', authorize(1), configController.updateConfig);

router.get('/tarifas-especiales', authorize(1), configController.getSpecialRates);
router.post('/tarifas-especiales', authorize(1), configController.setSpecialRate);
router.delete('/tarifas-especiales/:clienteId', authorize(1), configController.deleteSpecialRate);

router.get('/permisos', authorize(1), configController.getPermissions);
router.post('/permisos', authorize(1), configController.setPermission);
router.delete('/permisos/:id', authorize(1), configController.revokePermission);

module.exports = router;
