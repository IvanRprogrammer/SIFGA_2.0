import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getFacturas } from '../../services/facturaService';
import { getMediosPago, createPago } from '../../services/pagoService';
import { toast } from 'react-toastify';

const ClientPay = ({ onNavigate }) => {
  const { user } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [selectedFactura, setSelectedFactura] = useState('');
  const [idMedioPago, setIdMedioPago] = useState('');
  const [referencia, setReferencia] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id_cliente) return;
    Promise.all([
      getFacturas({ id_cliente: user.id_cliente }),
      getMediosPago()
    ]).then(([f, m]) => {
      setFacturas(f.filter(fac => fac.estado_nombre === 'Pendiente' || fac.estado_nombre === 'Mora'));
      setMediosPago(m);
    }).catch(() => toast.error('Error al cargar datos'))
    .finally(() => setLoading(false));
  }, [user]);

  const selectedFac = facturas.find(f => f.id_factura === parseInt(selectedFactura));

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedFactura || !idMedioPago) {
      toast.warning('Seleccione factura y medio de pago');
      return;
    }
    setSaving(true);
    try {
      await createPago({
        id_factura: parseInt(selectedFactura),
        id_medio_pago: parseInt(idMedioPago),
        valor: selectedFac?.total_pagar || 0,
        referencia,
        fecha_pago: new Date().toISOString().split('T')[0]
      });
      toast.success('Pago registrado exitosamente');
      setSelectedFactura('');
      setIdMedioPago('');
      setReferencia('');
      const f = await getFacturas({ id_cliente: user.id_cliente });
      setFacturas(f.filter(fac => fac.estado_nombre === 'Pendiente' || fac.estado_nombre === 'Mora'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar pago');
    } finally { setSaving(false); }
  };

  if (loading) return <DashboardLayout title="Pagar Factura" activeSection="pagar" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Pagar Factura" activeSection="pagar" onNavigate={onNavigate}>
      {facturas.length === 0 ? (
        <div className="alert alert-success">
          <i className="bi bi-check-circle me-2"></i> No tiene facturas pendientes. ¡Todo al día!
        </div>
      ) : (
        <div className="form-card">
          <h5 className="mb-3">Realizar Pago</h5>
          <form onSubmit={handlePay}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Factura *</label>
                <select className="form-select" value={selectedFactura}
                  onChange={e => setSelectedFactura(e.target.value)} required>
                  <option value="">Seleccione una factura</option>
                  {facturas.map(f => (
                    <option key={f.id_factura} value={f.id_factura}>
                      {f.codigo_factura} - ${Number(f.total_pagar).toLocaleString('es-CO')} ({f.estado_nombre})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Medio de Pago *</label>
                <select className="form-select" value={idMedioPago}
                  onChange={e => setIdMedioPago(e.target.value)} required>
                  <option value="">Seleccione...</option>
                  {mediosPago.map(m => (
                    <option key={m.id_medio_pago} value={m.id_medio_pago}>{m.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Referencia</label>
                <input className="form-control" value={referencia}
                  onChange={e => setReferencia(e.target.value)} placeholder="Nº de transacción o referencia" />
              </div>
              {selectedFac && (
                <div className="col-md-6">
                  <div className="p-3 rounded" style={{ background: '#e6faf7' }}>
                    <div className="text-muted small">Total a Pagar:</div>
                    <div className="fw-bold fs-4" style={{ color: 'var(--primary-teal)' }}>
                      ${Number(selectedFac.total_pagar).toLocaleString('es-CO')}
                    </div>
                    <StatusBadge status={selectedFac.estado_nombre} />
                  </div>
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-success mt-3" disabled={saving}>
              {saving ? (
                <><span className="spinner-border spinner-border-sm me-1"></span> Procesando...</>
              ) : <><i className="bi bi-credit-card me-1"></i> Pagar</>}
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ClientPay;
