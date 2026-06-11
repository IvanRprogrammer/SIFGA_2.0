const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { usuarioRules, handleValidationErrors } = require('../middleware/validator');

router.use(authenticate);
router.use(authorize(1));

router.get('/', userController.getAll);
router.get('/roles', userController.getRoles);
router.get('/:id', userController.getById);
router.post('/', usuarioRules, handleValidationErrors, userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.remove);
router.patch('/:id/toggle-status', userController.toggleStatus);
router.post('/:id/reset-password', userController.resetPassword);

module.exports = router;
