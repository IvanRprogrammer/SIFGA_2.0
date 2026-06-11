import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getConfig, updateConfig } from '../../services/configService';
import { getUsers } from '../../services/userService';
import { toast } from 'react-toastify';
import StatusBadge from '../../components/common/StatusBadge';

const ConfigField = ({ label, value, field, config, setConfig, integer }) => (
  <div className="col-md-4">
    <label className="form-label">{label}</label>
    <input type="number" step={integer ? "1" : "0.01"} className="form-control" value={value}
      onChange={e => {
        const val = integer ? (parseInt(e.target.value) || 0) : (parseFloat(e.target.value) || 0);
        setConfig(c => ({ ...c, [field]: val }));
      }} />
  </div>
);

const AdminConfig = ({ onNavigate }) => {
  const [tab, setTab] = useState('general');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const c = await getConfig();
        setConfig(c);
      } catch { toast.error('Error al cargar configuración'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await updateConfig(config);
      toast.success('Configuración actualizada');
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
  };

  if (loading) return <DashboardLayout title="Configuración" activeSection="configuracion" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Configuración del Sistema" activeSection="configuracion" onNavigate={onNavigate}>
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link${tab === 'general' ? ' active' : ''}`} onClick={() => setTab('general')}>
            Tarifas Generales
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link${tab === 'special' ? ' active' : ''}`} onClick={() => setTab('special')}>
            Tarifas por Cliente
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link${tab === 'permissions' ? ' active' : ''}`} onClick={() => setTab('permissions')}>
            Permisos Vendedores
          </button>
        </li>
      </ul>

      {tab === 'general' && config && (
        <div className="form-card">
          <h5 className="mb-3">Configuración General de Tarifas</h5>
          <form onSubmit={handleSaveConfig}>
            <div className="row g-3">
              <ConfigField label="Tarifa Agua por m3 (COP)" value={config.tarifa_agua_m3} field="tarifa_agua_m3" config={config} setConfig={setConfig} />
              <ConfigField label="Alcantarillado (%)" value={config.tarifa_alcantarillado_porcentaje} field="tarifa_alcantarillado_porcentaje" config={config} setConfig={setConfig} />
              <ConfigField label="Aseo (%)" value={config.tarifa_aseo_porcentaje} field="tarifa_aseo_porcentaje" config={config} setConfig={setConfig} />
              <ConfigField label="Plazo Pago (dias)" value={config.plazo_pago_dias} field="plazo_pago_dias" config={config} setConfig={setConfig} integer />
              <ConfigField label="Interes Mora (%)" value={config.interes_mora_porcentaje} field="interes_mora_porcentaje" config={config} setConfig={setConfig} />
              <ConfigField label="Cargo Fijo (COP)" value={config.cargo_fijo} field="cargo_fijo" config={config} setConfig={setConfig} />
            </div>
            <button type="submit" className="btn btn-primary mt-3" style={{ background: 'var(--primary-teal)', border: 'none' }}>
              <i className="bi bi-save me-1"></i> Guardar Configuración
            </button>
          </form>
        </div>
      )}

      {tab === 'special' && <SpecialRatesSection />}
      {tab === 'permissions' && <PermissionsSection />}
    </DashboardLayout>
  );
};

const SpecialRatesSection = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    import('../../services/configService').then(m => m.getSpecialRates().then(setClients).catch(() => {}));
  }, []);

  return (
    <div className="form-card">
      <h5 className="mb-3">Tarifas Especiales por Cliente</h5>
      <p className="text-muted small">Gestione desde la sección de Clientes, seleccionando "Tarifa Especial".</p>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th>Cédula</th>
              <th>Contador</th>
              <th>Tarifa Agua</th>
              <th>Plazo Pago</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr><td colSpan="5" className="text-center text-muted py-3">No hay tarifas especiales configuradas</td></tr>
            )}
            {clients.map(c => (
              <tr key={c.id_tarifa_especial}>
                <td>{c.nombres} {c.apellidos}</td>
                <td>{c.cedula}</td>
                <td>{c.numero_contador}</td>
                <td>{c.tarifa_agua_m3 ? `$${c.tarifa_agua_m3.toLocaleString('es-CO')}` : '-'}</td>
                <td>{c.plazo_pago_dias ? `${c.plazo_pago_dias} días` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PermissionsSection = () => {
  const [permissions, setPermissions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ id_vendedor: '', id_cliente: '', id_tipo_permiso: 2, fecha_expiracion: '' });

  useEffect(() => {
    import('../../services/configService').then(m => {
      m.getPermissions().then(setPermissions);
    });
    import('../../services/userService').then(m => {
      m.getUsers().then(u => setVendors(u.filter(v => v.id_rol === 2)));
    });
  }, []);

  const handleGrant = async (e) => {
    e.preventDefault();
    try {
      const { setPermission } = await import('../../services/configService');
      const { getPermissions } = await import('../../services/configService');
      await setPermission(form);
      toast.success('Permiso otorgado');
      setForm({ id_vendedor: '', id_cliente: '', id_tipo_permiso: 2, fecha_expiracion: '' });
      const p = await getPermissions();
      setPermissions(p);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleRevoke = async (id) => {
    try {
      const { revokePermission, getPermissions } = await import('../../services/configService');
      await revokePermission(id);
      toast.success('Permiso revocado');
      setPermissions(await getPermissions());
    } catch { toast.error('Error'); }
  };

  return (
    <div className="row g-3">
      <div className="col-md-4">
        <div className="form-card">
          <h5 className="mb-3">Otorgar Permiso</h5>
          <form onSubmit={handleGrant}>
            <div className="mb-3">
              <label className="form-label">Vendedor</label>
              <select className="form-select" value={form.id_vendedor}
                onChange={e => setForm({ ...form, id_vendedor: parseInt(e.target.value) })} required>
                <option value="">Seleccione...</option>
                {vendors.map(v => <option key={v.id_usuario} value={v.id_usuario}>{v.nombre} {v.apellido}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Cliente (Cédula o Contador)</label>
              <input className="form-control" value={form.id_cliente}
                onChange={e => setForm({ ...form, id_cliente: e.target.value })}
                placeholder="Ingrese ID del cliente" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Tipo Permiso</label>
              <select className="form-select" value={form.id_tipo_permiso}
                onChange={e => setForm({ ...form, id_tipo_permiso: parseInt(e.target.value) })}>
                <option value={1}>Ver</option>
                <option value={2}>Modificar</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Fecha Expiración</label>
              <input type="date" className="form-control" value={form.fecha_expiracion}
                onChange={e => setForm({ ...form, fecha_expiracion: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary w-100" style={{ background: 'var(--primary-teal)', border: 'none' }}>
              Otorgar Permiso
            </button>
          </form>
        </div>
      </div>
      <div className="col-md-8">
        <div className="table-container">
          <div className="table-header">
            <h5>Permisos Vigentes</h5>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Vendedor</th>
                  <th>Cliente</th>
                  <th>Contador</th>
                  <th>Tipo</th>
                  <th>Expira</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {permissions.length === 0 && (
                  <tr><td colSpan="6" className="text-center text-muted py-3">Sin permisos registrados</td></tr>
                )}
                {permissions.map(p => (
                  <tr key={p.id_permiso}>
                    <td>{p.vendedor_nombre} {p.vendedor_apellido}</td>
                    <td>{p.cliente_nombre} {p.cliente_apellidos}</td>
                    <td>{p.numero_contador}</td>
                    <td><StatusBadge status={p.tipo_permiso_nombre} /></td>
                    <td>{p.fecha_expiracion ? new Date(p.fecha_expiracion).toLocaleDateString('es-CO') : 'Sin expiración'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleRevoke(p.id_permiso)}>
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConfig;
