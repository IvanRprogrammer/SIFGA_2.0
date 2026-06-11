import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getFacturas, getFactura } from '../../services/facturaService';
import { toast } from 'react-toastify';

const ClientFacturas = ({ onNavigate }) => {
  const { user } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id_cliente) return;
    getFacturas({ id_cliente: user.id_cliente })
      .then(setFacturas)
      .catch(() => toast.error('Error al cargar facturas'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleViewDetail = async (id) => {
    try {
      const data = await getFactura(id);
      setSelectedFactura(data);
    } catch { toast.error('Error al cargar detalle'); }
  };

  const columns = [
    { label: 'Código', field: 'codigo_factura' },
    { label: 'Periodo', field: 'periodo' },
    { label: 'Consumo', render: (r) => `${r.consumo_m3} m³` },
    { label: 'Total', render: (r) => `$${Number(r.total_pagar).toLocaleString('es-CO')}` },
    { label: 'Vencimiento', render: (r) => new Date(r.fecha_vencimiento).toLocaleDateString('es-CO') },
    { label: 'Estado', render: (r) => <StatusBadge status={r.estado_nombre} /> },
  ];

  if (loading) return <DashboardLayout title="Mis Facturas" activeSection="facturas" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Mis Facturas" activeSection="facturas" onNavigate={onNavigate}>
      <DataTable
        columns={columns}
        data={facturas}
        emptyMessage="No tiene facturas registradas"
        actions={(row) => (
          <button className="btn btn-sm btn-outline-info" onClick={() => handleViewDetail(row.id_factura)}>
            <i className="bi bi-eye"></i>
          </button>
        )}
      />

      {selectedFactura && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Factura {selectedFactura.codigo_factura}</h5>
                <button className="btn-close" onClick={() => setSelectedFactura(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-6">
                    <strong>Cliente:</strong> {selectedFactura.nombres} {selectedFactura.apellidos}<br />
                    <strong>Cédula:</strong> {selectedFactura.cedula}<br />
                    <strong>Contador:</strong> {selectedFactura.numero_contador}
                  </div>
                  <div className="col-6 text-end">
                    <strong>Periodo:</strong> {selectedFactura.periodo}<br />
                    <strong>Emisión:</strong> {new Date(selectedFactura.fecha_emision).toLocaleDateString('es-CO')}<br />
                    <strong>Vence:</strong> {new Date(selectedFactura.fecha_vencimiento).toLocaleDateString('es-CO')}
                  </div>
                </div>
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr><th>Concepto</th><th className="text-end">Valor</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Consumo: {selectedFactura.consumo_m3} m³ x ${Number(selectedFactura.tarifa_agua).toLocaleString('es-CO')}</td>
                      <td className="text-end">${Number(selectedFactura.valor_agua).toLocaleString('es-CO')}</td></tr>
                    <tr><td>Alcantarillado</td><td className="text-end">${Number(selectedFactura.valor_alcantarillado).toLocaleString('es-CO')}</td></tr>
                    <tr><td>Aseo</td><td className="text-end">${Number(selectedFactura.valor_aseo).toLocaleString('es-CO')}</td></tr>
                    <tr><td>Subtotal</td><td className="text-end">${Number(selectedFactura.subtotal).toLocaleString('es-CO')}</td></tr>
                    {selectedFactura.descuento_subsidio > 0 && (
                      <tr><td>Subsidio ({selectedFactura.porcentaje_subsidio}%)</td>
                        <td className="text-end text-success">-${Number(selectedFactura.descuento_subsidio).toLocaleString('es-CO')}</td></tr>
                    )}
                    {selectedFactura.contribucion > 0 && (
                      <tr><td>Contribución</td>
                        <td className="text-end text-danger">+${Number(selectedFactura.contribucion).toLocaleString('es-CO')}</td></tr>
                    )}
                    <tr><td>Cargo Fijo</td><td className="text-end">${Number(selectedFactura.cargo_fijo).toLocaleString('es-CO')}</td></tr>
                    {selectedFactura.mora_anterior > 0 && (
                      <tr><td>Mora Anterior</td><td className="text-end text-danger">${Number(selectedFactura.mora_anterior).toLocaleString('es-CO')}</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="fw-bold">
                      <td>TOTAL A PAGAR</td>
                      <td className="text-end" style={{ color: 'var(--primary-teal)', fontSize: '1.1rem' }}>
                        ${Number(selectedFactura.total_pagar).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <div className="text-center">
                  <span className="badge badge-estado" style={{ fontSize: '1rem' }}>
                    <StatusBadge status={selectedFactura.estado_nombre} />
                  </span>
                </div>
                {selectedFactura.pagos?.length > 0 && (
                  <div className="mt-3">
                    <h6>Historial de Pagos</h6>
                    <table className="table table-sm">
                      <thead><tr><th>Fecha</th><th>Valor</th><th>Medio</th><th>Referencia</th></tr></thead>
                      <tbody>
                        {selectedFactura.pagos.map((p, i) => (
                          <tr key={i}>
                            <td>{new Date(p.fecha_pago).toLocaleDateString('es-CO')}</td>
                            <td>${Number(p.valor).toLocaleString('es-CO')}</td>
                            <td>{p.medio_pago_nombre}</td>
                            <td>{p.referencia || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedFactura(null)}>Cerrar</button>
                <button className="btn btn-primary" style={{ background: 'var(--primary-teal)', border: 'none' }}
                  onClick={() => { setSelectedFactura(null); onNavigate('pagar'); }}>
                  Ir a Pagar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ClientFacturas;
