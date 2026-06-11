// ============================================================================
// modules/permisos.js - GESTIÓN DE PERMISOS DE VENDEDORES
// Administrador puede otorgar permisos a vendedores para modificar clientes
// ============================================================================

import { getData, saveData } from "../data.js";
import { mostrarMensaje } from "../utils.js";

// Otorgar permiso a un vendedor sobre un cliente
export function otorgarPermiso(
  vendedorId,
  clienteId,
  tipoPermiso,
  fechaExpiracion,
) {
  const data = getData();

  if (!data.permisosVendedores) data.permisosVendedores = [];

  // Verificar si ya existe un permiso activo
  const permisoExistente = data.permisosVendedores.find(
    (p) => p.vendedorId === vendedorId && p.clienteId === clienteId,
  );
  if (permisoExistente) {
    return {
      success: false,
      message: "Ya existe un permiso para este vendedor sobre este cliente",
    };
  }

  const nuevoPermiso = {
    id: data.permisosVendedores.length + 1,
    vendedorId,
    clienteId,
    permiso: tipoPermiso,
    fechaExpiracion,
    fechaOtorgamiento: new Date().toISOString().split("T")[0],
    activo: true,
  };

  data.permisosVendedores.push(nuevoPermiso);
  saveData();

  return {
    success: true,
    message: "Permiso otorgado exitosamente",
    permiso: nuevoPermiso,
  };
}

// Revocar permiso
export function revocarPermiso(permisoId) {
  const data = getData();
  if (!data.permisosVendedores)
    return { success: false, message: "No hay permisos" };

  const permisoIndex = data.permisosVendedores.findIndex(
    (p) => p.id === permisoId,
  );
  if (permisoIndex === -1) {
    return { success: false, message: "Permiso no encontrado" };
  }

  data.permisosVendedores.splice(permisoIndex, 1);
  saveData();

  return { success: true, message: "Permiso revocado exitosamente" };
}

// Obtener todos los permisos
export function obtenerPermisos() {
  const data = getData();
  return data.permisosVendedores || [];
}

// Obtener permisos de un vendedor
export function obtenerPermisosPorVendedor(vendedorId) {
  const data = getData();
  return (data.permisosVendedores || []).filter(
    (p) => p.vendedorId === vendedorId,
  );
}

// Obtener permisos de un cliente
export function obtenerPermisosPorCliente(clienteId) {
  const data = getData();
  return (data.permisosVendedores || []).filter(
    (p) => p.clienteId === clienteId,
  );
}

// Verificar si un vendedor tiene permiso sobre un cliente
export function tienePermiso(vendedorId, clienteId, tipoPermiso = null) {
  const data = getData();
  const permisos = data.permisosVendedores || [];

  const permiso = permisos.find(
    (p) => p.vendedorId === vendedorId && p.clienteId === clienteId,
  );

  if (!permiso) return false;

  // Verificar expiración
  if (new Date(permiso.fechaExpiracion) < new Date()) {
    return false;
  }

  if (tipoPermiso && permiso.permiso !== tipoPermiso) {
    return false;
  }

  return true;
}

// Obtener clientes que un vendedor puede modificar
export function obtenerClientesModificables(vendedorId) {
  const data = getData();
  const permisos = (data.permisosVendedores || []).filter(
    (p) => p.vendedorId === vendedorId && p.permiso === "modificar",
  );
  const clientesIds = permisos.map((p) => p.clienteId);

  return data.clientes.filter((c) => clientesIds.includes(c.id));
}

// Obtener clientes que un vendedor puede ver
export function obtenerClientesVisibles(vendedorId) {
  const data = getData();
  const permisos = (data.permisosVendedores || []).filter(
    (p) => p.vendedorId === vendedorId,
  );
  const clientesIds = permisos.map((p) => p.clienteId);

  return data.clientes.filter((c) => clientesIds.includes(c.id));
}

// Verificar y limpiar permisos expirados
export function limpiarPermisosExpirados() {
  const data = getData();
  if (!data.permisosVendedores) return 0;

  const hoy = new Date();
  const originales = data.permisosVendedores.length;
  data.permisosVendedores = data.permisosVendedores.filter(
    (p) => new Date(p.fechaExpiracion) >= hoy,
  );
  saveData();

  return originales - data.permisosVendedores.length;
}

// Obtener estadísticas de permisos
export function obtenerEstadisticasPermisos() {
  const data = getData();
  const permisos = data.permisosVendedores || [];

  const totalPermisos = permisos.length;
  const permisosModificar = permisos.filter(
    (p) => p.permiso === "modificar",
  ).length;
  const permisosVer = permisos.filter((p) => p.permiso === "ver").length;

  // Permisos por vendedor
  const porVendedor = {};
  for (let i = 0; i < permisos.length; i++) {
    const vId = permisos[i].vendedorId;
    porVendedor[vId] = (porVendedor[vId] || 0) + 1;
  }

  return {
    totalPermisos,
    permisosModificar,
    permisosVer,
    porVendedor,
  };
}
