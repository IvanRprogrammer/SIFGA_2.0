import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getClientes, searchClientes } from '../../services/clienteService';
import { toast } from 'react-toastify';

const ClientesPage = ({ onNavigate }) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const data = await getClientes();
      setClientes(data);
    } catch { toast.error('Error al cargar clientes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = async () => {
    if (!search.trim()) { load(); return; }
    setLoading(true);
    try {
      const data = await searchClientes(search);
      setClientes(data);
    } catch { toast.error('Error en búsqueda'); }
    finally { setLoading(false); }
  };

  const columns = [
    { label: 'Nombre', render: (r) => `${r.nombres} ${r.apellidos}` },
    { label: 'Cédula', field: 'cedula' },
    { label: 'Dirección', field: 'direccion' },
    { label: 'Teléfono', field: 'telefono' },
    { label: 'Contador', field: 'numero_contador' },
    { label: 'Municipio', field: 'municipio' },
    { label: 'Estrato', render: (r) => r.estrato_numero ? `Estrato ${r.estrato_numero}` : '-' },
    { label: 'Deuda', render: (r) => `$${Number(r.deuda_actual).toLocaleString('es-CO')}` },
    { label: 'Estado', render: (r) => <StatusBadge status={r.estado} /> },
  ];

  if (loading) return <DashboardLayout title="Clientes" activeSection="clientes" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Gestión de Clientes" activeSection="clientes" onNavigate={onNavigate}>
      <div className="filters-bar">
        <input className="form-control form-control-sm" style={{ width: '300px' }} placeholder="Buscar por nombre, cédula, contador..."
          value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button className="btn btn-sm btn-primary" onClick={handleSearch}><i className="bi bi-search me-1"></i> Buscar</button>
      </div>
      <DataTable columns={columns} data={clientes} emptyMessage="No hay clientes registrados"
        actions={(row) => (
          <button className="btn btn-sm btn-outline-primary" onClick={() => {
            import('../../services/configService').then(m => {
              const tarifa = prompt(`Tarifa especial para ${row.nombres} ${row.apellidos} (COP por m³):`, '');
              const plazo = prompt('Plazo de pago especial (días):', '');
              if (tarifa || plazo) {
                m.setSpecialRate({ id_cliente: row.id_cliente, tarifa_agua_m3: parseFloat(tarifa) || null, plazo_pago_dias: parseInt(plazo) || null })
                  .then(() => toast.success('Tarifa especial guardada'))
                  .catch(err => toast.error(err.response?.data?.error || 'Error'));
              }
            });
          }}>
            <i className="bi bi-gear"></i>
          </button>
        )}
      />
    </DashboardLayout>
  );
};

export default ClientesPage;
