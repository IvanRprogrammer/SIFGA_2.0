// ============================================================================
// modules/propuestas.js - GESTIÓN CENTRAL DE PROPUESTAS
// Este módulo maneja toda la lógica de propuestas de clientes
// Es utilizado tanto por Vendedor (crear) como por Administrador (aprobar/rechazar)
// ============================================================================

import { getData, saveData } from "../data.js";
import { mostrarMensaje } from "../utils.js";
import { crearCliente } from "../clientes.js";
import { crearUsuario } from "../usuarios.js";

// Estados posibles de una propuesta
export const ESTADO_PROPUESTA = {
  PENDIENTE: "PENDIENTE",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
};

// Crear nueva propuesta (usado por Vendedor)
export function crearPropuesta(vendedorId, datosPropuesta) {
  const data = getData();

  // Validar que no exista un cliente con la misma cédula o contador
  const clienteExistente = data.clientes.find(
    (c) => c.cedula === datosPropuesta.cedula,
  );
  if (clienteExistente) {
    return { success: false, message: "Ya existe un cliente con esa cédula" };
  }

  const contadorExistente = data.clientes.find(
    (c) => c.contador === datosPropuesta.numeroContador,
  );
  if (contadorExistente) {
    return {
      success: false,
      message: "Ya existe un cliente con ese número de contador",
    };
  }

  const nuevaPropuesta = {
    id: Date.now(), // ID único basado en timestamp
    vendedorId: vendedorId,
    vendedorNombre: getVendedorNombre(vendedorId),
    fechaPropuesta: new Date().toISOString().split("T")[0],
    fechaPropuestaCompleta: new Date().toLocaleString(),
    nombre: datosPropuesta.nombre,
    cedula: datosPropuesta.cedula,
    direccion: datosPropuesta.direccion,
    numeroContador: datosPropuesta.numeroContador,
    ciudad: datosPropuesta.ciudad,
    region: datosPropuesta.region,
    estrato: datosPropuesta.estrato || "3",
    email: datosPropuesta.email,
    telefono: datosPropuesta.telefono,
    estado: ESTADO_PROPUESTA.PENDIENTE,
    observaciones: null,
    fechaGestion: null,
  };

  if (!data.propuestasClientes) data.propuestasClientes = [];
  data.propuestasClientes.push(nuevaPropuesta);
  saveData();

  // Disparar evento personalizado para notificar al sistema
  const event = new CustomEvent("propuestaCreada", { detail: nuevaPropuesta });
  document.dispatchEvent(event);

  return {
    success: true,
    message: "Propuesta enviada al administrador",
    propuesta: nuevaPropuesta,
  };
}

// Obtener nombre del vendedor por ID
function getVendedorNombre(vendedorId) {
  const data = getData();
  const vendedor = data.usuariosSistema.find(
    (u) => u.id === vendedorId && u.rol === "vendedor",
  );
  return vendedor ? vendedor.nombre : "Desconocido";
}

// Obtener todas las propuestas (usado por Administrador)
export function obtenerPropuestas(filtro = null) {
  const data = getData();
  let propuestas = data.propuestasClientes || [];

  if (filtro === "pendientes") {
    propuestas = propuestas.filter(
      (p) => p.estado === ESTADO_PROPUESTA.PENDIENTE,
    );
  } else if (filtro === "aprobadas") {
    propuestas = propuestas.filter(
      (p) => p.estado === ESTADO_PROPUESTA.APROBADA,
    );
  } else if (filtro === "rechazadas") {
    propuestas = propuestas.filter(
      (p) => p.estado === ESTADO_PROPUESTA.RECHAZADA,
    );
  }

  // Ordenar por fecha (más recientes primero)
  return propuestas.sort(
    (a, b) => new Date(b.fechaPropuesta) - new Date(a.fechaPropuesta),
  );
}

// Obtener propuestas por vendedor
export function obtenerPropuestasPorVendedor(vendedorId) {
  const data = getData();
  return (data.propuestasClientes || []).filter(
    (p) => p.vendedorId === vendedorId,
  );
}

