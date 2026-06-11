// ============================================================================
// modules/tarifas.js - GESTIÓN DE TARIFAS
// Tarifas generales y especiales por cliente, subsidios por estrato
// ============================================================================

import { getData, saveData } from "../data.js";
import { mostrarMensaje, formatMoney } from "../utils.js";

// Configuración predeterminada de tarifas
const DEFAULT_TARIFAS = {
  tarifaPorM3: 2800,
  tarifaAlcantarillado: 45,
  tarifaAseo: 30,
  plazoPagoDias: 30,
  interesMoraPorc: 2.0,
  cargoFijo: 5000,
};

// Porcentajes de subsidio por estrato
const SUBSIDIOS_POR_ESTRATO = {
  1: 0.7, // 70% subsidio
  2: 0.5, // 50% subsidio
  3: 0.15, // 15% subsidio
  4: 0, // 0% (paga total)
  5: -0.2, // 20% contribución
  6: -0.3, // 30% contribución
};

// Obtener configuración actual
export function obtenerConfiguracion() {
  const data = getData();
  return { ...DEFAULT_TARIFAS, ...data.config };
}

// Actualizar configuración general
export function actualizarConfiguracion(nuevaConfig) {
  const data = getData();
  data.config = { ...data.config, ...nuevaConfig };
  saveData();

  return { success: true, message: "Configuración actualizada exitosamente" };
}

// Obtener tarifa de agua (general o especial por cliente)
export function obtenerTarifaAgua(clienteId = null) {
  const data = getData();

  if (clienteId) {
    const cliente = data.clientes.find((c) => c.id === clienteId);
    if (cliente && cliente.tarifaEspecial) {
      return cliente.tarifaEspecial;
    }
  }

  return data.config.tarifaPorM3 || DEFAULT_TARIFAS.tarifaPorM3;
}

// Obtener plazo de pago (general o especial por cliente)
export function obtenerPlazoPago(clienteId = null) {
  const data = getData();

  if (clienteId) {
    const cliente = data.clientes.find((c) => c.id === clienteId);
    if (cliente && cliente.plazoEspecial) {
      return cliente.plazoEspecial;
    }
  }

  return data.config.plazoPagoDias || DEFAULT_TARIFAS.plazoPagoDias;
}

// Establecer tarifa especial para un cliente
export function establecerTarifaEspecial(
  clienteId,
  tarifaEspecial,
  plazoEspecial = null,
) {
  const data = getData();
  const cliente = data.clientes.find((c) => c.id === clienteId);

  if (!cliente) {
    return { success: false, message: "Cliente no encontrado" };
  }

  cliente.tarifaEspecial = tarifaEspecial;
  if (plazoEspecial !== null) {
    cliente.plazoEspecial = plazoEspecial;
  }
  cliente.fechaModificacionTarifa = new Date().toISOString().split("T")[0];
  saveData();

  return {
    success: true,
    message: `Tarifa especial establecida para ${cliente.nombre}`,
  };
}

// Eliminar tarifa especial de un cliente
export function eliminarTarifaEspecial(clienteId) {
  const data = getData();
  const cliente = data.clientes.find((c) => c.id === clienteId);

  if (!cliente) {
    return { success: false, message: "Cliente no encontrado" };
  }

  cliente.tarifaEspecial = null;
  cliente.plazoEspecial = null;
  saveData();

  return {
    success: true,
    message: `Tarifa especial eliminada para ${cliente.nombre}`,
  };
}

// Obtener clientes con tarifa especial
export function obtenerClientesTarifaEspecial() {
  const data = getData();
  return data.clientes.filter(
    (c) => c.tarifaEspecial !== null && c.tarifaEspecial !== undefined,
  );
}

