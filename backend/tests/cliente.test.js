jest.mock('../src/config/database', () => require('./__mocks__/config/database'));
jest.mock('../src/utils/auditoria', () => require('./__mocks__/utils/auditoria'));

const { mockExecute } = require('../src/config/database');
const { registrarAuditoria } = require('../src/utils/auditoria');
const controller = require('../src/controllers/clienteController');

const mockReq = (overrides = {}) => ({ body: {}, ip: '127.0.0.1', user: { id_usuario: 1 }, params: {}, query: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

beforeEach(() => { jest.clearAllMocks(); });

describe('Cliente Controller - getAll', () => {
  const clientes = [
    { id_cliente: 1, nombres: 'Carlos', apellidos: 'Mendoza', cedula: '12345', estado: 'activo', municipio: 'Bogotá', estrato_numero: 3 },
    { id_cliente: 2, nombres: 'Ana', apellidos: 'Lopez', cedula: '67890', estado: 'activo', municipio: 'Medellín', estrato_numero: 2 }
  ];

  it('should return all active clients when no filter', async () => {
    mockExecute.mockResolvedValueOnce([clientes]);
    const req = mockReq({ query: {} });
    const res = mockRes();
    await controller.getAll(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(clientes);
  });

  it('should filter by estado', async () => {
    mockExecute.mockResolvedValueOnce([[clientes[0]]]);
    const req = mockReq({ query: { estado: 'activo' } });
    const res = mockRes();
    await controller.getAll(req, res, mockNext);
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('WHERE'), ['activo']);
    expect(res.json).toHaveBeenCalled();
  });

  it('should call next on error', async () => {
    const err = new Error('DB error');
    mockExecute.mockRejectedValueOnce(err);
    await controller.getAll(mockReq({ query: {} }), mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(err);
  });
});

describe('Cliente Controller - getById', () => {
  it('should return a client by id', async () => {
    const cliente = { id_cliente: 1, nombres: 'Carlos', apellidos: 'Mendoza', cedula: '12345' };
    mockExecute.mockResolvedValueOnce([[cliente]]);
    const req = mockReq({ params: { id: 1 } });
    const res = mockRes();
    await controller.getById(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(cliente);
  });

  it('should return 404 if client not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({ params: { id: 999 } });
    const res = mockRes();
    await controller.getById(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cliente no encontrado' });
  });
});

describe('Cliente Controller - create', () => {
  const newClient = {
    nombres: 'Pedro', apellidos: 'Ramirez', cedula: '111222', direccion: 'Calle 123',
    telefono: '555-0100', correo: 'pedro@test.com', numero_contador: 'CTR-001', id_municipio: 1, id_estrato: 2
  };

  it('should create a client successfully', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    mockExecute.mockResolvedValueOnce([{ insertId: 3 }]);
    const req = mockReq({ body: newClient, user: { id_usuario: 1 } });
    const res = mockRes();
    await controller.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id_cliente: 3 }));
    expect(registrarAuditoria).toHaveBeenCalled();
  });

  it('should return 409 if cedula or contador already exists', async () => {
    mockExecute.mockResolvedValueOnce([[{ id_cliente: 1 }]]);
    const req = mockReq({ body: newClient });
    const res = mockRes();
    await controller.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'La cédula o número de contador ya existe' });
  });
});

describe('Cliente Controller - search', () => {
  it('should search clients by term', async () => {
    const results = [{ id_cliente: 1, nombres: 'Carlos', apellidos: 'Mendoza' }];
    mockExecute.mockResolvedValueOnce([results]);
    const req = mockReq({ query: { termino: 'Carlos' } });
    const res = mockRes();
    await controller.search(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(results);
  });

  it('should return 400 if no search term provided', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();
    await controller.search(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Cliente Controller - getPendingProposals', () => {
  it('should return pending proposals', async () => {
    const proposals = [{ id_cliente: 1, nombres: 'Nuevo', apellidos: 'Cliente', estado: 'pendiente' }];
    mockExecute.mockResolvedValueOnce([proposals]);
    const req = mockReq();
    const res = mockRes();
    await controller.getPendingProposals(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(proposals);
  });
});

describe('Cliente Controller - approveProposal', () => {
  it('should approve a client proposal and create user', async () => {
    const bcrypt = require('bcryptjs');
    bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
    bcrypt.hash = jest.fn().mockResolvedValue('hashed');
    mockExecute.mockResolvedValueOnce([[{
      id_propuesta: 1, id_estado: 1, nombres: 'Nuevo', apellidos: 'Cliente',
      cedula: '99999', correo: 'nuevo@test.com', direccion: 'Calle 1',
      telefono: '555-0000', numero_contador: 'CTR-NEW',
      id_municipio: 1, id_estrato: 2
    }]]);
    mockExecute.mockResolvedValueOnce([{ insertId: 10 }]);
    mockExecute.mockResolvedValueOnce([{ insertId: 5 }]);
    mockExecute.mockResolvedValueOnce([[]]);

    const req = mockReq({ params: { id: 1 }, body: { contrasena_asignada: 'temp123' } });
    const res = mockRes();
    await controller.approveProposal(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Cliente aprobado y creado exitosamente' }));
    expect(registrarAuditoria).toHaveBeenCalledWith(expect.objectContaining({ accion: 'Aprobar propuesta cliente' }));
  });

  it('should return 404 if proposal not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({ params: { id: 999 }, body: { contrasena_asignada: 'temp123' } });
    const res = mockRes();
    await controller.approveProposal(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('Cliente Controller - rejectProposal', () => {
  it('should reject a client proposal', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({ params: { id: 1 }, body: { observaciones: 'Documentos incompletos' } });
    const res = mockRes();
    await controller.rejectProposal(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Propuesta rechazada' }));
  });
});

describe('Cliente Controller - getMunicipios / getEstratos', () => {
  it('should return municipios list', async () => {
    const municipios = [{ id_municipio: 1, nombre: 'Bogotá' }];
    mockExecute.mockResolvedValueOnce([municipios]);
    await controller.getMunicipios(mockReq(), mockRes(), mockNext);
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('municipios'));
  });

  it('should return estratos list', async () => {
    const estratos = [{ id_estrato: 1, numero: 1, nombre: 'Bajo' }];
    mockExecute.mockResolvedValueOnce([estratos]);
    await controller.getEstratos(mockReq(), mockRes(), mockNext);
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('estratos'));
  });
});
