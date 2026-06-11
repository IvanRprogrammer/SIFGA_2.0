import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const ROLES = [
  { id: 1, label: 'Administrador', icon: 'bi-shield-lock', role: 'administrador' },
  { id: 2, label: 'Vendedor', icon: 'bi-person-badge', role: 'vendedor' },
  { id: 3, label: 'Cliente', icon: 'bi-person', role: 'cliente' },
];

const LoginPage = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [selectedRole, setSelectedRole] = useState(1);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!correo || !contrasena) {
      toast.warning('Ingrese correo y contraseña');
      return;
    }
    setLoading(true);
    try {
      const data = await login(correo, contrasena);
      toast.success(`Bienvenido ${data.usuario.nombre}`);
      const routes = { 1: '/admin', 2: '/vendedor', 3: '/cliente' };
      navigate(routes[data.usuario.id_rol] || '/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo">
          <i className="bi bi-droplet-half" style={{ fontSize: '2.5rem', color: 'var(--primary-teal)' }}></i>
          <h1>SIFGA</h1>
          <p className="text-muted small">Sistema Integrado de Facturación y Gestión de Agua</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Seleccione su Rol</label>
            <div className="role-selector">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`role-btn${selectedRole === r.id ? ' active' : ''}`}
                  onClick={() => setSelectedRole(r.id)}
                >
                  <i className={`bi ${r.icon}`}></i>
                  <div>{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email" className="form-control" placeholder="correo@ejemplo.com"
              value={correo} onChange={(e) => setCorreo(e.target.value)} required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Contraseña</label>
            <input
              type="password" className="form-control" placeholder="Ingrese su contraseña"
              value={contrasena} onChange={(e) => setContrasena(e.target.value)} required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}
            style={{ background: 'var(--primary-teal)', border: 'none', fontWeight: 600 }}>
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-1"></span> Ingresando...</>
            ) : 'Ingresar'}
          </button>
        </form>

        <div className="text-center mt-3">
          <small className="text-muted">
            Demo: admin@sifga.com / admin123
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