// Calcular subsidio según estrato
export function calcularSubsidio(subtotal, estrato) {
  const porcentaje = SUBSIDIOS_POR_ESTRATO[estrato] || 0;

  if (porcentaje > 0) {
    return { tipo: "subsidio", valor: subtotal * porcentaje, porcentaje };
  } else if (porcentaje < 0) {
    return {
      tipo: "contribucion",
      valor: subtotal * Math.abs(porcentaje),
      porcentaje: Math.abs(porcentaje),
    };
  }

  return { tipo: "ninguno", valor: 0, porcentaje: 0 };
}

// Calcular total de factura con todos los componentes
export function calcularTotalFactura(consumoM3, estrato, clienteId = null) {
  const tarifaBase = obtenerTarifaAgua(clienteId);
  const tarifaAlcantarillado =
    (getData().config.tarifaAlcantarillado ||
      DEFAULT_TARIFAS.tarifaAlcantarillado) / 100;
  const tarifaAseo =
    (getData().config.tarifaAseo || DEFAULT_TARIFAS.tarifaAseo) / 100;
  const cargoFijo = getData().config.cargoFijo || DEFAULT_TARIFAS.cargoFijo;

  const valorAgua = consumoM3 * tarifaBase;
  const valorAlcantarillado = valorAgua * tarifaAlcantarillado;
  const valorAseo = valorAgua * tarifaAseo;
  const subtotal = valorAgua + valorAlcantarillado + valorAseo + cargoFijo;

  const subsidio = calcularSubsidio(subtotal, estrato);
  const totalPagar =
    subtotal -
    (subsidio.tipo === "subsidio" ? subsidio.valor : 0) +
    (subsidio.tipo === "contribucion" ? subsidio.valor : 0);

  return {
    consumoM3,
    tarifaBase,
    valorAgua,
    valorAlcantarillado,
    valorAseo,
    cargoFijo,
    subtotal,
    subsidio: subsidio.tipo === "subsidio" ? subsidio.valor : 0,
    contribucion: subsidio.tipo === "contribucion" ? subsidio.valor : 0,
    totalPagar,
    porcentajeSubsidio: subsidio.porcentaje,
    detalle: {
      agua: formatMoney(valorAgua),
      alcantarillado: formatMoney(valorAlcantarillado),
      aseo: formatMoney(valorAseo),
      subtotal: formatMoney(subtotal),
      total: formatMoney(totalPagar),
    },
  };
}

// Obtener porcentaje de subsidio por estrato
export function obtenerPorcentajeSubsidio(estrato) {
  const porcentaje = SUBSIDIOS_POR_ESTRATO[estrato] || 0;
  if (porcentaje > 0) {
    return { tipo: "subsidio", porcentaje: porcentaje * 100 };
  } else if (porcentaje < 0) {
    return { tipo: "contribucion", porcentaje: Math.abs(porcentaje) * 100 };
  }
  return { tipo: "ninguno", porcentaje: 0 };
}

// Obtener todos los estratos disponibles
export function obtenerEstratos() {
  return [1, 2, 3, 4, 5, 6];
}

// Obtener información de tarifas para mostrar
export function obtenerInfoTarifas() {
  const config = obtenerConfiguracion();
  const estratos = [];

  for (let i = 1; i <= 6; i++) {
    const subsidio = obtenerPorcentajeSubsidio(i);
    estratos.push({
      estrato: i,
      tipo: subsidio.tipo,
      porcentaje: subsidio.porcentaje,
      descripcion:
        subsidio.tipo === "subsidio"
          ? `${subsidio.porcentaje}% de descuento`
          : subsidio.tipo === "contribucion"
            ? `${subsidio.porcentaje}% de incremento`
            : "Sin subsidio",
    });
  }

  return {
    tarifaAgua: config.tarifaPorM3,
    tarifaAguaFormateada: formatMoney(config.tarifaPorM3),
    porcentajeAlcantarillado: config.tarifaAlcantarillado,
    porcentajeAseo: config.tarifaAseo,
    plazoPago: config.plazoPagoDias,
    interesMora: config.interesMoraPorc,
    cargoFijo: config.cargoFijo,
    cargoFijoFormateado: formatMoney(config.cargoFijo),
    estratos,
  };
}
