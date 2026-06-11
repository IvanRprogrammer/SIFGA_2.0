const pool = require('../config/database');
const { registrarAuditoria } = require('../utils/auditoria');
const { generarCodigoFactura, calcularValoresFactura, calcularMoraCliente } = require('../utils/helpers');

const getAll = async (req, res, next) => {
  try {
    const { id_cliente, estado, desde, hasta } = req.query;
    let query = `
      SELECT f.*, c.nombres, c.apellidos, c.cedula, c.numero_contador,
             ef.nombre AS estado_nombre
      FROM facturas f
      JOIN clientes c ON c.id_cliente = f.id_cliente
      JOIN estados_factura ef ON ef.id_estado_factura = f.id_estado
    `;
    const conditions = [];
    const params = [];

    if (id_cliente) {
      conditions.push('f.id_cliente = ?');
      params.push(id_cliente);
    }
    if (estado) {
      conditions.push('f.id_estado = ?');
      params.push(estado);
    }
    if (desde) {
      conditions.push('f.fecha_emision >= ?');
      params.push(desde);
    }
    if (hasta) {
      conditions.push('f.fecha_emision <= ?');
      params.push(hasta);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY f.created_at DESC';

    const [facturas] = await pool.execute(query, params);

    res.json(facturas);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const [facturas] = await pool.execute(
      `SELECT f.*, c.nombres, c.apellidos, c.cedula, c.direccion, c.numero_contador,
              c.telefono, c.correo, m.nombre AS municipio, e.numero AS estrato_numero,
              ef.nombre AS estado_nombre, u.nombre AS usuario_creacion
       FROM facturas f
       JOIN clientes c ON c.id_cliente = f.id_cliente
       LEFT JOIN municipios m ON m.id_municipio = c.id_municipio
       LEFT JOIN estratos e ON e.id_estrato = c.id_estrato
       JOIN estados_factura ef ON ef.id_estado_factura = f.id_estado
       LEFT JOIN usuarios u ON u.id_usuario = f.id_usuario_creacion
       WHERE f.id_factura = ?`,
      [req.params.id]
    );

    if (facturas.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const factura = facturas[0];

    const [pagos] = await pool.execute(
      `SELECT p.*, mp.nombre AS medio_pago_nombre
       FROM pagos p
       JOIN medios_pago mp ON mp.id_medio_pago = p.id_medio_pago
       WHERE p.id_factura = ?
       ORDER BY p.fecha_pago DESC`,
      [req.params.id]
    );

    factura.pagos = pagos;

    res.json(factura);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { id_cliente, periodo, fecha_lectura, fecha_vencimiento, lectura_actual, observaciones } = req.body;

    const [clientes] = await pool.execute(
      `SELECT c.*, e.porcentaje_subsidio
       FROM clientes c
       LEFT JOIN estratos e ON e.id_estrato = c.id_estrato
       WHERE c.id_cliente = ?`,
      [id_cliente]
    );

    if (clientes.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const cliente = clientes[0];

    const [ultimaLectura] = await pool.execute(
      'SELECT lectura_actual FROM lecturas WHERE id_cliente = ? ORDER BY fecha_lectura DESC LIMIT 1',
      [id_cliente]
    );

    const lecturaAnterior = ultimaLectura.length > 0 ? ultimaLectura[0].lectura_actual : 0;

    // Check for special rates
    const [tarifasEsp] = await pool.execute(
      'SELECT * FROM tarifas_especiales WHERE id_cliente = ?',
      [id_cliente]
    );

    // Get system configuration
    const [configs] = await pool.execute('SELECT * FROM configuracion LIMIT 1');
    const config = configs[0];

    const tarifaAgua = tarifasEsp.length > 0 && tarifasEsp[0].tarifa_agua_m3
      ? tarifasEsp[0].tarifa_agua_m3 : config.tarifa_agua_m3;
    const plazoPago = tarifasEsp.length > 0 && tarifasEsp[0].plazo_pago_dias
      ? tarifasEsp[0].plazo_pago_dias : config.plazo_pago_dias;

    const consumoM3 = parseFloat(lectura_actual) - parseFloat(lecturaAnterior);

    if (consumoM3 < 0) {
      return res.status(400).json({ error: 'La lectura actual no puede ser menor que la anterior' });
    }

    const moraAnterior = await calcularMoraCliente(pool, id_cliente, config.interes_mora_porcentaje);

    const valores = calcularValoresFactura(
      consumoM3, tarifaAgua,
      config.tarifa_alcantarillado_porcentaje,
      config.tarifa_aseo_porcentaje,
      cliente.porcentaje_subsidio || 0,
      config.cargo_fijo,
      moraAnterior
    );

    const codigoFactura = await generarCodigoFactura(pool);

    const [lecturaResult] = await pool.execute(
      `INSERT INTO lecturas (id_cliente, id_usuario, fecha_lectura, lectura_anterior, lectura_actual, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_cliente, req.user.id_usuario, fecha_lectura || new Date(), lecturaAnterior, lectura_actual, observaciones || null]
    );

    const idLectura = lecturaResult.insertId;
    const fechaEmision = new Date().toISOString().split('T')[0];
    const fechaVenc = fecha_vencimiento || new Date(Date.now() + plazoPago * 86400000).toISOString().split('T')[0];

    const [facturaResult] = await pool.execute(
      `INSERT INTO facturas
        (codigo_factura, id_cliente, id_lectura, periodo, fecha_emision, fecha_vencimiento, id_estado,
         lectura_anterior, lectura_actual, consumo_m3,
         tarifa_agua, valor_agua, valor_alcantarillado, valor_aseo,
         subtotal, porcentaje_subsidio, descuento_subsidio, contribucion,
         cargo_fijo, mora_anterior, total_pagar, id_usuario_creacion)
       VALUES (?, ?, ?, ?, ?, ?, 1,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?)`,
      [
        codigoFactura, id_cliente, idLectura, periodo, fechaEmision, fechaVenc,
        lecturaAnterior, lectura_actual, consumoM3,
        tarifaAgua, valores.valorAgua, valores.valorAlcantarillado, valores.valorAseo,
        valores.subtotal, cliente.porcentaje_subsidio || 0, valores.descuentoSubsidio, valores.contribucion,
        valores.cargoFijo, valores.moraAnterior, valores.totalPagar,
        req.user.id_usuario
      ]
    );

    // Update client debt
    await pool.execute(
      'UPDATE clientes SET deuda_actual = deuda_actual + ? WHERE id_cliente = ?',
      [valores.totalPagar, id_cliente]
    );

    await registrarAuditoria({
      id_usuario: req.user.id_usuario,
      accion: 'Generar factura',
      modulo: 'Facturación',
      detalle: {
        id_factura: facturaResult.insertId,
        codigo_factura: codigoFactura,
        id_cliente,
        total: valores.totalPagar
      },
      ip_address: req.ip
    });

    res.status(201).json({
      mensaje: 'Factura generada exitosamente',
      id_factura: facturaResult.insertId,
      codigo_factura: codigoFactura,
      total_pagar: valores.totalPagar,
      consumo_m3: consumoM3
    });
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
    const [facturas] = await pool.execute(
      `SELECT f.*, c.nombres, c.apellidos, c.cedula, c.numero_contador,
              ef.nombre AS estado_nombre
       FROM facturas f
       JOIN clientes c ON c.id_cliente = f.id_cliente
       JOIN estados_factura ef ON ef.id_estado_factura = f.id_estado
       WHERE f.codigo_factura LIKE ? OR c.cedula LIKE ? OR c.numero_contador LIKE ?
          OR CONCAT(c.nombres, ' ', c.apellidos) LIKE ?
       ORDER BY f.fecha_emision DESC
       LIMIT 30`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json(facturas);
  } catch (error) {
    next(error);
  }
};

const getEstados = async (req, res, next) => {
  try {
    const [estados] = await pool.execute('SELECT id_estado_factura, nombre FROM estados_factura');
    res.json(estados);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, search, getEstados };
