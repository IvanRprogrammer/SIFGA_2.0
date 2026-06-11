// ============================================================================
// modules/reportes.js - GENERACIÓN DE REPORTES
// Reportes de facturación, ingresos, morosidad, etc.
// ============================================================================

import { getData } from "../data.js";
import { formatMoney } from "../utils.js";
import {
  obtenerResumenPorMes,
  obtenerResumenPorMunicipio,
} from "../recaudos.js";
import { obtenerEstadisticasClientes } from "../clientes.js";
import { obtenerEstadisticasUsuarios } from "../usuarios.js";

// Generar reporte de ingresos (mensual/anual)
export function generarReporteIngresos(tipo, periodo) {
  const data = getData();

  if (tipo === "mensual") {
    const recaudosMes = data.recaudos.filter((r) =>
      r.fecha.startsWith(periodo),
    );
    const total = recaudosMes.reduce((sum, r) => sum + (r.monto || 0), 0);

    return {
      tipo: "mensual",
      periodo,
      total,
      totalFormateado: formatMoney(total),
      cantidad: recaudosMes.length,
      recaudos: recaudosMes,
      fechaGeneracion: new Date().toLocaleString(),
    };
  } else if (tipo === "anual") {
    const year = periodo.split("-")[0];
    const porMes = obtenerResumenPorMes(year);
    const totalAnual = porMes.reduce((sum, m) => sum + m.total, 0);

    return {
      tipo: "anual",
      year,
      totalAnual,
      totalAnualFormateado: formatMoney(totalAnual),
      porMes,
      fechaGeneracion: new Date().toLocaleString(),
    };
  }

  return null;
}

// Generar reporte de morosidad
export function generarReporteMorosidad() {
  const data = getData();
  const clientes = data.clientes;
  const facturas = data.facturas;

  const clientesConMora = [];
  let totalMora = 0;

  for (let i = 0; i < clientes.length; i++) {
    const c = clientes[i];
    const facturasPendientes = facturas.filter(
      (f) => f.clienteId === c.id && f.estado === "Pendiente",
    );

    if (facturasPendientes.length > 0) {
      const deudaTotal = facturasPendientes.reduce(
        (sum, f) => sum + f.totalPagar,
        0,
      );
      const facturasVencidas = facturasPendientes.filter(
        (f) => new Date(f.fechaVencimiento) < new Date(),
      );
      const diasMora =
        facturasVencidas.length > 0
          ? Math.floor(
              (new Date() - new Date(facturasVencidas[0].fechaVencimiento)) /
                (1000 * 60 * 60 * 24),
            )
          : 0;

      clientesConMora.push({
        cliente: c,
        deuda: deudaTotal,
        deudaFormateada: formatMoney(deudaTotal),
        facturasPendientes: facturasPendientes.length,
        facturasVencidas: facturasVencidas.length,
        diasMora,
      });
      totalMora += deudaTotal;
    }
  }

  // Ordenar por mayor deuda
  clientesConMora.sort((a, b) => b.deuda - a.deuda);

  return {
    totalClientesEnMora: clientesConMora.length,
    totalDeudaMora: totalMora,
    totalDeudaMoraFormateado: formatMoney(totalMora),
    clientes: clientesConMora,
    fechaGeneracion: new Date().toLocaleString(),
  };
}

