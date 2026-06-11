const { Router } = require('express');
const router = Router();
const clienteController = require('../controllers/clienteController');
const { authenticate, authorize } = require('../middleware/auth');
const { clienteRules, handleValidationErrors } = require('../middleware/validator');

router.use(authenticate);

router.get('/', clienteController.getAll);
router.get('/search', clienteController.search);
router.get('/municipios', clienteController.getMunicipios);
router.get('/estratos', clienteController.getEstratos);
router.get('/pendientes', authorize(1), clienteController.getPendingProposals);
router.get('/:id', clienteController.getById);

router.post('/', authorize(1, 2), clienteRules, handleValidationErrors, clienteController.create);
router.put('/:id', authorize(1, 2), clienteController.update);
router.put('/aprobar/:id', authorize(1), clienteController.approveProposal);
router.put('/rechazar/:id', authorize(1), clienteController.rejectProposal);

module.exports = router;
