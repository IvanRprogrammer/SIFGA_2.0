export const ROLES = {
  ADMIN: 1,
  VENDEDOR: 2,
  CLIENTE: 3,
};

export const ROLES_MAP = {
  1: 'administrador',
  2: 'vendedor',
  3: 'cliente',
};

export const ESTADOS_FACTURA = {
  PENDIENTE: 1,
  PAGADA: 2,
  EN_MORA: 3,
  ANULADA: 4,
};

export const ESTADOS_PROPUESTA = {
  PENDIENTE: 1,
  APROBADA: 2,
  RECHAZADA: 3,
};

export const ESTADOS_CLIENTE = {
  ACTIVO: 'activo',
  SUSPENDIDO: 'suspendido',
  INACTIVO: 'inactivo',
};

export const API_BASE = '/api';
