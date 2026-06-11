const pool = require('../config/database');

const getDashboardStats = async (req, res, next) => {
  try {
    const [[{ total_usuarios }]] = await pool.execute('SELECT COUNT(*) AS total_usuarios FROM usuarios');
    const [[{ total_clientes }]] = await pool.execute('SELECT COUNT(*) AS total_clientes FROM clientes');
    const [[{ clientes_activos }]] = await pool.execute("SELECT COUNT(*) AS clientes_activos FROM clientes WHERE estado = 'activo'");
    const [[{ propuestas_pendientes }]] = await pool.execute('SELECT COUNT(*) AS propuestas_pendientes FROM propuestas_clientes WHERE id_estado = 1');
    const [[{ total_facturas }]] = await pool.execute('SELECT COUNT(*) AS total_facturas FROM facturas');
    const [[{ facturas_pendientes }]] = await pool.execute('SELECT COUNT(*) AS facturas_pendientes FROM facturas WHERE id_estado IN (1,3)');
    const [[{ total_recaudado }]] = await pool.execute('SELECT COALESCE(SUM(valor), 0) AS total_recaudado FROM pagos');
    const [[{ deuda_total }]] = await pool.execute('SELECT COALESCE(SUM(deuda_actual), 0) AS deuda_total FROM clientes');

    // Last 5 collections
    const [ultimosPagos] = await pool.execute(
      `SELECT p.*, mp.nombre AS medio_pago_nombre, c.nombres, c.apellidos, f.codigo_factura
       FROM pagos p
       JOIN medios_pago mp ON mp.id_medio_pago = p.id_medio_pago
       JOIN clientes c ON c.id_cliente = p.id_cliente
       JOIN facturas f ON f.id_factura = p.id_factura
       ORDER BY p.created_at DESC LIMIT 5`
    );

    res.json({
      total_usuarios,
      total_clientes,
      clientes_activos,
      propuestas_pendientes,
      total_facturas,
      facturas_pendientes,
      total_recaudado,
      deuda_total,
      ultimos_pagos: ultimosPagos
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const { anio, mes } = req.query;
    const year = anio || new Date().getFullYear();
    const month = mes || new Date().getMonth() + 1;

    const [ingresos] = await pool.execute(
      `SELECT COALESCE(SUM(p.valor), 0) AS total_ingresos, COUNT(p.id_pago) AS total_pagos
       FROM pagos p
       WHERE YEAR(p.fecha_pago) = ? AND MONTH(p.fecha_pago) = ?`,
      [year, month]
    );

    const [facturasPeriodo] = await pool.execute(
      `SELECT COUNT(*) AS total, COALESCE(SUM(total_pagar), 0) AS monto_total
       FROM facturas
       WHERE YEAR(fecha_emision) = ? AND MONTH(fecha_emision) = ?`,
      [year, month]
    );

    const [porEstado] = await pool.execute(
      `SELECT ef.nombre AS estado, COUNT(*) AS cantidad, COALESCE(SUM(f.total_pagar), 0) AS monto
       FROM facturas f
       JOIN estados_factura ef ON ef.id_estado_factura = f.id_estado
       WHERE YEAR(f.fecha_emision) = ? AND MONTH(f.fecha_emision) = ?
       GROUP BY ef.nombre`,
      [year, month]
    );

    const [porEstrato] = await pool.execute(
      `SELECT e.numero AS estrato, COUNT(DISTINCT c.id_cliente) AS clientes,
              COUNT(f.id_factura) AS facturas, COALESCE(SUM(f.total_pagar), 0) AS monto
       FROM facturas f
       JOIN clientes c ON c.id_cliente = f.id_cliente
       JOIN estratos e ON e.id_estrato = c.id_estrato
       WHERE YEAR(f.fecha_emision) = ? AND MONTH(f.fecha_emision) = ?
       GROUP BY e.numero ORDER BY e.numero`,
      [year, month]
    );

    res.json({
      periodo: `${year}-${String(month).padStart(2, '0')}`,
      ingresos: ingresos[0],
      facturas: facturasPeriodo[0],
      por_estado: porEstado,
      por_estrato: porEstrato
    });
  } catch (error) {
    next(error);
  }
};

const getAnnualReport = async (req, res, next) => {
  try {
    const anio = req.query.anio || new Date().getFullYear();

    const [mensual] = await pool.execute(
      `SELECT MONTH(p.fecha_pago) AS mes, COALESCE(SUM(p.valor), 0) AS total
       FROM pagos p
       WHERE YEAR(p.fecha_pago) = ?
       GROUP BY MONTH(p.fecha_pago)
       ORDER BY mes`,
      [anio]
    );

    const [facturasMensual] = await pool.execute(
      `SELECT MONTH(fecha_emision) AS mes, COUNT(*) AS emitidas,
              COALESCE(SUM(total_pagar), 0) AS monto
       FROM facturas
       WHERE YEAR(fecha_emision) = ?
       GROUP BY MONTH(fecha_emision)
       ORDER BY mes`,
      [anio]
    );

    const [resumenEstratos] = await pool.execute(
      `SELECT e.numero AS estrato, e.nombre, COUNT(c.id_cliente) AS clientes
       FROM clientes c
       JOIN estratos e ON e.id_estrato = c.id_estrato
       GROUP BY e.numero, e.nombre ORDER BY e.numero`
    );

    const [[{ morosidad }]] = await pool.execute(
      `SELECT COALESCE(SUM(total_pagar), 0) AS morosidad
       FROM facturas WHERE id_estado = 3`
    );

    const [[{ cartera_total }]] = await pool.execute(
      `SELECT COALESCE(SUM(total_pagar), 0) AS cartera_total
       FROM facturas WHERE id_estado IN (1, 3)`
    );

    const [topDeudores] = await pool.execute(
      `SELECT c.nombres, c.apellidos, c.cedula, c.deuda_actual
       FROM clientes c
       WHERE c.deuda_actual > 0
       ORDER BY c.deuda_actual DESC LIMIT 10`
    );

    res.json({
      anio,
      ingresos_mensuales: mensual,
      facturas_mensuales: facturasMensual,
      resumen_estratos: resumenEstratos,
      morosidad,
      cartera_total,
      top_deudores: topDeudores
    });
  } catch (error) {
    next(error);
  }
};

const getAuditLog = async (req, res, next) => {
  try {
    const { modulo, desde, hasta } = req.query;
    let query = `
      SELECT a.*, u.nombre, u.apellido, u.correo
      FROM auditoria a
      LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario
    `;
    const conditions = [];
    const params = [];

    if (modulo) {
      conditions.push('a.modulo = ?');
      params.push(modulo);
    }
    if (desde) {
      conditions.push('a.created_at >= ?');
      params.push(desde);
    }
    if (hasta) {
      conditions.push('a.created_at <= ?');
      params.push(hasta);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.created_at DESC LIMIT 200';

    const [logs] = await pool.execute(query, params);
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getMonthlyReport, getAnnualReport, getAuditLog };
