const prisma = require('../config/prisma');

const formatMoney = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount || 0);
};

const generarCodigoFactura = async (poolOrPrisma) => {
  const anio = new Date().getFullYear();

  // Prisma path
  if (poolOrPrisma && poolOrPrisma.$transaction) {
    const consecutivo = await poolOrPrisma.$transaction(async (tx) => {
      const existing = await tx.consecutivos_factura.findUnique({ where: { anio } });
      if (!existing) {
        await tx.consecutivos_factura.create({ data: { anio, ultimo_numero: 1 } });
        return 1;
      }
      const updated = await tx.consecutivos_factura.update({
        where: { anio },
        data: { ultimo_numero: { increment: 1 } }
      });
      return updated.ultimo_numero;
    });
    return `FAC-${anio}-${String(consecutivo).padStart(6, '0')}`;
  }

  // mysql2 path (backward compatible)
  const [rows] = await poolOrPrisma.execute(
    `INSERT INTO consecutivos_factura (anio, ultimo_numero)
     VALUES (?, 1)
     ON DUPLICATE KEY UPDATE ultimo_numero = ultimo_numero + 1`,
    [anio]
  );

  let ultimo;
  if (rows.affectedRows === 1 && rows.insertId) {
    ultimo = 1;
  } else {
    const [seq] = await poolOrPrisma.execute(
      'SELECT ultimo_numero FROM consecutivos_factura WHERE anio = ?',
      [anio]
    );
    ultimo = seq[0].ultimo_numero;
  }

  return `FAC-${anio}-${String(ultimo).padStart(6, '0')}`;
};

const calcularValoresFactura = (consumoM3, tarifaAgua, porcentajeAlcantarillado, porcentajeAseo,
  porcentajeSubsidio, cargoFijo, moraAnterior = 0) => {
  const valorAgua = consumoM3 * tarifaAgua;
  const valorAlcantarillado = valorAgua * (porcentajeAlcantarillado / 100);
  const valorAseo = valorAgua * (porcentajeAseo / 100);
  const subtotal = valorAgua + valorAlcantarillado + valorAseo;

  let descuentoSubsidio = 0;
  let contribucion = 0;

  if (porcentajeSubsidio > 0) {
    descuentoSubsidio = subtotal * (porcentajeSubsidio / 100);
  } else if (porcentajeSubsidio < 0) {
    contribucion = subtotal * (Math.abs(porcentajeSubsidio) / 100);
  }

  const totalPagar = subtotal - descuentoSubsidio + contribucion + cargoFijo + moraAnterior;

  return {
    valorAgua: Math.round(valorAgua),
    valorAlcantarillado: Math.round(valorAlcantarillado),
    valorAseo: Math.round(valorAseo),
    subtotal: Math.round(subtotal),
    descuentoSubsidio: Math.round(descuentoSubsidio),
    contribucion: Math.round(contribucion),
    cargoFijo: Math.round(cargoFijo),
    moraAnterior: Math.round(moraAnterior),
    totalPagar: Math.round(totalPagar)
  };
};

const calcularMoraCliente = async (db, clienteId, interesMoraPorc) => {
  const hoy = new Date();
  const hoyStr = hoy.toISOString().split('T')[0];

  // Prisma path
  if (db.$transaction) {
    const facturas = await db.facturas.findMany({
      where: { id_cliente: clienteId, id_estado: 1, fecha_vencimiento: { lt: new Date(hoyStr) } },
      orderBy: { fecha_vencimiento: 'asc' }
    });

    let totalMora = 0;
    for (const factura of facturas) {
      const diasMora = Math.floor((hoy - new Date(factura.fecha_vencimiento)) / (1000 * 60 * 60 * 24));
      const interesDiario = (Number(factura.total_pagar) * (interesMoraPorc / 100)) / 30;
      const mora = Math.round(interesDiario * diasMora);
      totalMora += mora;

      await db.facturas.update({
        where: { id_factura: factura.id_factura },
        data: { id_estado: 3 }
      });
    }
    return totalMora;
  }

  // mysql2 path
  const [facturas] = await db.execute(
    `SELECT id_factura, codigo_factura, total_pagar, fecha_vencimiento
     FROM facturas
     WHERE id_cliente = ? AND id_estado = 1 AND fecha_vencimiento < ?
     ORDER BY fecha_vencimiento`,
    [clienteId, hoyStr]
  );

  let totalMora = 0;
  for (const factura of facturas) {
    const diasMora = Math.floor((hoy - new Date(factura.fecha_vencimiento)) / (1000 * 60 * 60 * 24));
    const interesDiario = (factura.total_pagar * (interesMoraPorc / 100)) / 30;
    const mora = Math.round(interesDiario * diasMora);
    totalMora += mora;

    await db.execute(
      'UPDATE facturas SET id_estado = 3 WHERE id_factura = ? AND id_estado = 1',
      [factura.id_factura]
    );
  }

  return totalMora;
};

module.exports = {
  formatMoney,
  generarCodigoFactura,
  calcularValoresFactura,
  calcularMoraCliente
};
