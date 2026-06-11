import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getPagos, getResumenMunicipios } from '../../services/pagoService';
import { toast } from 'react-toastify';

const AdminRecaudos = ({ onNavigate }) => {
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [filter, setFilter] = useState({ desde: '', hasta: '' });
  const [loading, setLoading] = useState(true);

  const load = async (f = filter) => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([getPagos(f), getResumenMunicipios()]);
      setPagos(p);
      setResumen(r);
    } catch { toast.error('Error al cargar recaudos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { label: 'Factura', field: 'codigo_factura' },
    { label: 'Cliente', render: (r) => `${r.nombres} ${r.apellidos}` },
    { label: 'Valor', render: (r) => `$${Number(r.valor).toLocaleString('es-CO')}` },
    { label: 'Medio', field: 'medio_pago_nombre' },
    { label: 'Referencia', field: 'referencia' },
    { label: 'Fecha', render: (r) => new Date(r.fecha_pago).toLocaleDateString('es-CO') },
  ];

  if (loading && pagos.length === 0) return <DashboardLayout title="Recaudos" activeSection="recaudos" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Gestión de Recaudos" activeSection="recaudos" onNavigate={onNavigate}>
      <div className="filters-bar">
        <input type="date" className="form-control form-control-sm" style={{ width: 'auto' }}
          value={filter.desde} onChange={e => setFilter({ ...filter, desde: e.target.value })} />
        <input type="date" className="form-control form-control-sm" style={{ width: 'auto' }}
          value={filter.hasta} onChange={e => setFilter({ ...filter, hasta: e.target.value })} />
        <button className="btn btn-sm btn-primary" onClick={() => load()}>
          <i className="bi bi-search me-1"></i> Filtrar
        </button>
      </div>

      {/* Resumen por municipio */}
      {resumen.length > 0 && (
        <div className="row g-2 mb-3">
          {resumen.map((r, i) => (
            <div key={i} className="col-md-4 col-lg-3">
              <div className="stat-card p-3">
                <div className="stat-label">{r.municipio}</div>
                <div className="stat-value small">${Number(r.total_recaudado).toLocaleString('es-CO')}</div>
                <small className="text-muted">{r.total_pagos} pagos</small>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTable columns={columns} data={pagos} emptyMessage="No hay pagos registrados" />
    </DashboardLayout>
  );
};

export default AdminRecaudos;
