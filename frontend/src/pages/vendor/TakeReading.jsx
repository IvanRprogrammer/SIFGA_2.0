import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { getClientes } from '../../services/clienteService';
import { createLectura } from '../../services/lecturaService';
import { getFacturas } from '../../services/facturaService';
import { toast } from 'react-toastify';

const TakeReading = ({ onNavigate }) => {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [lecturaActual, setLecturaActual] = useState('');
  const [fechaLectura, setFechaLectura] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClientes('activo')
      .then(setClientes)
      .catch(() => toast.error('Error al cargar clientes'));
  }, []);

  const autoGeneratePeriod = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setPeriodo(`${start.toISOString().split('T')[0]} / ${end.toISOString().split('T')[0]}`);

    const venc = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    setFechaVencimiento(venc.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId || !lecturaActual) {
      toast.warning('Complete todos los campos requeridos');
      return;
    }
    setSaving(true);
    try {
      const lecturaData = {
        id_cliente: parseInt(clienteId),
        lectura_actual: parseFloat(lecturaActual),
        fecha_lectura: fechaLectura,
        observaciones
      };
      const result = await createLectura(lecturaData);

      // Now generate invoice
      const { createFactura } = await import('../../services/facturaService');
      const facturaData = {
        id_cliente: parseInt(clienteId),
        periodo: periodo || `${fechaLectura} / ${fechaLectura}`,
        fecha_lectura: fechaLectura,
        fecha_vencimiento: fechaVencimiento || new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
        lectura_actual: parseFloat(lecturaActual),
        observaciones
      };
      await createFactura(facturaData);
      toast.success('Lectura registrada y factura generada exitosamente');
      setLecturaActual('');
      setObservaciones('');
      autoGeneratePeriod();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar');
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout title="Tomar Lectura" activeSection="lectura" onNavigate={onNavigate}>
      <div className="form-card">
        <h5 className="mb-3">Registro de Lectura y Facturación</h5>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Cliente *</label>
              <select className="form-select" value={clienteId} onChange={e => setClienteId(e.target.value)} required>
                <option value="">Seleccione un cliente</option>
                {clientes.map(c => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombres} {c.apellidos} - {c.numero_contador}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Lectura Actual *</label>
              <input type="number" step="0.01" className="form-control" value={lecturaActual}
                onChange={e => setLecturaActual(e.target.value)} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha Lectura</label>
              <input type="date" className="form-control" value={fechaLectura}
                onChange={e => setFechaLectura(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Periodo</label>
              <div className="input-group">
                <input className="form-control" value={periodo} onChange={e => setPeriodo(e.target.value)} placeholder="YYYY-MM-DD / YYYY-MM-DD" />
                <button className="btn btn-outline-secondary" type="button" onClick={autoGeneratePeriod}>
                  <i className="bi bi-arrow-repeat"></i>
                </button>
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha Vencimiento</label>
              <input type="date" className="form-control" value={fechaVencimiento}
                onChange={e => setFechaVencimiento(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Observaciones</label>
              <input className="form-control" value={observaciones} onChange={e => setObservaciones(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary mt-3" style={{ background: 'var(--primary-teal)', border: 'none' }} disabled={saving}>
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-1"></span> Procesando...</>
            ) : <><i className="bi bi-clipboard-check me-1"></i> Registrar Lectura y Facturar</>}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default TakeReading;
