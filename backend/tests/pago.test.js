jest.mock('../src/config/database', () => require('./__mocks__/config/database'));
jest.mock('../src/utils/auditoria', () => require('./__mocks__/utils/auditoria'));

const { mockExecute } = require('../src/config/database');
const { registrarAuditoria } = require('../src/utils/auditoria');
const controller = require('../src/controllers/pagoController');

const mockReq = (overrides = {}) => ({ body: {}, ip: '127.0.0.1', user: { id_usuario: 1 }, params: {}, query: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

beforeEach(() => { jest.clearAllMocks(); });

describe('Pago Controller - getAll', () => {
  const pagos = [
    { id_pago: 1, codigo_factura: 'FAC-2026-000001', nombres: 'Carlos', apellidos: 'Mendoza', valor: 50000, medio_pago_nombre: 'Efectivo', fecha_pago: '2026-01-20' },
    { id_pago: 2, codigo_factura: 'FAC-2026-000002', nombres: 'Ana', apellidos: 'Lopez', valor: 35000, medio_pago_nombre: 'Transferencia', fecha_pago: '2026-01-21' }
  ];

  it('should return all pagos without filters', async () => {
    mockExecute.mockResolvedValueOnce([pagos]);
    const req = mockReq({ query: {} });
    const res = mockRes();
    await controller.getAll(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(pagos);
  });

  it('should filter by id_cliente', async () => {
    mockExecute.mockResolvedValueOnce([[pagos[0]]]);
    const req = mockReq({ query: { id_cliente: '1' } });
    const res = mockRes();
    await controller.getAll(req, res, mockNext);
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('id_cliente = ?'), ['1']);
  });

  it('should call next on error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    await controller.getAll(mockReq({ query: {} }), mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('Pago Controller - create', () => {
  const facturaPendiente = {
    id_factura: 1, id_cliente: 1, id_estado: 1, estado_nombre: 'Pendiente',
    total_pagar: 50000, codigo_factura: 'FAC-2026-000001'
  };

  it('should create a pago successfully for pending factura', async () => {
    mockExecute.mockResolvedValueOnce([[facturaPendiente]]);
    mockExecute.mockResolvedValueOnce([{ insertId: 1 }]);
    mockExecute.mockResolvedValueOnce([[]]);

    const req = mockReq({
      body: { id_factura: 1, id_medio_pago: 1, valor: 50000, referencia: 'REF-001', fecha_pago: '2026-01-20' },
      user: { id_usuario: 1 }
    });
    const res = mockRes();
    await controller.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Pago registrado exitosamente' }));
    expect(registrarAuditoria).toHaveBeenCalled();
  });

  it('should return 404 if factura not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({ body: { id_factura: 999, id_medio_pago: 1, valor: 50000 } });
    const res = mockRes();
    await controller.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Factura no encontrada' });
  });

  it('should return 400 if factura already paid', async () => {
    mockExecute.mockResolvedValueOnce([[{ ...facturaPendiente, id_estado: 2 }]]);
    const req = mockReq({ body: { id_factura: 1, id_medio_pago: 1, valor: 50000 } });
    const res = mockRes();
    await controller.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'La factura ya está pagada' });
  });

  it('should return 400 if factura is anulada', async () => {
    mockExecute.mockResolvedValueOnce([[{ ...facturaPendiente, id_estado: 4 }]]);
    const req = mockReq({ body: { id_factura: 1, id_medio_pago: 1, valor: 50000 } });
    const res = mockRes();
    await controller.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No se puede pagar una factura anulada' });
  });
});

describe('Pago Controller - getMediosPago', () => {
  it('should return medios de pago', async () => {
    const medios = [{ id_medio_pago: 1, nombre: 'Efectivo' }, { id_medio_pago: 2, nombre: 'Transferencia' }];
    mockExecute.mockResolvedValueOnce([medios]);
    await controller.getMediosPago(mockReq(), mockRes(), mockNext);
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('medios_pago'));
  });
});

describe('Pago Controller - getResumenMunicipio', () => {
  it('should return resumen por municipios', async () => {
    const resumen = [{ municipio: 'Bogotá', total_pagos: 100000, cantidad: 5 }];
    mockExecute.mockResolvedValueOnce([resumen]);
    await controller.getResumenMunicipio(mockReq(), mockRes(), mockNext);
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('vw_resumen_recaudos'));
  });
});
