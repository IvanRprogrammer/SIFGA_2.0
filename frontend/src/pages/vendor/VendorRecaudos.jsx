import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getPagos } from '../../services/pagoService';
import { toast } from 'react-toastify';

const VendorRecaudos = ({ onNavigate }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPagos()
      .then(setPagos)
      .catch(() => toast.error('Error al cargar recaudos'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { label: 'Factura', field: 'codigo_factura' },
    { label: 'Cliente', render: (r) => `${r.nombres} ${r.apellidos}` },
    { label: 'Valor', render: (r) => `$${Number(r.valor).toLocaleString('es-CO')}` },
    { label: 'Medio', field: 'medio_pago_nombre' },
    { label: 'Referencia', field: 'referencia' },
    { label: 'Fecha', render: (r) => new Date(r.fecha_pago).toLocaleDateString('es-CO') },
  ];

  if (loading) return <DashboardLayout title="Recaudos" activeSection="recaudos" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Anticipos y Recaudos" activeSection="recaudos" onNavigate={onNavigate}>
      <DataTable columns={columns} data={pagos} emptyMessage="No hay pagos registrados" />
    </DashboardLayout>
  );
};

export default VendorRecaudos;
