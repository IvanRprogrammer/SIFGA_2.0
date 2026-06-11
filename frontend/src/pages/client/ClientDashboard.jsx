import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getCliente } from '../../services/clienteService';
import { getFacturas } from '../../services/facturaService';
import { toast } from 'react-toastify';

const ClientDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let clienteData = null;
        if (user?.id_cliente) {
          clienteData = await getCliente(user.id_cliente);
          setCliente(clienteData);
          const fact = await getFacturas({ id_cliente: user.id_cliente });
          setFacturas(fact);
        }
      } catch { toast.error('Error al cargar datos'); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  if (loading) return <DashboardLayout title="Mi Cuenta" activeSection="cuenta" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  const deuda = cliente?.deuda_actual || 0;
  const pendientes = facturas.filter(f => f.estado_nombre === 'Pendiente' || f.estado_nombre === 'Mora');
  const pagadas = facturas.filter(f => f.estado_nombre === 'Pagada');

  return (
    <DashboardLayout title="Mi Cuenta" activeSection="cuenta" onNavigate={onNavigate}>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#0d6efd15', color: '#0d6efd' }}>
              <i className="bi bi-person-circle"></i>
            </div>
            <div className="stat-value small">{cliente?.nombres} {cliente?.apellidos}</div>
            <div className="stat-label">{cliente?.cedula}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dc354515', color: '#dc3545' }}>
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <div className="stat-value small">${Number(deuda).toLocaleString('es-CO')}</div>
            <div className="stat-label">Deuda Total</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#19875415', color: '#198754' }}>
              <i className="bi bi-receipt"></i>
            </div>
            <div className="stat-value small">{pendientes.length}</div>
            <div className="stat-label">Facturas Pendientes</div>
          </div>
        </div>
      </div>

      {cliente && (
        <div className="form-card">
          <h5 className="mb-3">Información Personal</h5>
          <div className="row">
            <div className="col-md-6">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr><td className="fw-semibold" style={{ width: '150px' }}>Contador:</td><td>{cliente.numero_contador}</td></tr>
                  <tr><td className="fw-semibold">Dirección:</td><td>{cliente.direccion}</td></tr>
                  <tr><td className="fw-semibold">Teléfono:</td><td>{cliente.telefono}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr><td className="fw-semibold" style={{ width: '150px' }}>Correo:</td><td>{cliente.correo}</td></tr>
                  <tr><td className="fw-semibold">Municipio:</td><td>{cliente.municipio}</td></tr>
                  <tr><td className="fw-semibold">Estrato:</td><td>{cliente.estrato_numero ? `Estrato ${cliente.estrato_numero}` : '-'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ClientDashboard;
