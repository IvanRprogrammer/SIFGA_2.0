// ============================================================================
// recaudos.js - GESTIÓN DE RECAUDOS Y PAGOS
// Registrar pagos, consultar recaudos, eliminar recaudos erróneos
// ============================================================================

import { getData, saveData } from "./data.js";
import { mostrarMensaje, formatMoney } from "./utils.js";

// Registrar un nuevo pago/recaudo
export function registrarRecaudo(
  clienteId,
  monto,
  metodoPago,
  facturaReferencia = null,
) {
  const data = getData();
  const cliente = data.clientes.find((c) => c.id === clienteId);

  if (!cliente) {
    return { success: false, message: "Cliente no encontrado" };
  }

  const nuevoRecaudo = {
    id: data.recaudos.length + 5001,
    cliente: cliente.nombre,
    clienteId: clienteId,
    monto: monto,
    fecha: new Date().toISOString().split("T")[0],
    tipo: `Pago - ${metodoPago}`,
    municipio: cliente.ciudad || "No especificado",
    facturaReferencia: facturaReferencia,
    hora: new Date().toLocaleTimeString(),
  };

  data.recaudos.push(nuevoRecaudo);

  // Actualizar deuda del cliente
  if (facturaReferencia) {
    const factura = data.facturas.find(
      (f) => f.numeroFactura === facturaReferencia,
    );
    if (factura) {
      factura.estado = "Pagada";
      cliente.deuda = Math.max(0, (cliente.deuda || 0) - monto);
    }
  }

  saveData();
  return {
    success: true,
    message: "Recaudo registrado exitosamente",
    recaudo: nuevoRecaudo,
  };
}

// Obtener todos los recaudos
export function obtenerRecaudos() {
  const data = getData();
  return [...data.recaudos].reverse();
}

// Obtener recaudos por cliente
export function obtenerRecaudosPorCliente(clienteId) {
  const data = getData();
  const cliente = data.clientes.find((c) => c.id === clienteId);
  if (!cliente) return [];
  return data.recaudos.filter((r) => r.clienteId === clienteId).reverse();
}

// Obtener recaudos por municipio
export function obtenerRecaudosPorMunicipio(municipio) {
  const data = getData();
  if (!municipio) return data.recaudos;
  return data.recaudos.filter((r) => r.municipio === municipio);
}

// Obtener recaudos por fecha
export function obtenerRecaudosPorFecha(fechaInicio, fechaFin) {
  const data = getData();
  return data.recaudos.filter(
    (r) => r.fecha >= fechaInicio && r.fecha <= fechaFin,
  );
}

// Obtener total de recaudos
export function obtenerTotalRecaudos(filtro = null) {
  const data = getData();
  let recaudos = data.recaudos;

  if (filtro && filtro.municipio) {
    recaudos = recaudos.filter((r) => r.municipio === filtro.municipio);
  }
  if (filtro && filtro.fechaInicio && filtro.fechaFin) {
    recaudos = recaudos.filter(
      (r) => r.fecha >= filtro.fechaInicio && r.fecha <= filtro.fechaFin,
    );
  }

  return recaudos.reduce((sum, r) => sum + (r.monto || 0), 0);
}

// Obtener resumen de recaudos por municipio
export function obtenerResumenPorMunicipio() {
  const data = getData();
  const municipios = [
    "Bogota",
    "Medellin",
    "Cali",
    "Barranquilla",
    "Cartagena",
  ];
  const totalGeneral = data.recaudos.reduce(
    (sum, r) => sum + (r.monto || 0),
    0,
  );

  const resumen = [];
  for (let i = 0; i < municipios.length; i++) {
    const m = municipios[i];
    const total = data.recaudos
      .filter((r) => r.municipio === m)
      .reduce((sum, r) => sum + (r.monto || 0), 0);
    const porcentaje =
      totalGeneral > 0 ? ((total / totalGeneral) * 100).toFixed(1) : 0;
    resumen.push({ municipio: m, total, porcentaje });
  }

  return resumen;
}

// Obtener resumen de recaudos por mes
export function obtenerResumenPorMes(anio) {
  const data = getData();
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const resumen = [];

  for (let i = 1; i <= 12; i++) {
    const mesStr = i < 10 ? `0${i}` : `${i}`;
    const recaudosMes = data.recaudos.filter((r) =>
      r.fecha.startsWith(`${anio}-${mesStr}`),
    );
    const total = recaudosMes.reduce((sum, r) => sum + (r.monto || 0), 0);
    const cantidad = recaudosMes.length;
    resumen.push({ mes: meses[i - 1], total, cantidad });
  }

  return resumen;
}

// Eliminar recaudo (solo para errores)
export function eliminarRecaudo(id, motivo = "Error en registro") {
  const data = getData();
  const recaudoIndex = data.recaudos.findIndex((r) => r.id === id);

  if (recaudoIndex === -1) {
    return { success: false, message: "Recaudo no encontrado" };
  }

  const recaudoEliminado = data.recaudos[recaudoIndex];
  data.recaudos.splice(recaudoIndex, 1);
  saveData();

  // Registrar auditoría (opcional)
  console.log(
    `Recaudo ${id} eliminado - Motivo: ${motivo} - Usuario: ${localStorage.getItem("sifga_user")}`,
  );

  return {
    success: true,
    message: `Recaudo de ${formatMoney(recaudoEliminado.monto)} eliminado`,
    recaudo: recaudoEliminado,
  };
}

// Generar reporte de recaudos
export function generarReporteRecaudos(tipo, periodo) {
  const data = getData();

  if (tipo === "mensual") {
    const recaudosMes = data.recaudos.filter((r) =>
      r.fecha.startsWith(periodo),
    );
    const total = recaudosMes.reduce((sum, r) => sum + (r.monto || 0), 0);
    return { recaudos: recaudosMes, total, periodo };
  } else if (tipo === "anual") {
    const year = periodo.split("-")[0];
    const recaudosAnio = data.recaudos.filter((r) => r.fecha.startsWith(year));
    const total = recaudosAnio.reduce((sum, r) => sum + (r.monto || 0), 0);

    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    const porMes = [];

    for (let i = 1; i <= 12; i++) {
      const mesStr = i < 10 ? `0${i}` : `${i}`;
      const recaudosMes = data.recaudos.filter((r) =>
        r.fecha.startsWith(`${year}-${mesStr}`),
      );
      const totalMes = recaudosMes.reduce((sum, r) => sum + (r.monto || 0), 0);
      porMes.push({
        mes: meses[i - 1],
        total: totalMes,
        cantidad: recaudosMes.length,
      });
    }

    return { recaudos: recaudosAnio, total, porMes, year };
  }

  return { recaudos: [], total: 0 };
}
