import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const ADMIN_MENU = [
  { section: 'Dashboard', icon: 'bi-speedometer2', id: 'dashboard' },
  { section: 'Usuarios', icon: 'bi-people', id: 'usuarios' },
  { section: 'Clientes', icon: 'bi-person-lines-fill', id: 'clientes' },
  { section: 'Aprobar Clientes', icon: 'bi-check2-square', id: 'aprobar' },
  { section: 'Configuración', icon: 'bi-gear', id: 'configuracion' },
  { section: 'Recaudos', icon: 'bi-cash-stack', id: 'recaudos' },
  { section: 'Reportes', icon: 'bi-file-earmark-bar-graph', id: 'reportes' },
  { section: 'Auditoría', icon: 'bi-journal-text', id: 'auditoria' },
];

const VENDOR_MENU = [
  { section: 'Dashboard', icon: 'bi-speedometer2', id: 'dashboard' },
  { section: 'Clientes', icon: 'bi-person-lines-fill', id: 'clientes' },
  { section: 'Proponer Cliente', icon: 'bi-person-plus', id: 'proponer' },
  { section: 'Tomar Lectura', icon: 'bi-eyedropper', id: 'lectura' },
  { section: 'Facturación', icon: 'bi-receipt', id: 'facturacion' },
  { section: 'Consultar Facturas', icon: 'bi-search', id: 'consulta' },
  { section: 'Recaudos', icon: 'bi-cash', id: 'recaudos' },
];

const CLIENT_MENU = [
  { section: 'Mi Cuenta', icon: 'bi-person-circle', id: 'cuenta' },
  { section: 'Mis Facturas', icon: 'bi-receipt', id: 'facturas' },
  { section: 'Pagar Factura', icon: 'bi-credit-card', id: 'pagar' },
  { section: 'Historial Consumo', icon: 'bi-graph-up', id: 'historial' },
  { section: 'Pagos Realizados', icon: 'bi-clock-history', id: 'pagos' },
];

const Sidebar = ({ open, onToggle, activeSection, onNavigate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = user?.id_rol === 1 ? ADMIN_MENU
    : user?.id_rol === 2 ? VENDOR_MENU
    : CLIENT_MENU;

  const handleSection = (id) => {
    onNavigate(id);
    if (window.innerWidth <= 768) onToggle();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user ? `${user.nombre?.[0] || ''}${user.apellido?.[0] || ''}` : '??';

  return (
    <>
      {open && <div className="sidebar-overlay d-md-none" onClick={onToggle}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />}
      <div className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <i className="bi bi-droplet-half fs-4" style={{ color: 'var(--primary-teal)' }}></i>
          <span>SIFGA</span>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item${activeSection === item.id ? ' active' : ''}`}
              onClick={() => handleSection(item.id)}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.section}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{initials}</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user?.nombre || 'Usuario'}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'capitalize' }}>{user?.rol}</div>
            </div>
          </div>
          <button className="btn btn-sm w-100" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}
            onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1"></i> Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
