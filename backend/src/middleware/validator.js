const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: errors.array().map(e => ({ campo: e.path, mensaje: e.msg }))
    });
  }
  next();
};

const loginRules = [
  body('correo').isEmail().withMessage('Correo inválido'),
  body('contrasena').notEmpty().withMessage('Contraseña requerida')
];

const usuarioRules = [
  body('nombre').notEmpty().trim().isLength({ min: 2 }).withMessage('Nombre requerido (mín. 2 caracteres)'),
  body('correo').isEmail().withMessage('Correo inválido'),
  body('usuario').notEmpty().trim().isLength({ min: 3 }).withMessage('Usuario requerido (mín. 3 caracteres)'),
  body('contrasena').isLength({ min: 6 }).withMessage('Contraseña mín. 6 caracteres'),
  body('id_rol').isInt({ min: 1 }).withMessage('Rol requerido')
];

const clienteRules = [
  body('nombres').notEmpty().trim().isLength({ min: 2 }).withMessage('Nombres requeridos'),
  body('apellidos').notEmpty().trim().isLength({ min: 2 }).withMessage('Apellidos requeridos'),
  body('cedula').notEmpty().trim().withMessage('Cédula requerida'),
  body('numero_contador').notEmpty().trim().withMessage('Número de contador requerido')
];

const lecturaRules = [
  body('id_cliente').isInt({ min: 1 }).withMessage('Cliente requerido'),
  body('lectura_actual').isFloat({ min: 0 }).withMessage('Lectura actual inválida'),
  body('fecha_lectura').isDate().withMessage('Fecha de lectura inválida')
];

const facturaRules = [
  body('id_cliente').isInt({ min: 1 }).withMessage('Cliente requerido'),
  body('periodo').notEmpty().trim().withMessage('Periodo requerido'),
  body('fecha_vencimiento').isDate().withMessage('Fecha de vencimiento inválida')
];

const pagoRules = [
  body('id_factura').isInt({ min: 1 }).withMessage('Factura requerida'),
  body('id_medio_pago').isInt({ min: 1 }).withMessage('Medio de pago requerido'),
  body('valor').isFloat({ min: 1 }).withMessage('Valor debe ser mayor a 0'),
  body('fecha_pago').isDate().withMessage('Fecha de pago inválida')
];

module.exports = {
  handleValidationErrors,
  loginRules,
  usuarioRules,
  clienteRules,
  lecturaRules,
  facturaRules,
  pagoRules
};
