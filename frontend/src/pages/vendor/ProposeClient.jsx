import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getMunicipios, getEstratos } from '../../services/clienteService';
import { getClientes } from '../../services/clienteService';
import { toast } from 'react-toastify';

const ProposeClient = ({ onNavigate }) => {
  const [municipios, setMunicipios] = useState([]);
  const [estratos, setEstratos] = useState([]);
  const [form, setForm] = useState({
    nombres: '', apellidos: '', cedula: '', direccion: '', telefono: '',
    correo: '', numero_contador: '', id_municipio: '', id_estrato: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getMunicipios(), getEstratos()])
      .then(([m, e]) => { setMunicipios(m); setEstratos(e); })
      .catch(() => toast.error('Error al cargar datos'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { createCliente } = await import('../../services/clienteService');
      const data = await createCliente({ ...form, id_municipio: parseInt(form.id_municipio) || null, id_estrato: parseInt(form.id_estrato) || null });
      toast.success('Cliente registrado exitosamente (pendiente de aprobación)');
      setForm({ nombres: '', apellidos: '', cedula: '', direccion: '', telefono: '', correo: '', numero_contador: '', id_municipio: '', id_estrato: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar');
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout title="Proponer Cliente" activeSection="proponer" onNavigate={onNavigate}>
      <div className="form-card">
        <h5 className="mb-3">Registro de Nuevo Cliente</h5>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombres *</label>
              <input className="form-control" value={form.nombres} onChange={e => setForm({ ...form, nombres: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Apellidos *</label>
              <input className="form-control" value={form.apellidos} onChange={e => setForm({ ...form, apellidos: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Cédula *</label>
              <input className="form-control" value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Número Contador *</label>
              <input className="form-control" value={form.numero_contador} onChange={e => setForm({ ...form, numero_contador: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Teléfono</label>
              <input className="form-control" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Correo</label>
              <input type="email" className="form-control" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Dirección</label>
              <input className="form-control" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Municipio</label>
              <select className="form-select" value={form.id_municipio} onChange={e => setForm({ ...form, id_municipio: e.target.value })}>
                <option value="">Seleccione...</option>
                {municipios.map(m => <option key={m.id_municipio} value={m.id_municipio}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Estrato</label>
              <select className="form-select" value={form.id_estrato} onChange={e => setForm({ ...form, id_estrato: e.target.value })}>
                <option value="">Seleccione...</option>
                {estratos.map(e => <option key={e.id_estrato} value={e.id_estrato}>Estrato {e.numero} - {e.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <button type="submit" className="btn btn-primary" style={{ background: 'var(--primary-teal)', border: 'none' }} disabled={saving}>
              {saving ? 'Guardando...' : <><i className="bi bi-person-plus me-1"></i> Registrar Cliente</>}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProposeClient;
