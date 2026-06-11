const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { registrarAuditoria } = require('../utils/auditoria');

const getAll = async (req, res, next) => {
  try {
    const { estado } = req.query;
    let query = `
      SELECT c.*, m.nombre AS municipio, m.region, e.numero AS estrato_numero, e.nombre AS estrato_nombre
      FROM clientes c
      LEFT JOIN municipios m ON m.id_municipio = c.id_municipio
      LEFT JOIN estratos e ON e.id_estrato = c.id_estrato
    `;
    const params = [];

    if (estado) {
      query += ' WHERE c.estado = ?';
      params.push(estado);
    }

    query += ' ORDER BY c.nombres, c.apellidos';
    const [clientes] = await pool.execute(query, params);
    res.json(clientes);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const [clientes] = await pool.execute(
      `SELECT c.*, m.nombre AS municipio, m.region, e.numero AS estrato_numero, e.nombre AS estrato_nombre
       FROM clientes c
       LEFT JOIN municipios m ON m.id_municipio = c.id_municipio
       LEFT JOIN estratos e ON e.id_estrato = c.id_estrato
       WHERE c.id_cliente = ?`,
      [req.params.id]
    );

    if (clientes.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(clientes[0]);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { nombres, apellidos, cedula, direccion, telefono, correo,
      numero_contador, id_municipio, id_estrato } = req.body;

    const [existing] = await pool.execute(
      'SELECT id_cliente FROM clientes WHERE cedula = ? OR numero_contador = ?',
      [cedula, numero_contador]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'La cédula o número de contador ya existe' });
    }

    const [result] = await pool.execute(
      `INSERT INTO clientes (nombres, apellidos, cedula, direccion, telefono, correo,
        numero_contador, id_municipio, id_estrato, fecha_ingreso)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [nombres, apellidos, cedula, direccion, telefono, correo, numero_contador,
        id_municipio || null, id_estrato || null]
    );

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Crear cliente',
      modulo: 'Clientes',
      detalle: { id_cliente: result.insertId, nombres, cedula },
      ip_address: req.ip
    });

    res.status(201).json({ mensaje: 'Cliente creado exitosamente', id_cliente: result.insertId });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const fields = [];
    const params = [];
    const allowed = ['nombres', 'apellidos', 'cedula', 'direccion', 'telefono', 'correo',
      'numero_contador', 'id_municipio', 'id_estrato', 'estado', 'deuda_actual'];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(req.params.id);
    await pool.execute(
      `UPDATE clientes SET ${fields.join(', ')} WHERE id_cliente = ?`,
      params
    );

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Actualizar cliente',
      modulo: 'Clientes',
      detalle: { id_cliente: parseInt(req.params.id) },
      ip_address: req.ip
    });

    res.json({ mensaje: 'Cliente actualizado exitosamente' });
  } catch (error) {
    next(error);
  }
};

const getPendingProposals = async (req, res, next) => {
  try {
    const [propuestas] = await pool.execute(
      `SELECT p.*, u.nombre AS vendedor_nombre, u.apellido AS vendedor_apellido,
              m.nombre AS municipio, e.numero AS estrato_numero
       FROM propuestas_clientes p
       JOIN usuarios u ON u.id_usuario = p.id_vendedor
       LEFT JOIN municipios m ON m.id_municipio = p.id_municipio
       LEFT JOIN estratos e ON e.id_estrato = p.id_estrato
       WHERE p.id_estado = 1
       ORDER BY p.created_at DESC`
    );
    res.json(propuestas);
  } catch (error) {
    next(error);
  }
};

const approveProposal = async (req, res, next) => {
  try {
    const { contrasena_asignada } = req.body;
    const propuestaId = req.params.id;

    const [propuestas] = await pool.execute(
      `SELECT * FROM propuestas_clientes WHERE id_propuesta = ? AND id_estado = 1`,
      [propuestaId]
    );

    if (propuestas.length === 0) {
      return res.status(404).json({ error: 'Propuesta no encontrada o ya procesada' });
    }

    const propuesta = propuestas[0];
    const tempPassword = contrasena_asignada || `sifga${Math.random().toString(36).slice(-6)}`;
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(tempPassword, salt);

    const [clienteResult] = await pool.execute(
      `INSERT INTO clientes (nombres, apellidos, cedula, direccion, telefono, correo,
        numero_contador, id_municipio, id_estrato, fecha_ingreso)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [propuesta.nombres, propuesta.apellidos, propuesta.cedula, propuesta.direccion,
        propuesta.telefono, propuesta.correo, propuesta.numero_contador,
        propuesta.id_municipio, propuesta.id_estrato]
    );

    const clienteId = clienteResult.insertId;

    const [userResult] = await pool.execute(
      `INSERT INTO usuarios (nombre, apellido, correo, usuario, contrasena, id_rol, id_cliente, estado)
       VALUES (?, ?, ?, ?, ?, 3, ?, TRUE)`,
      [propuesta.nombres, propuesta.apellidos, propuesta.correo,
        propuesta.cedula, contrasenaHash, clienteId]
    );

    await pool.execute(
      `UPDATE propuestas_clientes SET id_estado = 2, fecha_gestion = NOW(),
        id_admin_gestion = ?, contrasena_asignada = ?
       WHERE id_propuesta = ?`,
      [req.user.id_usuario, contrasenaHash, propuestaId]
    );

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Aprobar propuesta cliente',
      modulo: 'Clientes',
      detalle: { id_propuesta: propuestaId, id_cliente: clienteId, id_usuario_cliente: userResult.insertId },
      ip_address: req.ip
    });

    res.status(201).json({
      mensaje: 'Cliente aprobado y creado exitosamente',
      id_cliente: clienteId,
      credenciales: { usuario: propuesta.cedula, contrasena: tempPassword }
    });
  } catch (error) {
    next(error);
  }
};

