const prisma = require('../config/prisma');

module.exports = {
  prisma,
  usuarios: prisma.usuarios,
  roles: prisma.roles,
  clientes: prisma.clientes,
  facturas: prisma.facturas,
  lecturas: prisma.lecturas,
  pagos: prisma.pagos,
  configuracion: prisma.configuracion,
  municipios: prisma.municipios,
  estratos: prisma.estratos,
  mediosPago: prisma.medios_pago,
  estadosFactura: prisma.estados_factura,
  estadosPropuesta: prisma.estados_propuesta,
  propuestasClientes: prisma.propuestas_clientes,
  permisosVendedores: prisma.permisos_vendedores,
  tarifasEspeciales: prisma.tarifas_especiales,
  tiposPermiso: prisma.tipos_permiso,
  consecutivosFactura: prisma.consecutivos_factura,
  auditoria: prisma.auditoria,
};
