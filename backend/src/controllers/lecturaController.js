const pool = require('../config/database');
const { registrarAuditoria } = require('../utils/auditoria');

const getAll = async (req, res, next) => {
  try {
    const { id_cliente } = req.query;
    let query = `
      SELECT l.*, c.nombres, c.apellidos, c.cedula, c.numero_contador,
             u.nombre AS usuario_registro
      FROM lecturas l
      JOIN clientes c ON c.id_cliente = l.id_cliente
      JOIN usuarios u ON u.id_usuario = l.id_usuario
    `;
    const params = [];

    if (id_cliente) {
      query += ' WHERE l.id_cliente = ?';
      params.push(id_cliente);
    }

    query += ' ORDER BY l.fecha_lectura DESC';

    const [lecturas] = await pool.execute(query, params);
    res.json(lecturas);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const [lecturas] = await pool.execute(
      `SELECT l.*, c.nombres, c.apellidos, c.cedula, c.numero_contador,
              u.nombre AS usuario_registro
       FROM lecturas l
       JOIN clientes c ON c.id_cliente = l.id_cliente
       JOIN usuarios u ON u.id_usuario = l.id_usuario
       WHERE l.id_lectura = ?`,
      [req.params.id]
    );

    if (lecturas.length === 0) {
      return res.status(404).json({ error: 'Lectura no encontrada' });
    }

    res.json(lecturas[0]);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { id_cliente, lectura_actual, fecha_lectura, observaciones } = req.body;

    const [clientes] = await pool.execute(
      'SELECT id_cliente FROM clientes WHERE id_cliente = ?',
      [id_cliente]
    );

    if (clientes.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const [ultimaLectura] = await pool.execute(
      'SELECT lectura_actual FROM lecturas WHERE id_cliente = ? ORDER BY fecha_lectura DESC LIMIT 1',
      [id_cliente]
    );

    const lecturaAnterior = ultimaLectura.length > 0 ? ultimaLectura[0].lectura_actual : 0;

    if (lectura_actual < lecturaAnterior) {
      return res.status(400).json({
        error: 'La lectura actual no puede ser menor que la lectura anterior',
        lectura_anterior: lecturaAnterior
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO lecturas (id_cliente, id_usuario, fecha_lectura, lectura_anterior, lectura_actual, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_cliente, req.user.id_usuario, fecha_lectura, lecturaAnterior, lectura_actual, observaciones || null]
    );

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Registrar lectura',
      modulo: 'Lecturas',
      detalle: { id_lectura: result.insertId, id_cliente, lectura_actual, consumo: lectura_actual - lecturaAnterior },
      ip_address: req.ip
    });

    res.status(201).json({
      mensaje: 'Lectura registrada exitosamente',
      id_lectura: result.insertId,
      lectura_anterior: lecturaAnterior,
      consumo_m3: lectura_actual - lecturaAnterior
    });
  } catch (error) {
    next(error);
  }
};

const getHistorialByCliente = async (req, res, next) => {
  try {
    const [lecturas] = await pool.execute(
      `SELECT l.*, f.codigo_factura, f.total_pagar, ef.nombre AS estado_factura
       FROM lecturas l
       LEFT JOIN facturas f ON f.id_lectura = l.id_lectura
       LEFT JOIN estados_factura ef ON ef.id_estado_factura = f.id_estado
       WHERE l.id_cliente = ?
       ORDER BY l.fecha_lectura DESC`,
      [req.params.clienteId]
    );

    res.json(lecturas);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, getHistorialByCliente };