const rejectProposal = async (req, res, next) => {
  try {
    const { observaciones } = req.body;

    await pool.execute(
      `UPDATE propuestas_clientes SET id_estado = 3, fecha_gestion = NOW(),
        id_admin_gestion = ?, observaciones = ?
       WHERE id_propuesta = ? AND id_estado = 1`,
      [req.user.id_usuario, observaciones || null, req.params.id]
    );

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Rechazar propuesta cliente',
      modulo: 'Clientes',
      detalle: { id_propuesta: parseInt(req.params.id), observaciones },
      ip_address: req.ip
    });

    res.json({ mensaje: 'Propuesta rechazada' });
  } catch (error) {
    next(error);
  }
};

const getMunicipios = async (req, res, next) => {
  try {
    const [municipios] = await pool.execute('SELECT id_municipio, nombre, region FROM municipios WHERE activo = TRUE ORDER BY nombre');
    res.json(municipios);
  } catch (error) {
    next(error);
  }
};

const getEstratos = async (req, res, next) => {
  try {
    const [estratos] = await pool.execute('SELECT id_estrato, numero, nombre, porcentaje_subsidio FROM estratos ORDER BY numero');
    res.json(estratos);
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const { termino } = req.query;
    if (!termino) {
      return res.status(400).json({ error: 'Término de búsqueda requerido' });
    }

    const searchTerm = `%${termino}%`;
    const [clientes] = await pool.execute(
      `SELECT c.*, m.nombre AS municipio, e.numero AS estrato_numero
       FROM clientes c
       LEFT JOIN municipios m ON m.id_municipio = c.id_municipio
       LEFT JOIN estratos e ON e.id_estrato = c.id_estrato
       WHERE c.nombres LIKE ? OR c.apellidos LIKE ? OR c.cedula LIKE ?
          OR c.numero_contador LIKE ? OR c.correo LIKE ?
       ORDER BY c.nombres
       LIMIT 20`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json(clientes);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll, getById, create, update,
  getPendingProposals, approveProposal, rejectProposal,
  getMunicipios, getEstratos, search
};
