const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { registrarAuditoria } = require('../utils/auditoria');
const { sendPasswordResetEmail } = require('../utils/mailer');
require('dotenv').config();

const login = async (req, res, next) => {
  try {
    const { correo, contrasena } = req.body;

    const [usuarios] = await pool.execute(
      'SELECT u.*, r.nombre AS rol_nombre FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol WHERE u.correo = ?',
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = usuarios[0];

    if (!usuario.estado) {
      return res.status(403).json({ error: 'Cuenta desactivada, contacte al administrador' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    await pool.execute(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?',
      [usuario.id_usuario]
    );

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo,
        id_rol: usuario.id_rol,
        rol: usuario.rol_nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await registrarAuditoria({
      id_usuario: usuario.id_usuario,
      accion: 'Inicio de sesión',
      modulo: 'Auth',
      ip_address: req.ip
    });

    res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        usuario: usuario.usuario,
        rol: usuario.rol_nombre,
        id_rol: usuario.id_rol,
        id_cliente: usuario.id_cliente
      }
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { nombre, apellido, correo, usuario, contrasena, id_rol } = req.body;

    const [existing] = await pool.execute(
      'SELECT id_usuario FROM usuarios WHERE correo = ? OR usuario = ?',
      [correo, usuario]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'El correo o usuario ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(contrasena, salt);

    const [result] = await pool.execute(
      'INSERT INTO usuarios (nombre, apellido, correo, usuario, contrasena, id_rol) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, apellido || null, correo, usuario, contrasenaHash, id_rol]
    );

    await registrarAuditoria({
      id_usuario: result.insertId,
      accion: 'Registro de usuario',
      modulo: 'Auth',
      detalle: { id_usuario_creado: result.insertId, rol: id_rol },
      ip_address: req.ip
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      id_usuario: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { correo } = req.body;

    const [usuarios] = await pool.execute(
      'SELECT id_usuario FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (usuarios.length === 0) {
      return res.json({ mensaje: 'Si el correo existe, recibirá instrucciones para restablecer su contraseña' });
    }

    const resetToken = jwt.sign(
      { id_usuario: usuarios[0].id_usuario, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetExpires = new Date(Date.now() + 3600000);
    await pool.execute(
      'UPDATE usuarios SET reset_token = ?, reset_expires = ? WHERE id_usuario = ?',
      [resetToken, resetExpires, usuarios[0].id_usuario]
    );

    await sendPasswordResetEmail(correo, resetToken);

    res.json({ mensaje: 'Si el correo existe, recibirá instrucciones para restablecer su contraseña' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, nueva_contrasena } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Token inválido' });
    }

    const [usuarios] = await pool.execute(
      'SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND reset_token = ? AND reset_expires > NOW()',
      [decoded.id_usuario, token]
    );

    if (usuarios.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(nueva_contrasena, salt);

    await pool.execute(
      'UPDATE usuarios SET contrasena = ?, reset_token = NULL, reset_expires = NULL WHERE id_usuario = ?',
      [contrasenaHash, decoded.id_usuario]
    );

    res.json({ mensaje: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const [usuarios] = await pool.execute(
      `SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.usuario, u.id_rol, u.id_cliente,
              r.nombre AS rol, u.estado, u.ultimo_acceso, u.created_at
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = ?`,
      [req.user.id_usuario]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuarios[0]);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { contrasena_actual, nueva_contrasena } = req.body;

    const [usuarios] = await pool.execute(
      'SELECT contrasena FROM usuarios WHERE id_usuario = ?',
      [req.user.id_usuario]
    );

    const valida = await bcrypt.compare(contrasena_actual, usuarios[0].contrasena);
    if (!valida) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(nueva_contrasena, salt);

    await pool.execute(
      'UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?',
      [contrasenaHash, req.user.id_usuario]
    );

    res.json({ mensaje: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, forgotPassword, resetPassword, getProfile, changePassword };
