import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getPagos } from '../../services/pagoService';
import { toast } from 'react-toastify';

const ClientPayments = ({ onNavigate }) => {
  const { user } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id_cliente) return;
    getPagos({ id_cliente: user.id_cliente })
      .then(setPagos)
      .catch(() => toast.error('Error al cargar pagos'))
      .finally(() => setLoading(false));
  }, [user]);

  const columns = [
    { label: 'Factura', field: 'codigo_factura' },
    { label: 'Valor', render: (r) => `$${Number(r.valor).toLocaleString('es-CO')}` },
    { label: 'Medio', field: 'medio_pago_nombre' },
    { label: 'Referencia', field: 'referencia' },
    { label: 'Fecha', render: (r) => new Date(r.fecha_pago).toLocaleDateString('es-CO') },
  ];

  const totalPagado = pagos.reduce((sum, p) => sum + Number(p.valor), 0);

  if (loading) return <DashboardLayout title="Pagos Realizados" activeSection="pagos" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Historial de Pagos" activeSection="pagos" onNavigate={onNavigate}>
      <div className="stat-card mb-3">
        <div className="stat-label">Total Pagado</div>
        <div className="stat-value">${totalPagado.toLocaleString('es-CO')}</div>
      </div>

      <DataTable columns={columns} data={pagos} emptyMessage="No ha realizado pagos aún" />
    </DashboardLayout>
  );
};

export default ClientPayments;
