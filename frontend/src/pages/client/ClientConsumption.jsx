import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getHistorialLecturas } from '../../services/lecturaService';
import { toast } from 'react-toastify';

const ClientConsumption = ({ onNavigate }) => {
  const { user } = useAuth();
  const [lecturas, setLecturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id_cliente) return;
    getHistorialLecturas(user.id_cliente)
      .then(setLecturas)
      .catch(() => toast.error('Error al cargar historial'))
      .finally(() => setLoading(false));
  }, [user]);

  const columns = [
    { label: 'Fecha', render: (r) => new Date(r.fecha_lectura).toLocaleDateString('es-CO') },
    { label: 'Lectura Anterior', render: (r) => `${r.lectura_anterior} m³` },
    { label: 'Lectura Actual', render: (r) => `${r.lectura_actual} m³` },
    { label: 'Consumo', render: (r) => `${r.consumo_m3} m³` },
    { label: 'Factura Asociada', render: (r) => r.codigo_factura || '-' },
    { label: 'Valor', render: (r) => r.total_pagar ? `$${Number(r.total_pagar).toLocaleString('es-CO')}` : '-' },
    { label: 'Estado', render: (r) => r.estado_factura ? <StatusBadge status={r.estado_factura} /> : '-' },
  ];

  if (loading) return <DashboardLayout title="Historial Consumo" activeSection="historial" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  const consumoActual = lecturas[0]?.consumo_m3 || 0;
  const consumoAnterior = lecturas[1]?.consumo_m3 || 0;
  const variacion = consumoAnterior > 0 ? ((consumoActual - consumoAnterior) / consumoAnterior * 100).toFixed(1) : 0;

  return (
    <DashboardLayout title="Historial de Consumo" activeSection="historial" onNavigate={onNavigate}>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="stat-card">
            <div className="stat-label">Consumo Actual</div>
            <div className="stat-value">{consumoActual} m³</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="stat-label">Consumo Anterior</div>
            <div className="stat-value">{consumoAnterior} m³</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="stat-label">Variación</div>
            <div className="stat-value" style={{ color: variacion > 0 ? '#dc3545' : variacion < 0 ? '#198754' : '#333' }}>
              {variacion > 0 ? '+' : ''}{variacion}%
            </div>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={lecturas} emptyMessage="No hay registros de consumo" />
    </DashboardLayout>
  );
};

export default ClientConsumption;
