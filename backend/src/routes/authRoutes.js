const { Router } = require('express');
const router = Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginRules, handleValidationErrors } = require('../middleware/validator');

router.post('/login', loginRules, handleValidationErrors, authController.login);
router.post('/register', authenticate, authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/profile', authenticate, authController.getProfile);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