// Generar reporte de consumo por cliente
export function generarReporteConsumoCliente(clienteId) {
  const data = getData();
  const cliente = data.clientes.find((c) => c.id === clienteId);

  if (!cliente) return null;

  const facturasCliente = data.facturas
    .filter((f) => f.clienteId === clienteId)
    .sort((a, b) => new Date(a.fechaEmision) - new Date(b.fechaEmision));

  const historialConsumo = [];
  let totalConsumo = 0;
  let totalPagado = 0;

  for (let i = 0; i < facturasCliente.length; i++) {
    const f = facturasCliente[i];
    totalConsumo += f.consumoM3 || 0;
    if (f.estado === "Pagada") totalPagado += f.totalPagar;

    historialConsumo.push({
      periodo: f.periodo,
      lecturaAnterior: f.lecturaAnterior,
      lecturaActual: f.lecturaActual,
      consumoM3: f.consumoM3,
      totalPagar: f.totalPagar,
      totalPagarFormateado: formatMoney(f.totalPagar),
      estado: f.estado,
      fechaVencimiento: f.fechaVencimiento,
    });
  }

  const promedioConsumo =
    facturasCliente.length > 0 ? totalConsumo / facturasCliente.length : 0;

  return {
    cliente: {
      nombre: cliente.nombre,
      cedula: cliente.cedula,
      contador: cliente.contador,
      direccion: cliente.ubicacion,
      ciudad: cliente.ciudad,
      estrato: cliente.estrato,
    },
    historialConsumo,
    totalConsumo,
    promedioConsumo: promedioConsumo.toFixed(1),
    totalFacturas: facturasCliente.length,
    totalPagado,
    totalPagadoFormateado: formatMoney(totalPagado),
    fechaGeneracion: new Date().toLocaleString(),
  };
}

// Generar reporte de clientes por estrato
export function generarReportePorEstrato() {
  const data = getData();
  const clientes = data.clientes;
  const estratos = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const deudaPorEstrato = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (let i = 0; i < clientes.length; i++) {
    const c = clientes[i];
    const estrato = parseInt(c.estrato || 3);
    estratos[estrato] = (estratos[estrato] || 0) + 1;
    deudaPorEstrato[estrato] = (deudaPorEstrato[estrato] || 0) + (c.deuda || 0);
  }

  const resumen = [];
  for (let i = 1; i <= 6; i++) {
    resumen.push({
      estrato: i,
      cantidadClientes: estratos[i] || 0,
      deudaTotal: deudaPorEstrato[i] || 0,
      deudaFormateada: formatMoney(deudaPorEstrato[i] || 0),
    });
  }

  return {
    resumen,
    fechaGeneracion: new Date().toLocaleString(),
  };
}

// Generar reporte de facturas por periodo
export function generarReporteFacturas(periodo) {
  const data = getData();
  const facturas = data.facturas.filter((f) => f.periodo === periodo);

  const totalFacturas = facturas.length;
  const facturasPagadas = facturas.filter((f) => f.estado === "Pagada").length;
  const facturasPendientes = totalFacturas - facturasPagadas;
  const montoTotal = facturas.reduce((sum, f) => sum + f.totalPagar, 0);
  const montoPagado = facturas
    .filter((f) => f.estado === "Pagada")
    .reduce((sum, f) => sum + f.totalPagar, 0);
  const montoPendiente = montoTotal - montoPagado;

  return {
    periodo,
    totalFacturas,
    facturasPagadas,
    facturasPendientes,
    montoTotal,
    montoTotalFormateado: formatMoney(montoTotal),
    montoPagado,
    montoPagadoFormateado: formatMoney(montoPagado),
    montoPendiente,
    montoPendienteFormateado: formatMoney(montoPendiente),
    porcentajePago:
      montoTotal > 0 ? ((montoPagado / montoTotal) * 100).toFixed(1) : 0,
    facturas: facturas,
    fechaGeneracion: new Date().toLocaleString(),
  };
}

// Generar reporte general del sistema
export function generarReporteGeneral() {
  const estadisticasClientes = obtenerEstadisticasClientes();
  const estadisticasUsuarios = obtenerEstadisticasUsuarios();
  const resumenMunicipios = obtenerResumenPorMunicipio();
  const morosidad = generarReporteMorosidad();

  return {
    fechaGeneracion: new Date().toLocaleString(),
    clientes: estadisticasClientes,
    usuarios: estadisticasUsuarios,
    recaudosPorMunicipio: resumenMunicipios,
    morosidad: {
      totalClientesEnMora: morosidad.totalClientesEnMora,
      totalDeudaMora: morosidad.totalDeudaMora,
      totalDeudaMoraFormateado: morosidad.totalDeudaMoraFormateado,
    },
  };
}