// Aprobar propuesta (usado por Administrador)
export function aprobarPropuesta(
  propuestaId,
  contrasenaAsignada = null,
  observaciones = null,
) {
  const data = getData();
  const propuestaIndex = data.propuestasClientes.findIndex(
    (p) => p.id === propuestaId,
  );

  if (propuestaIndex === -1) {
    return { success: false, message: "Propuesta no encontrada" };
  }

  const propuesta = data.propuestasClientes[propuestaIndex];

  if (propuesta.estado !== ESTADO_PROPUESTA.PENDIENTE) {
    return {
      success: false,
      message: `La propuesta ya fue ${propuesta.estado.toLowerCase()}`,
    };
  }

  const contrasena = contrasenaAsignada || "sifga2025";

  // Crear cliente
  const clienteResult = crearCliente({
    nombre: propuesta.nombre,
    cedula: propuesta.cedula,
    direccion: propuesta.direccion,
    contador: propuesta.numeroContador,
    ciudad: propuesta.ciudad,
    region: propuesta.region,
    estrato: propuesta.estrato,
    email: propuesta.email,
    telefono: propuesta.telefono,
  });

  if (!clienteResult.success) {
    return { success: false, message: clienteResult.message };
  }

  // Crear usuario para el cliente
  const usuarioResult = crearUsuario(
    propuesta.nombre,
    propuesta.email,
    "cliente",
    contrasena,
    {
      cedula: propuesta.cedula,
      contador: propuesta.numeroContador,
      direccion: propuesta.direccion,
      ciudad: propuesta.ciudad,
      region: propuesta.region,
      estrato: propuesta.estrato,
      telefono: propuesta.telefono,
    },
  );

  if (!usuarioResult.success) {
    return { success: false, message: usuarioResult.message };
  }

  // Actualizar propuesta
  propuesta.estado = ESTADO_PROPUESTA.APROBADA;
  propuesta.fechaGestion = new Date().toISOString().split("T")[0];
  propuesta.fechaGestionCompleta = new Date().toLocaleString();
  propuesta.observaciones = observaciones;
  propuesta.contrasenaAsignada = contrasena;
  propuesta.clienteId = clienteResult.cliente.id;
  propuesta.usuarioId = usuarioResult.usuario.id;

  saveData();

  // Disparar evento personalizado
  const event = new CustomEvent("propuestaAprobada", { detail: propuesta });
  document.dispatchEvent(event);

  return {
    success: true,
    message: `Cliente ${propuesta.nombre} aprobado. Credenciales: ${propuesta.email} / ${contrasena}`,
    cliente: clienteResult.cliente,
    usuario: usuarioResult.usuario,
    propuesta: propuesta,
  };
}

// Rechazar propuesta (usado por Administrador)
export function rechazarPropuesta(propuestaId, motivo = null) {
  const data = getData();
  const propuestaIndex = data.propuestasClientes.findIndex(
    (p) => p.id === propuestaId,
  );

  if (propuestaIndex === -1) {
    return { success: false, message: "Propuesta no encontrada" };
  }

  const propuesta = data.propuestasClientes[propuestaIndex];

  if (propuesta.estado !== ESTADO_PROPUESTA.PENDIENTE) {
    return {
      success: false,
      message: `La propuesta ya fue ${propuesta.estado.toLowerCase()}`,
    };
  }

  propuesta.estado = ESTADO_PROPUESTA.RECHAZADA;
  propuesta.fechaGestion = new Date().toISOString().split("T")[0];
  propuesta.fechaGestionCompleta = new Date().toLocaleString();
  propuesta.observaciones = motivo || "Rechazada por el administrador";

  saveData();

  // Disparar evento personalizado
  const event = new CustomEvent("propuestaRechazada", { detail: propuesta });
  document.dispatchEvent(event);

  return {
    success: true,
    message: `Propuesta de ${propuesta.nombre} rechazada`,
    propuesta: propuesta,
  };
}

// Eliminar propuesta (solo para limpieza)
export function eliminarPropuesta(propuestaId) {
  const data = getData();
  const index = data.propuestasClientes.findIndex((p) => p.id === propuestaId);

  if (index === -1) {
    return { success: false, message: "Propuesta no encontrada" };
  }

  data.propuestasClientes.splice(index, 1);
  saveData();

  return { success: true, message: "Propuesta eliminada" };
}

// Limpiar propuestas aprobadas y rechazadas (limpieza masiva)
export function limpiarPropuestasProcesadas() {
  const data = getData();
  const originalCount = data.propuestasClientes.length;
  data.propuestasClientes = data.propuestasClientes.filter(
    (p) => p.estado === ESTADO_PROPUESTA.PENDIENTE,
  );
  saveData();

  return {
    success: true,
    eliminadas: originalCount - data.propuestasClientes.length,
  };
}

// Obtener estadísticas de propuestas
export function obtenerEstadisticasPropuestas() {
  const data = getData();
  const propuestas = data.propuestasClientes || [];

  const pendientes = propuestas.filter(
    (p) => p.estado === ESTADO_PROPUESTA.PENDIENTE,
  ).length;
  const aprobadas = propuestas.filter(
    (p) => p.estado === ESTADO_PROPUESTA.APROBADA,
  ).length;
  const rechazadas = propuestas.filter(
    (p) => p.estado === ESTADO_PROPUESTA.RECHAZADA,
  ).length;

  // Propuestas por vendedor
  const porVendedor = {};
  for (let i = 0; i < propuestas.length; i++) {
    const p = propuestas[i];
    porVendedor[p.vendedorId] = (porVendedor[p.vendedorId] || 0) + 1;
  }

  return {
    total: propuestas.length,
    pendientes,
    aprobadas,
    rechazadas,
    porVendedor,
  };
}
