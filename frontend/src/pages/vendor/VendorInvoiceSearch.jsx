import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getFacturas, searchFacturas } from '../../services/facturaService';
import { toast } from 'react-toastify';

const VendorInvoiceSearch = ({ onNavigate }) => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getFacturas()
      .then(setFacturas)
      .catch(() => toast.error('Error al cargar facturas'))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      getFacturas().then(setFacturas);
      return;
    }
    setLoading(true);
    try {
      const data = await searchFacturas(searchTerm);
      setFacturas(data);
    } catch { toast.error('Error en búsqueda'); }
    finally { setLoading(false); }
  };

  const columns = [
    { label: 'Código', field: 'codigo_factura' },
    { label: 'Cliente', render: (r) => `${r.nombres} ${r.apellidos}` },
    { label: 'Cédula', field: 'cedula' },
    { label: 'Contador', field: 'numero_contador' },
    { label: 'Periodo', field: 'periodo' },
    { label: 'Total', render: (r) => `$${Number(r.total_pagar).toLocaleString('es-CO')}` },
    { label: 'Vencimiento', render: (r) => new Date(r.fecha_vencimiento).toLocaleDateString('es-CO') },
    { label: 'Estado', render: (r) => <StatusBadge status={r.estado_nombre} /> },
  ];

  if (loading) return <DashboardLayout title="Consultar Facturas" activeSection="consulta" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Consulta de Facturas" activeSection="consulta" onNavigate={onNavigate}>
      <div className="filters-bar">
        <input className="form-control form-control-sm" style={{ width: '350px' }}
          placeholder="Buscar por código, cédula, contador o nombre..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button className="btn btn-sm btn-primary" onClick={handleSearch}>
          <i className="bi bi-search me-1"></i> Buscar
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSearchTerm(''); getFacturas().then(setFacturas); }}>
          <i className="bi bi-x-circle me-1"></i> Limpiar
        </button>
      </div>
      <DataTable columns={columns} data={facturas} emptyMessage="No se encontraron facturas" />
    </DashboardLayout>
  );
};

export default VendorInvoiceSearch;
