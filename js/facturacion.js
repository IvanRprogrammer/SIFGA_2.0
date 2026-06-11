// ============================================================================
// facturacion.js - LÓGICA DE FACTURACIÓN
// ============================================================================

import {
  getData,
  saveData,
  guardarFactura,
  guardarLecturaManual,
  verificarEstadosFacturas,
} from "./data.js";
import { formatMoney, generarNumeroFactura } from "./utils.js";

export function calcularMoraCliente(clienteId) {
  const data = getData();
  const facturasPendientes = data.facturas.filter(
    (f) => f.clienteId === clienteId && f.estado === "En Mora",
  );
  let totalMora = 0;

  for (let i = 0; i < facturasPendientes.length; i++) {
    const f = facturasPendientes[i];
    const fechaVenc = new Date(f.fechaVencimiento);
    const hoy = new Date();
    const diasMora = Math.max(
      0,
      Math.floor((hoy - fechaVenc) / (1000 * 60 * 60 * 24)),
    );
    const interesDiario =
      (f.totalPagar * (data.config.interesMoraPorc || 2.0)) / 100 / 30;
    totalMora += interesDiario * diasMora;
  }

  return totalMora;
}

export function calcularFactura(
  cliente,
  lecturaActual,
  periodo,
  fechaLectura,
  incluirMora = true,
) {
  const data = getData();
  const tarifaBase = cliente.tarifaEspecial || data.config.tarifaPorM3 || 2800;
  const ultimaLectura =
    cliente.historialLecturas && cliente.historialLecturas.length > 0
      ? cliente.historialLecturas[cliente.historialLecturas.length - 1]
      : 0;

  if (lecturaActual < ultimaLectura) {
    throw new Error(
      "La lectura actual no puede ser menor a la lectura anterior",
    );
  }

  const consumoM3 = lecturaActual - ultimaLectura;
  const estrato = parseInt(cliente.estrato || 3);
  const porcentajeAlcantarillado =
    (data.config.tarifaAlcantarillado || 45) / 100;
  const porcentajeAseo = (data.config.tarifaAseo || 30) / 100;

  const valorAgua = consumoM3 * tarifaBase;
  const valorAlcantarillado = valorAgua * porcentajeAlcantarillado;
  const valorAseo = valorAgua * porcentajeAseo;
  const subtotal = valorAgua + valorAlcantarillado + valorAseo;

  let porcentajeSubsidio = 0;
  if (estrato === 1) porcentajeSubsidio = 0.7;
  else if (estrato === 2) porcentajeSubsidio = 0.5;
  else if (estrato === 3) porcentajeSubsidio = 0.15;
  else if (estrato === 4) porcentajeSubsidio = 0;
  else if (estrato === 5) porcentajeSubsidio = -0.2;
  else if (estrato === 6) porcentajeSubsidio = -0.3;

  let descuentoSubsidio = 0;
  let contribucion = 0;

  if (porcentajeSubsidio > 0) {
    descuentoSubsidio = subtotal * porcentajeSubsidio;
  } else if (porcentajeSubsidio < 0) {
    contribucion = subtotal * Math.abs(porcentajeSubsidio);
  }

  const subtotalConSubsidio = subtotal - descuentoSubsidio + contribucion;
  const cargoFijo = data.config.cargoFijo || 5000;
  let totalPagar = subtotalConSubsidio + cargoFijo;

  let moraAnterior = 0;
  if (incluirMora) {
    moraAnterior = calcularMoraCliente(cliente.id);
    totalPagar += moraAnterior;
  }

  const numeroFactura = generarNumeroFactura();
  const fechaEmision = new Date().toISOString().split("T")[0];
  const fechaVencimiento = new Date();
  const plazoPago = cliente.plazoEspecial || data.config.plazoPagoDias || 30;
  fechaVencimiento.setDate(fechaVencimiento.getDate() + plazoPago);
  const fechaVencimientoStr = fechaVencimiento.toISOString().split("T")[0];

  return {
    numeroFactura,
    clienteId: cliente.id,
    clienteNombre: cliente.nombre,
    clienteCedula: cliente.cedula,
    clienteContador: cliente.contador,
    clienteDireccion: cliente.ubicacion,
    clienteCiudad: cliente.ciudad,
    clienteRegion: cliente.region,
    estrato: estrato,
    periodo: periodo,
    fechaLectura: fechaLectura,
    fechaEmision: fechaEmision,
    fechaVencimiento: fechaVencimientoStr,
    lecturaAnterior: ultimaLectura,
    lecturaActual: lecturaActual,
    consumoM3: consumoM3,
    tarifaAplicada: tarifaBase,
    valorAgua: valorAgua,
    valorAlcantarillado: valorAlcantarillado,
    valorAseo: valorAseo,
    subtotal: subtotal,
    porcentajeSubsidio: porcentajeSubsidio,
    descuentoSubsidio: descuentoSubsidio,
    contribucion: contribucion,
    cargoFijo: cargoFijo,
    moraAnterior: moraAnterior,
    totalPagar: totalPagar,
    estado: "Pendiente",
  };
}

export function guardarFacturaCompleta(
  facturaCalculada,
  clienteId,
  lecturaActual,
  periodo = null,
) {
  const data = getData();
  const cliente = data.clientes.find((c) => c.id === clienteId);

  const facturaGuardada = guardarFactura(facturaCalculada);

  if (!cliente.historialLecturas) cliente.historialLecturas = [];
  cliente.historialLecturas.push(lecturaActual);
  cliente.deuda = (cliente.deuda || 0) + facturaCalculada.totalPagar;

  const nuevaLectura = {
    id: Date.now(),
    clienteId: clienteId,
    clienteNombre: cliente.nombre,
    clienteCedula: cliente.cedula,
    lecturaActual: lecturaActual,
    periodo: periodo || facturaCalculada.periodo,
    fechaLectura: facturaCalculada.fechaLectura,
    fechaVencimiento: facturaCalculada.fechaVencimiento,
    fechaRegistro: new Date().toLocaleString(),
    facturaId: facturaGuardada.id,
    numeroFactura: facturaCalculada.numeroFactura,
    totalPagar: facturaCalculada.totalPagar,
    estado: facturaCalculada.estado,
  };

  guardarLecturaManual(nuevaLectura);

  return facturaGuardada;
}

export function obtenerLecturasGuardadas() {
  const data = getData();
  verificarEstadosFacturas();

  if (data.lecturasGuardadas) {
    for (let i = 0; i < data.lecturasGuardadas.length; i++) {
      const l = data.lecturasGuardadas[i];
      const factura = data.facturas.find((f) => f.id === l.facturaId);
      if (factura && l.estado !== factura.estado) {
        l.estado = factura.estado;
      }
      if (
        factura &&
        (!l.fechaVencimiento || l.fechaVencimiento !== factura.fechaVencimiento)
      ) {
        l.fechaVencimiento = factura.fechaVencimiento;
      }
    }
    saveData();
  }

  return data.lecturasGuardadas || [];
}
