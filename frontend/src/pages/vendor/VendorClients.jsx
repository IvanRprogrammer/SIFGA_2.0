import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getClientes } from '../../services/clienteService';
import { toast } from 'react-toastify';

const VendorClients = ({ onNavigate }) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClientes('activo')
      .then(setClientes)
      .catch(() => toast.error('Error al cargar clientes'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { label: 'Nombre', render: (r) => `${r.nombres} ${r.apellidos}` },
    { label: 'Cédula', field: 'cedula' },
    { label: 'Dirección', field: 'direccion' },
    { label: 'Contador', field: 'numero_contador' },
    { label: 'Municipio', field: 'municipio' },
    { label: 'Deuda', render: (r) => `$${Number(r.deuda_actual).toLocaleString('es-CO')}` },
    { label: 'Estado', render: (r) => <StatusBadge status={r.estado} /> },
  ];

  if (loading) return <DashboardLayout title="Clientes" activeSection="clientes" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Clientes Activos" activeSection="clientes" onNavigate={onNavigate}>
      <DataTable columns={columns} data={clientes} emptyMessage="No hay clientes activos" />
    </DashboardLayout>
  );
};

export default VendorClients;
