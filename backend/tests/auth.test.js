jest.mock('../src/config/database', () => require('./__mocks__/config/database'));
jest.mock('../src/utils/auditoria', () => require('./__mocks__/utils/auditoria'));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { mockExecute } = require('../src/config/database');
const { registrarAuditoria } = require('../src/utils/auditoria');
const { login, register, forgotPassword, resetPassword, getProfile, changePassword } = require('../src/controllers/authController');

const mockReq = (overrides = {}) => ({
  body: {}, ip: '127.0.0.1', user: {}, params: {},
  ...overrides
});
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test_secret';
  process.env.JWT_EXPIRES_IN = '8h';
});

describe('Auth Controller - login', () => {
  const validUser = {
    id_usuario: 1, nombre: 'Admin', apellido: 'SIFGA', correo: 'admin@sifga.com',
    usuario: 'admin', contrasena: '$2a$10$hashedpassword', id_rol: 1,
    id_cliente: null, rol_nombre: 'administrador', estado: 1
  };

  it('should login successfully with valid credentials', async () => {
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    jwt.sign = jest.fn().mockReturnValue('fake-jwt-token');
    mockExecute.mockResolvedValueOnce([[validUser]]);
    mockExecute.mockResolvedValueOnce([[]]);

    const req = mockReq({ body: { correo: 'admin@sifga.com', contrasena: 'admin123' } });
    const res = mockRes();
    await login(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      token: 'fake-jwt-token',
      usuario: expect.objectContaining({ correo: 'admin@sifga.com', id_rol: 1 })
    }));
    expect(registrarAuditoria).toHaveBeenCalledWith(expect.objectContaining({ accion: 'Inicio de sesión' }));
  });

  it('should return 401 if user not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({ body: { correo: 'notfound@test.com', contrasena: 'x' } });
    const res = mockRes();
    await login(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
  });

  it('should return 403 if account is disabled', async () => {
    mockExecute.mockResolvedValueOnce([[{ ...validUser, estado: 0 }]]);
    const req = mockReq({ body: { correo: 'disabled@test.com', contrasena: 'x' } });
    const res = mockRes();
    await login(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cuenta desactivada, contacte al administrador' });
  });

  it('should return 401 if password is wrong', async () => {
    bcrypt.compare = jest.fn().mockResolvedValue(false);
    mockExecute.mockResolvedValueOnce([[validUser]]);
    const req = mockReq({ body: { correo: 'admin@sifga.com', contrasena: 'wrong' } });
    const res = mockRes();
    await login(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should call next on database error', async () => {
    const dbError = new Error('DB connection failed');
    mockExecute.mockRejectedValueOnce(dbError);
    const req = mockReq({ body: { correo: 'admin@sifga.com', contrasena: 'admin123' } });
    const res = mockRes();
    await login(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledWith(dbError);
  });
});

describe('Auth Controller - register', () => {
  it('should register a new user successfully', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    mockExecute.mockResolvedValueOnce([{ insertId: 2 }]);
    bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
    bcrypt.hash = jest.fn().mockResolvedValue('hashed');

    const req = mockReq({
      body: { nombre: 'Test', apellido: 'User', correo: 'test@test.com', usuario: 'testuser', contrasena: 'pass123', id_rol: 2 }
    });
    const res = mockRes();
    await register(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Usuario registrado exitosamente' }));
  });

  it('should return 409 if email or username already exists', async () => {
    mockExecute.mockResolvedValueOnce([[{ id_usuario: 1 }]]);
    const req = mockReq({ body: { correo: 'existing@test.com', usuario: 'existing', contrasena: 'x' } });
    const res = mockRes();
    await register(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('Auth Controller - forgotPassword', () => {
  it('should generate reset token for existing user', async () => {
    mockExecute.mockResolvedValueOnce([[{ id_usuario: 1 }]]);
    jwt.sign = jest.fn().mockReturnValue('reset-token-123');
    mockExecute.mockResolvedValueOnce([[]]);

    const req = mockReq({ body: { correo: 'admin@sifga.com' } });
    const res = mockRes();
    await forgotPassword(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Si el correo existe, recibirá instrucciones para restablecer su contraseña'
    });
  });

  it('should not reveal if email does not exist', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({ body: { correo: 'nonexistent@test.com' } });
    const res = mockRes();
    await forgotPassword(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Si el correo existe, recibirá instrucciones para restablecer su contraseña'
    });
  });
});

describe('Auth Controller - resetPassword', () => {
  it('should reset password with valid token', async () => {
    jwt.verify = jest.fn().mockReturnValue({ id_usuario: 1, purpose: 'password_reset' });
    mockExecute.mockResolvedValueOnce([[{ id_usuario: 1 }]]);
    bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
    bcrypt.hash = jest.fn().mockResolvedValue('new-hashed');
    mockExecute.mockResolvedValueOnce([[]]);

    const req = mockReq({ body: { token: 'valid-token', nueva_contrasena: 'newpass123' } });
    const res = mockRes();
    await resetPassword(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Contraseña restablecida exitosamente' });
  });

  it('should return 400 if token is invalid', async () => {
    jwt.verify = jest.fn().mockImplementation(() => { throw new Error('jwt malformed'); });
    const req = mockReq({ body: { token: 'bad-token', nueva_contrasena: 'newpass' } });
    const res = mockRes();
    await resetPassword(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if token purpose is wrong', async () => {
    jwt.verify = jest.fn().mockReturnValue({ id_usuario: 1, purpose: 'wrong_purpose' });
    const req = mockReq({ body: { token: 'wrong-purpose', nueva_contrasena: 'newpass' } });
    const res = mockRes();
    await resetPassword(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Auth Controller - getProfile', () => {
  it('should return user profile', async () => {
    const profileData = {
      id_usuario: 1, nombre: 'Admin', apellido: 'SIFGA',
      correo: 'admin@sifga.com', usuario: 'admin', id_rol: 1, rol: 'administrador', estado: 1
    };
    mockExecute.mockResolvedValueOnce([[profileData]]);
    const req = mockReq({ user: { id_usuario: 1 } });
    const res = mockRes();
    await getProfile(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(profileData);
  });

  it('should return 404 if user not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const req = mockReq({ user: { id_usuario: 999 } });
    const res = mockRes();
    await getProfile(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('Auth Controller - changePassword', () => {
  it('should change password successfully', async () => {
    mockExecute.mockResolvedValueOnce([[{ contrasena: 'hashed-old' }]]);
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
    bcrypt.hash = jest.fn().mockResolvedValue('new-hashed');
    mockExecute.mockResolvedValueOnce([[]]);

    const req = mockReq({ body: { contrasena_actual: 'oldpass', nueva_contrasena: 'newpass' }, user: { id_usuario: 1 } });
    const res = mockRes();
    await changePassword(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Contraseña cambiada exitosamente' });
  });

  it('should return 400 if current password is wrong', async () => {
    mockExecute.mockResolvedValueOnce([[{ contrasena: 'hashed-old' }]]);
    bcrypt.compare = jest.fn().mockResolvedValue(false);
    const req = mockReq({ body: { contrasena_actual: 'wrong', nueva_contrasena: 'newpass' }, user: { id_usuario: 1 } });
    const res = mockRes();
    await changePassword(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Contraseña actual incorrecta' });
  });
});
