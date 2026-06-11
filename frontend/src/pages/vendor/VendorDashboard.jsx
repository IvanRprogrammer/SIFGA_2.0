import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getDashboardStats } from '../../services/reporteService';
import { getFacturas } from '../../services/facturaService';
import { toast } from 'react-toastify';
import StatusBadge from '../../components/common/StatusBadge';

const VendorDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, f] = await Promise.all([
          getDashboardStats(),
          getFacturas({})
        ]);
        setStats(s);
        setFacturas(f.slice(0, 5));
      } catch { toast.error('Error al cargar datos'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <DashboardLayout title="Dashboard" activeSection="dashboard" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  const cards = [
    { label: 'Clientes', value: stats?.total_clientes || 0, icon: 'bi-people', color: '#0d6efd' },
    { label: 'Facturas del Mes', value: facturas.length, icon: 'bi-receipt', color: '#198754' },
    { label: 'Pendientes', value: stats?.facturas_pendientes || 0, icon: 'bi-clock', color: '#ffc107' },
    { label: 'Recaudado', value: `$${Number(stats?.total_recaudado || 0).toLocaleString('es-CO')}`, icon: 'bi-cash', color: '#20c997' },
  ];

  return (
    <DashboardLayout title="Panel del Vendedor" activeSection="dashboard" onNavigate={onNavigate}>
      <div className="row g-3 mb-4">
        {cards.map((card, i) => (
          <div key={i} className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div className="stat-value small">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {facturas.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h6 className="mb-0 fw-semibold">Últimas Facturas Generadas</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Periodo</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f, i) => (
                  <tr key={i}>
                    <td>{f.codigo_factura}</td>
                    <td>{f.nombres} {f.apellidos}</td>
                    <td>{f.periodo}</td>
                    <td>${Number(f.total_pagar).toLocaleString('es-CO')}</td>
                    <td><StatusBadge status={f.estado_nombre} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default VendorDashboard;
