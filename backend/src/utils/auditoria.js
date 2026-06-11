const pool = require('../config/database');

const registrarAuditoria = async ({ id_usuario, accion, modulo, detalle, ip_address }) => {
  try {
    await pool.execute(
      `INSERT INTO auditoria (id_usuario, accion, modulo, detalle, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id_usuario || null,
        accion,
        modulo,
        detalle ? JSON.stringify(detalle) : null,
        ip_address || null
      ]
    );
  } catch (error) {
    console.error('Error registrando auditoría:', error.message);
  }
};

module.exports = { registrarAuditoria };
