const pool = require('../config/database');
const { registrarAuditoria } = require('../utils/auditoria');

const getAll = async (req, res, next) => {
  try {
    const { id_cliente, desde, hasta } = req.query;
    let query = `
      SELECT p.*, mp.nombre AS medio_pago_nombre,
             c.nombres, c.apellidos, c.cedula, c.numero_contador,
             f.codigo_factura
      FROM pagos p
      JOIN medios_pago mp ON mp.id_medio_pago = p.id_medio_pago
      JOIN clientes c ON c.id_cliente = p.id_cliente
      JOIN facturas f ON f.id_factura = p.id_factura
    `;
    const conditions = [];
    const params = [];

    if (id_cliente) {
      conditions.push('p.id_cliente = ?');
      params.push(id_cliente);
    }
    if (desde) {
      conditions.push('p.fecha_pago >= ?');
      params.push(desde);
    }
    if (hasta) {
      conditions.push('p.fecha_pago <= ?');
      params.push(hasta);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC';

    const [pagos] = await pool.execute(query, params);
    res.json(pagos);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { id_factura, id_medio_pago, valor, referencia, fecha_pago } = req.body;

    const [facturas] = await pool.execute(
      `SELECT f.*, ef.nombre AS estado_nombre
       FROM facturas f
       JOIN estados_factura ef ON ef.id_estado_factura = f.id_estado
       WHERE f.id_factura = ?`,
      [id_factura]
    );

    if (facturas.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const factura = facturas[0];

    if (factura.id_estado === 2) {
      return res.status(400).json({ error: 'La factura ya está pagada' });
    }

    if (factura.id_estado === 4) {
      return res.status(400).json({ error: 'No se puede pagar una factura anulada' });
    }

    const [result] = await pool.execute(
      `INSERT INTO pagos (id_factura, id_cliente, id_usuario, id_medio_pago, valor, referencia, fecha_pago)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_factura,
        factura.id_cliente,
        req.user.id_usuario,
        id_medio_pago,
        valor,
        referencia || null,
        fecha_pago || new Date().toISOString().split('T')[0]
      ]
    );

    await pool.execute(
      'UPDATE facturas SET id_estado = 2 WHERE id_factura = ?',
      [id_factura]
    );

    await pool.execute(
      'UPDATE clientes SET deuda_actual = GREATEST(deuda_actual - ?, 0) WHERE id_cliente = ?',
      [valor, factura.id_cliente]
    );

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Registrar pago',
      modulo: 'Pagos',
      detalle: {
        id_pago: result.insertId,
        id_factura,
        valor,
        factura_estado_anterior: factura.estado_nombre
      },
      ip_address: req.ip
    });

    res.status(201).json({
      mensaje: 'Pago registrado exitosamente',
      id_pago: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

const getMediosPago = async (req, res, next) => {
  try {
    const [medios] = await pool.execute('SELECT id_medio_pago, nombre FROM medios_pago WHERE activo = TRUE');
    res.json(medios);
  } catch (error) {
    next(error);
  }
};

const getResumenMunicipio = async (req, res, next) => {
  try {
    const [resumen] = await pool.execute('SELECT * FROM vw_resumen_recaudos_municipio ORDER BY total_recaudado DESC');
    res.json(resumen);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, getMediosPago, getResumenMunicipio };
