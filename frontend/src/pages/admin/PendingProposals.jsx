import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getPendingProposals, approveProposal, rejectProposal } from '../../services/clienteService';
import { toast } from 'react-toastify';

const PendingProposals = ({ onNavigate }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [rejectMsg, setRejectMsg] = useState('');
  const [actionId, setActionId] = useState(null);
  const [actionType, setActionType] = useState(null);

  const load = async () => {
    try {
      const data = await getPendingProposals();
      setProposals(data);
    } catch { toast.error('Error al cargar propuestas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async () => {
    try {
      await approveProposal(actionId, password || undefined);
      toast.success('Cliente aprobado exitosamente');
      setActionId(null); setPassword(''); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al aprobar'); }
  };

  const handleReject = async () => {
    try {
      await rejectProposal(actionId, rejectMsg);
      toast.success('Propuesta rechazada');
      setActionId(null); setRejectMsg(''); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al rechazar'); }
  };

  const columns = [
    { label: 'Cliente', render: (r) => `${r.nombres} ${r.apellidos}` },
    { label: 'Cédula', field: 'cedula' },
    { label: 'Contador', field: 'numero_contador' },
    { label: 'Dirección', field: 'direccion' },
    { label: 'Vendedor', render: (r) => `${r.vendedor_nombre} ${r.vendedor_apellido}` },
    { label: 'Fecha', render: (r) => new Date(r.created_at).toLocaleDateString('es-CO') },
  ];

  if (loading) return <DashboardLayout title="Aprobar Clientes" activeSection="aprobar" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Aprobar Clientes" activeSection="aprobar" onNavigate={onNavigate}>
      <DataTable
        columns={columns}
        data={proposals}
        emptyMessage="No hay propuestas pendientes"
        actions={(row) => (
          <>
            <button className="btn btn-sm btn-success" onClick={() => { setActionId(row.id_propuesta); setActionType('approve'); }}>
              <i className="bi bi-check-lg"></i> Aprobar
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => { setActionId(row.id_propuesta); setActionType('reject'); }}>
              <i className="bi bi-x-lg"></i> Rechazar
            </button>
          </>
        )}
      />

      {actionId && actionType === 'approve' && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Aprobar Cliente</h5>
                <button className="btn-close" onClick={() => setActionId(null)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Contraseña temporal (opcional)</label>
                <input className="form-control" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Se generará automáticamente si se deja vacío" />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActionId(null)}>Cancelar</button>
                <button className="btn btn-success" onClick={handleApprove}>
                  <i className="bi bi-check-lg"></i> Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionId && actionType === 'reject' && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rechazar Propuesta</h5>
                <button className="btn-close" onClick={() => setActionId(null)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Motivo del rechazo</label>
                <textarea className="form-control" rows="3" value={rejectMsg} onChange={e => setRejectMsg(e.target.value)}></textarea>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActionId(null)}>Cancelar</button>
                <button className="btn btn-danger" onClick={handleReject}>
                  <i className="bi bi-x-lg"></i> Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PendingProposals;
