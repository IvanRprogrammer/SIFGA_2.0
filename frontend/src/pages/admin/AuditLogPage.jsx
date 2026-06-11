import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getAuditLog } from '../../services/reporteService';
import { toast } from 'react-toastify';

const AuditLogPage = ({ onNavigate }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ modulo: '', desde: '', hasta: '' });
  const [loading, setLoading] = useState(true);

  const load = async (f = filter) => {
    setLoading(true);
    try {
      const data = await getAuditLog(f);
      setLogs(data);
    } catch { toast.error('Error al cargar auditoría'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { label: 'Fecha/Hora', render: (r) => new Date(r.created_at).toLocaleString('es-CO') },
    { label: 'Usuario', render: (r) => r.nombre ? `${r.nombre} ${r.apellido || ''}` : 'Sistema' },
    { label: 'Acción', field: 'accion' },
    { label: 'Módulo', field: 'modulo' },
    { label: 'Detalle', render: (r) => r.detalle ? <code className="small">{JSON.stringify(r.detalle).substring(0, 80)}...</code> : '-' },
    { label: 'IP', field: 'ip_address' },
  ];

  if (loading && logs.length === 0) return <DashboardLayout title="Auditoría" activeSection="auditoria" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Auditoría del Sistema" activeSection="auditoria" onNavigate={onNavigate}>
      <div className="filters-bar">
        <select className="form-select form-select-sm" style={{ width: 'auto' }} value={filter.modulo}
          onChange={e => setFilter({ ...filter, modulo: e.target.value })}>
          <option value="">Todos los módulos</option>
          <option value="Auth">Auth</option>
          <option value="Usuarios">Usuarios</option>
          <option value="Clientes">Clientes</option>
          <option value="Lecturas">Lecturas</option>
          <option value="Facturación">Facturación</option>
          <option value="Pagos">Pagos</option>
          <option value="Configuración">Configuración</option>
        </select>
        <input type="date" className="form-control form-control-sm" style={{ width: 'auto' }}
          value={filter.desde} onChange={e => setFilter({ ...filter, desde: e.target.value })} />
        <input type="date" className="form-control form-control-sm" style={{ width: 'auto' }}
          value={filter.hasta} onChange={e => setFilter({ ...filter, hasta: e.target.value })} />
        <button className="btn btn-sm btn-primary" onClick={() => load()}>
          <i className="bi bi-search me-1"></i> Filtrar
        </button>
      </div>
      <DataTable columns={columns} data={logs} emptyMessage="No hay registros de auditoría" />
    </DashboardLayout>
  );
};

export default AuditLogPage;
