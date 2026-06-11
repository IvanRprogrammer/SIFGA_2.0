import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getFacturas, createFactura, searchFacturas } from '../../services/facturaService';
import { getClientes } from '../../services/clienteService';
import { toast } from 'react-toastify';

const VendorFacturacion = ({ onNavigate }) => {
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id_cliente: '', periodo: '', fecha_lectura: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '', lectura_actual: '', observaciones: ''
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [f, c] = await Promise.all([getFacturas(), getClientes('activo')]);
      setFacturas(f);
      setClientes(c);
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const autoPeriod = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setForm(prev => ({
      ...prev,
      periodo: `${start.toISOString().split('T')[0]} / ${end.toISOString().split('T')[0]}`,
      fecha_vencimiento: new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString().split('T')[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createFactura({
        ...form,
        id_cliente: parseInt(form.id_cliente),
        lectura_actual: parseFloat(form.lectura_actual)
      });
      toast.success('Factura generada exitosamente');
      setShowForm(false);
      setForm({ id_cliente: '', periodo: '', fecha_lectura: new Date().toISOString().split('T')[0], fecha_vencimiento: '', lectura_actual: '', observaciones: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al generar factura');
    } finally { setSaving(false); }
  };

  const columns = [
    { label: 'Código', field: 'codigo_factura' },
    { label: 'Cliente', render: (r) => `${r.nombres} ${r.apellidos}` },
    { label: 'Periodo', field: 'periodo' },
    { label: 'Consumo', field: 'consumo_m3', render: (r) => `${r.consumo_m3} m³` },
    { label: 'Total', render: (r) => `$${Number(r.total_pagar).toLocaleString('es-CO')}` },
    { label: 'Vence', render: (r) => new Date(r.fecha_vencimiento).toLocaleDateString('es-CO') },
    { label: 'Estado', render: (r) => <StatusBadge status={r.estado_nombre} /> },
  ];

  if (loading) return <DashboardLayout title="Facturación" activeSection="facturacion" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Facturación" activeSection="facturacion" onNavigate={onNavigate}>
      <button className="btn btn-primary mb-3" style={{ background: 'var(--primary-teal)', border: 'none' }}
        onClick={() => { setShowForm(!showForm); if (!showForm) autoPeriod(); }}>
        <i className="bi bi-plus-lg me-1"></i> Nueva Factura
      </button>

      {showForm && (
        <div className="form-card">
          <h5 className="mb-3">Generar Factura</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Cliente *</label>
                <select className="form-select" value={form.id_cliente}
                  onChange={e => setForm({ ...form, id_cliente: e.target.value })} required>
                  <option value="">Seleccione...</option>
                  {clientes.map(c => (
                    <option key={c.id_cliente} value={c.id_cliente}>{c.nombres} {c.apellidos} - {c.numero_contador}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Lectura Actual *</label>
                <input type="number" step="0.01" className="form-control" value={form.lectura_actual}
                  onChange={e => setForm({ ...form, lectura_actual: e.target.value })} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Fecha Lectura</label>
                <input type="date" className="form-control" value={form.fecha_lectura}
                  onChange={e => setForm({ ...form, fecha_lectura: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Periodo</label>
                <div className="input-group">
                  <input className="form-control" value={form.periodo}
                    onChange={e => setForm({ ...form, periodo: e.target.value })} />
                  <button className="btn btn-outline-secondary" type="button" onClick={autoPeriod}>
                    <i className="bi bi-arrow-repeat"></i>
                  </button>
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label">Vencimiento</label>
                <input type="date" className="form-control" value={form.fecha_vencimiento}
                  onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Observaciones</label>
                <input className="form-control" value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-3" style={{ background: 'var(--primary-teal)', border: 'none' }} disabled={saving}>
              {saving ? 'Generando...' : <><i className="bi bi-receipt me-1"></i> Generar Factura</>}
            </button>
          </form>
        </div>
      )}

      <DataTable columns={columns} data={facturas} emptyMessage="No hay facturas generadas" />
    </DashboardLayout>
  );
};

export default VendorFacturacion;
