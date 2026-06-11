import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getDashboardStats } from '../../services/reporteService';

const AdminDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <DashboardLayout title="Dashboard" activeSection="dashboard" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  const cards = [
    { label: 'Usuarios', value: stats.total_usuarios, icon: 'bi-people', color: '#0d6efd' },
    { label: 'Clientes Activos', value: stats.clientes_activos, icon: 'bi-person-check', color: '#198754' },
    { label: 'Propuestas Pendientes', value: stats.propuestas_pendientes, icon: 'bi-clock', color: '#ffc107' },
    { label: 'Facturas Pendientes', value: stats.facturas_pendientes, icon: 'bi-receipt', color: '#dc3545' },
    { label: 'Total Pagos', value: `$${Number(stats.total_recaudado).toLocaleString('es-CO')}`, icon: 'bi-cash-stack', color: '#20c997' },
    { label: 'Deuda Total', value: `$${Number(stats.deuda_total).toLocaleString('es-CO')}`, icon: 'bi-exclamation-triangle', color: '#fd7e14' },
  ];

  return (
    <DashboardLayout title="Panel de Administración" activeSection="dashboard" onNavigate={onNavigate}>
      <div className="row g-3 mb-4">
        {cards.map((card, i) => (
          <div key={i} className="col-6 col-md-4 col-lg-2">
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

      {stats.ultimos_pagos?.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h6 className="mb-0 fw-semibold">Últimos Pagos</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Factura</th>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Medio</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {stats.ultimos_pagos.map((p, i) => (
                  <tr key={i}>
                    <td>{p.codigo_factura}</td>
                    <td>{p.nombres} {p.apellidos}</td>
                    <td>${Number(p.valor).toLocaleString('es-CO')}</td>
                    <td>{p.medio_pago_nombre}</td>
                    <td>{new Date(p.fecha_pago).toLocaleDateString('es-CO')}</td>
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

export default AdminDashboard;
