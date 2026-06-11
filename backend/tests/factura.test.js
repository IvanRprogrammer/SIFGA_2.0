jest.mock('../src/config/database', () => require('./__mocks__/config/database'));
jest.mock('../src/utils/auditoria', () => require('./__mocks__/utils/auditoria'));
jest.mock('../src/utils/helpers', () => require('./__mocks__/utils/helpers'));

const { mockExecute } = require('../src/config/database');
const { registrarAuditoria } = require('../src/utils/auditoria');
const { generarCodigoFactura, calcularValoresFactura, calcularMoraCliente } = require('../src/utils/helpers');
const controller = require('../src/controllers/facturaController');

const mockReq = (overrides = {}) => ({ body: {}, ip: '127.0.0.1', user: { id_usuario: 1 }, params: {}, query: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

beforeEach(() => { jest.clearAllMocks(); });

describe('Factura Controller - getAll', () => {
  const facturas = [
    { id_factura: 1, codigo_factura: 'FAC-2026-000001', nombres: 'Carlos', apellidos: 'Mendoza', estado_nombre: 'Pendiente', total_pagar: 50000 },
    { id_factura: 2, codigo_factura: 'FAC-2026-000002', nombres: 'Ana', apellidos: 'Lopez', estado_nombre: 'Pagada', total_pagar: 35000 }
  ];

  it('should return all facturas without filters', async () => {
    mockExecute.mockResolvedValueOnce([facturas]);
    const req = mockReq({ query: {} });
    const res = mockRes();
    await controller.getAll(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(facturas);
  });

  it('should filter by id_cliente', async () => {
    mockExecute.mockResolvedValueOnce([[facturas[0]]]);
    const req = mockReq({ query: { id_cliente: '1' } });
    const res = mockRes();
    await controller.getAll(req, res, mockNext);
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('id_cliente = ?'), ['1']);
  });

  it('should filter by estado', async () => {
    mockExecute.mockResolvedValueOnce([[facturas[1]]]);
    const req = mockReq({ query: { estado: '2' } });
    const res = mockRes();
    await controller.getAll(req, res, mockNext);
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('id_estado = ?'), ['2']);
  });

  it('should call next on error', async () => {
    const err = new Error('DB error');
    mockExecute.mockRejectedValueOnce(err);
    await controller.getAll(mockReq({ query: {} }), mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(err);
  });
});

describe('Factura Controller - getById', () => {
  const facturaConPagos = {
    id_factura: 1, codigo_factura: 'FAC-2026-000001', nombres: 'Carlos', apellidos: 'Mendoza',
    estado_nombre: 'Pendiente', total_pagar: 50000, pagos: []
  };

  it('should return a factura with pagos', async () => {
    mockExecute.mockResolvedValueOnce([[facturaConPagos]]);
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({ params: { id: 1 } });
    const res = mockRes();
    await controller.getById(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ codigo_factura: 'FAC-2026-000001' }));
  });

  it('should return 404 if factura not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({ params: { id: 999 } });
    const res = mockRes();
    await controller.getById(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Factura no encontrada' });
  });
});

describe('Factura Controller - create', () => {
  it('should create a factura from lectura', async () => {
    const bcrypt = require('bcryptjs');
    bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
    bcrypt.hash = jest.fn().mockResolvedValue('hashed');
    mockExecute.mockResolvedValueOnce([[{
      id_cliente: 1, nombres: 'Carlos', apellidos: 'Mendoza',
      porcentaje_subsidio: 15, deuda_actual: 0
    }]]);
    mockExecute.mockResolvedValueOnce([[]]);
    mockExecute.mockResolvedValueOnce([[]]);
    mockExecute.mockResolvedValueOnce([[{
      tarifa_agua_m3: 1200, cargo_fijo: 8500, tarifa_alcantarillado_porcentaje: 40,
      tarifa_aseo_porcentaje: 20, interes_mora_porcentaje: 1.5, plazo_pago_dias: 30
    }]]);
    generarCodigoFactura.mockResolvedValue('FAC-2026-000001');
    calcularValoresFactura.mockReturnValue({
      valorAgua: 60000, valorAlcantarillado: 24000, valorAseo: 12000,
      subtotal: 96000, descuentoSubsidio: 5000, contribucion: 2000,
      cargoFijo: 8500, moraAnterior: 0, totalPagar: 101500
    });
    calcularMoraCliente.mockResolvedValue(0);
    mockExecute.mockResolvedValueOnce([{ insertId: 5 }]);
    mockExecute.mockResolvedValueOnce([{ insertId: 1 }]);
    mockExecute.mockResolvedValueOnce([[]]);

    const req = mockReq({
      body: { id_cliente: 1, lectura_actual: 150, periodo: '2026-01', fecha_vencimiento: '2026-02-15' },
      user: { id_usuario: 1 }
    });
    const res = mockRes();
    await controller.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Factura generada exitosamente' }));
    expect(registrarAuditoria).toHaveBeenCalled();
  });

  it('should return 404 if cliente not found for factura creation', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({
      body: { id_cliente: 999, lectura_actual: 150, periodo: '2026-01' },
      user: { id_usuario: 1 }
    });
    const res = mockRes();
    await controller.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cliente no encontrado' });
  });
});

describe('Factura Controller - search', () => {
  it('should search facturas by term', async () => {
    const results = [{ id_factura: 1, codigo_factura: 'FAC-2026-000001' }];
    mockExecute.mockResolvedValueOnce([results]);
    const req = mockReq({ query: { termino: 'FAC-2026' } });
    const res = mockRes();
    await controller.search(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(results);
  });
});

describe('Factura Controller - getEstados', () => {
  it('should return estados de factura', async () => {
    const estados = [{ id_estado_factura: 1, nombre: 'Pendiente' }];
    mockExecute.mockResolvedValueOnce([estados]);
    await controller.getEstados(mockReq(), mockRes(), mockNext);
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('estados_factura'));
  });
});
