const pool = require('../config/database');
const { registrarAuditoria } = require('../utils/auditoria');

const getConfig = async (req, res, next) => {
  try {
    const [configs] = await pool.execute('SELECT * FROM configuracion LIMIT 1');
    if (configs.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    res.json(configs[0]);
  } catch (error) {
    next(error);
  }
};

const updateConfig = async (req, res, next) => {
  try {
    const allowed = ['tarifa_agua_m3', 'tarifa_alcantarillado_porcentaje', 'tarifa_aseo_porcentaje',
      'plazo_pago_dias', 'interes_mora_porcentaje', 'cargo_fijo'];

    const fields = [];
    const params = [];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    await pool.execute(`UPDATE configuracion SET ${fields.join(', ')} WHERE id_config = 1`, params);

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Actualizar configuración general',
      modulo: 'Configuración',
      detalle: req.body,
      ip_address: req.ip
    });

    res.json({ mensaje: 'Configuración actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
};

const getSpecialRates = async (req, res, next) => {
  try {
    const [tarifas] = await pool.execute(
      `SELECT te.*, c.nombres, c.apellidos, c.cedula, c.numero_contador
       FROM tarifas_especiales te
       JOIN clientes c ON c.id_cliente = te.id_cliente`
    );
    res.json(tarifas);
  } catch (error) {
    next(error);
  }
};

const setSpecialRate = async (req, res, next) => {
  try {
    const { id_cliente, tarifa_agua_m3, plazo_pago_dias } = req.body;

    const [existing] = await pool.execute(
      'SELECT id_tarifa_especial FROM tarifas_especiales WHERE id_cliente = ?',
      [id_cliente]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE tarifas_especiales SET tarifa_agua_m3 = COALESCE(?, tarifa_agua_m3),
          plazo_pago_dias = COALESCE(?, plazo_pago_dias)
         WHERE id_cliente = ?`,
        [tarifa_agua_m3 || null, plazo_pago_dias || null, id_cliente]
      );
    } else {
      await pool.execute(
        `INSERT INTO tarifas_especiales (id_cliente, tarifa_agua_m3, plazo_pago_dias)
         VALUES (?, ?, ?)`,
        [id_cliente, tarifa_agua_m3 || null, plazo_pago_dias || null]
      );
    }

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: existing.length > 0 ? 'Actualizar tarifa especial' : 'Crear tarifa especial',
      modulo: 'Configuración',
      detalle: { id_cliente, tarifa_agua_m3, plazo_pago_dias },
      ip_address: req.ip
    });

    res.json({ mensaje: 'Tarifa especial guardada exitosamente' });
  } catch (error) {
    next(error);
  }
};

const deleteSpecialRate = async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM tarifas_especiales WHERE id_cliente = ?', [req.params.clienteId]);

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Eliminar tarifa especial',
      modulo: 'Configuración',
      detalle: { id_cliente: parseInt(req.params.clienteId) },
      ip_address: req.ip
    });

    res.json({ mensaje: 'Tarifa especial eliminada' });
  } catch (error) {
    next(error);
  }
};

const getPermissions = async (req, res, next) => {
  try {
    const [permisos] = await pool.execute(
      `SELECT pv.*, tp.nombre AS tipo_permiso_nombre,
              v.nombre AS vendedor_nombre, v.apellido AS vendedor_apellido,
              c.nombres AS cliente_nombre, c.apellidos AS cliente_apellidos, c.numero_contador
       FROM permisos_vendedores pv
       JOIN tipos_permiso tp ON tp.id_tipo_permiso = pv.id_tipo_permiso
       JOIN usuarios v ON v.id_usuario = pv.id_vendedor
       JOIN clientes c ON c.id_cliente = pv.id_cliente
       ORDER BY pv.created_at DESC`
    );
    res.json(permisos);
  } catch (error) {
    next(error);
  }
};

const setPermission = async (req, res, next) => {
  try {
    const { id_vendedor, id_cliente, id_tipo_permiso, fecha_expiracion } = req.body;

    await pool.execute(
      `INSERT INTO permisos_vendedores (id_vendedor, id_cliente, id_tipo_permiso, fecha_expiracion)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE activo = TRUE, fecha_expiracion = COALESCE(?, fecha_expiracion)`,
      [id_vendedor, id_cliente, id_tipo_permiso, fecha_expiracion || null, fecha_expiracion || null]
    );

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Otorgar permiso',
      modulo: 'Configuración',
      detalle: { id_vendedor, id_cliente, id_tipo_permiso },
      ip_address: req.ip
    });

    res.json({ mensaje: 'Permiso otorgado exitosamente' });
  } catch (error) {
    next(error);
  }
};

const revokePermission = async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM permisos_vendedores WHERE id_permiso = ?', [req.params.id]);

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Revocar permiso',
      modulo: 'Configuración',
      detalle: { id_permiso: parseInt(req.params.id) },
      ip_address: req.ip
    });

    res.json({ mensaje: 'Permiso revocado' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConfig, updateConfig,
  getSpecialRates, setSpecialRate, deleteSpecialRate,
  getPermissions, setPermission, revokePermission
};
