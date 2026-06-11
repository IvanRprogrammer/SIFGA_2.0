const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { registrarAuditoria } = require('../utils/auditoria');

const getAll = async (req, res, next) => {
  try {
    const [usuarios] = await pool.execute(
      `SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.usuario, u.id_rol,
              r.nombre AS rol, u.estado, u.ultimo_acceso, u.created_at
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       ORDER BY u.created_at DESC`
    );
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const [usuarios] = await pool.execute(
      `SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.usuario, u.id_rol,
              r.nombre AS rol, u.estado, u.ultimo_acceso, u.created_at
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = ?`,
      [req.params.id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuarios[0]);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { nombre, apellido, correo, usuario, contrasena, id_rol } = req.body;

    const [existing] = await pool.execute(
      'SELECT id_usuario FROM usuarios WHERE correo = ? OR usuario = ?',
      [correo, usuario]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'El correo o usuario ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(contrasena, salt);

    const [result] = await pool.execute(
      'INSERT INTO usuarios (nombre, apellido, correo, usuario, contrasena, id_rol) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, apellido || null, correo, usuario, contrasenaHash, id_rol]
    );

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Crear usuario',
      modulo: 'Usuarios',
      detalle: { id_usuario_creado: result.insertId, nombre, correo, rol: id_rol },
      ip_address: req.ip
    });

    res.status(201).json({ mensaje: 'Usuario creado exitosamente', id_usuario: result.insertId });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { nombre, apellido, correo, usuario, id_rol, estado } = req.body;

    const [existing] = await pool.execute(
      'SELECT id_usuario FROM usuarios WHERE (correo = ? OR usuario = ?) AND id_usuario != ?',
      [correo, usuario, req.params.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'El correo o usuario ya está en uso' });
    }

    await pool.execute(
      `UPDATE usuarios SET
        nombre = COALESCE(?, nombre),
        apellido = COALESCE(?, apellido),
        correo = COALESCE(?, correo),
        usuario = COALESCE(?, usuario),
        id_rol = COALESCE(?, id_rol),
        estado = COALESCE(?, estado)
       WHERE id_usuario = ?`,
      [nombre, apellido, correo, usuario, id_rol, estado, req.params.id]
    );

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Actualizar usuario',
      modulo: 'Usuarios',
      detalle: { id_usuario_actualizado: parseInt(req.params.id) },
      ip_address: req.ip
    });

    res.json({ mensaje: 'Usuario actualizado exitosamente' });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id_usuario) {
      return res.status(400).json({ error: 'No puede eliminarse a sí mismo' });
    }

    await pool.execute('DELETE FROM auditoria WHERE id_usuario = ?', [userId]);
    await pool.execute('DELETE FROM permisos_vendedores WHERE id_vendedor = ?', [userId]);
    await pool.execute('DELETE FROM propuestas_clientes WHERE id_vendedor = ?', [userId]);
    await pool.execute('DELETE FROM usuarios WHERE id_usuario = ?', [userId]);

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Eliminar usuario',
      modulo: 'Usuarios',
      detalle: { id_usuario_eliminado: userId },
      ip_address: req.ip
    });

    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const [usuario] = await pool.execute(
      'SELECT estado FROM usuarios WHERE id_usuario = ?',
      [req.params.id]
    );

    if (usuario.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const nuevoEstado = !usuario[0].estado;
    await pool.execute('UPDATE usuarios SET estado = ? WHERE id_usuario = ?', [nuevoEstado, req.params.id]);

    res.json({
      mensaje: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`,
      estado: nuevoEstado
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { nueva_contrasena } = req.body;
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(nueva_contrasena || 'sifga123', salt);

    await pool.execute('UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?',
      [contrasenaHash, req.params.id]);

    res.json({ mensaje: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    next(error);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const [roles] = await pool.execute('SELECT id_rol, nombre, descripcion FROM roles WHERE activo = TRUE');
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove, toggleStatus, resetPassword, getRoles };
