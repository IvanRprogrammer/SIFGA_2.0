jest.mock('../src/config/database', () => require('./__mocks__/config/database'));
jest.mock('../src/utils/auditoria', () => require('./__mocks__/utils/auditoria'));

const { mockExecute } = require('../src/config/database');
const { registrarAuditoria } = require('../src/utils/auditoria');
const controller = require('../src/controllers/lecturaController');

const mockReq = (overrides = {}) => ({ body: {}, ip: '127.0.0.1', user: { id_usuario: 1 }, params: {}, query: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

beforeEach(() => { jest.clearAllMocks(); });

describe('Lectura Controller - getAll', () => {
  const lecturas = [
    { id_lectura: 1, id_cliente: 1, nombres: 'Carlos', apellidos: 'Mendoza', lectura_actual: 150, lectura_anterior: 100, fecha_lectura: '2026-01-15' },
    { id_lectura: 2, id_cliente: 2, nombres: 'Ana', apellidos: 'Lopez', lectura_actual: 200, lectura_anterior: 180, fecha_lectura: '2026-01-16' }
  ];

  it('should return all lecturas', async () => {
    mockExecute.mockResolvedValueOnce([lecturas]);
    const req = mockReq({ query: {} });
    const res = mockRes();
    await controller.getAll(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(lecturas);
  });

  it('should filter by id_cliente', async () => {
    mockExecute.mockResolvedValueOnce([[lecturas[0]]]);
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

describe('Lectura Controller - getById', () => {
  it('should return a lectura by id', async () => {
    const lectura = { id_lectura: 1, id_cliente: 1, lectura_actual: 150 };
    mockExecute.mockResolvedValueOnce([[lectura]]);
    const req = mockReq({ params: { id: 1 } });
    const res = mockRes();
    await controller.getById(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(lectura);
  });

  it('should return 404 if lectura not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({ params: { id: 999 } });
    const res = mockRes();
    await controller.getById(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Lectura no encontrada' });
  });
});

describe('Lectura Controller - create', () => {
  it('should create a lectura successfully', async () => {
    mockExecute.mockResolvedValueOnce([[{ id_cliente: 1 }]]);
    mockExecute.mockResolvedValueOnce([[]]);
    mockExecute.mockResolvedValueOnce([{ insertId: 3 }]);

    const req = mockReq({
      body: { id_cliente: 1, lectura_actual: 150, fecha_lectura: '2026-01-15', observaciones: 'Lectura normal' },
      user: { id_usuario: 1 }
    });
    const res = mockRes();
    await controller.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Lectura registrada exitosamente' }));
    expect(registrarAuditoria).toHaveBeenCalled();
  });

  it('should return 404 if cliente not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({ body: { id_cliente: 999, lectura_actual: 150 } });
    const res = mockRes();
    await controller.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cliente no encontrado' });
  });

  it('should return 400 if lectura_actual < lectura_anterior', async () => {
    mockExecute.mockResolvedValueOnce([[{ id_cliente: 1 }]]);
    mockExecute.mockResolvedValueOnce([[{ lectura_actual: 200 }]]);
    const req = mockReq({ body: { id_cliente: 1, lectura_actual: 100 } });
    const res = mockRes();
    await controller.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('menor') }));
  });
});

describe('Lectura Controller - getHistorialByCliente', () => {
  it('should return historial for a cliente', async () => {
    const historial = [
      { id_lectura: 1, fecha_lectura: '2026-01-15', lectura_anterior: 100, lectura_actual: 150, consumo: 50 }
    ];
    mockExecute.mockResolvedValueOnce([historial]);
    const req = mockReq({ params: { clienteId: 1 } });
    const res = mockRes();
    await controller.getHistorialByCliente(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(historial);
  });
});
