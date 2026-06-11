import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { getUsers, createUser, updateUser, deleteUser, toggleUserStatus, resetUserPassword, getRoles } from '../../services/userService';
import { toast } from 'react-toastify';

const UserManagement = ({ onNavigate }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '', usuario: '', contrasena: '', id_rol: 1 });

  const loadData = async () => {
    try {
      const [u, r] = await Promise.all([getUsers(), getRoles()]);
      setUsers(u);
      setRoles(r);
    } catch (err) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({ nombre: '', apellido: '', correo: '', usuario: '', contrasena: '', id_rol: 1 });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (user) => {
    setForm({ nombre: user.nombre, apellido: user.apellido || '', correo: user.correo, usuario: user.usuario, contrasena: '', id_rol: user.id_rol });
    setEditing(user);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateUser(editing.id_usuario, form);
        toast.success('Usuario actualizado');
      } else {
        await createUser(form);
        toast.success('Usuario creado');
      }
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      await deleteUser(confirm.id_usuario);
      toast.success('Usuario eliminado');
      setConfirm(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await toggleUserStatus(user.id_usuario);
      toast.success(`Usuario ${user.estado ? 'desactivado' : 'activado'}`);
      loadData();
    } catch (err) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleResetPassword = async (user) => {
    try {
      await resetUserPassword(user.id_usuario);
      toast.success('Contraseña restablecida a: sifga123');
    } catch (err) {
      toast.error('Error al restablecer contraseña');
    }
  };

  const columns = [
    { label: 'Nombre', field: 'nombre', render: (r) => `${r.nombre} ${r.apellido || ''}` },
    { label: 'Correo', field: 'correo' },
    { label: 'Usuario', field: 'usuario' },
    { label: 'Rol', field: 'rol' },
    { label: 'Estado', render: (r) => <StatusBadge status={r.estado ? 'activo' : 'inactivo'} /> },
    { label: 'Último Acceso', render: (r) => r.ultimo_acceso ? new Date(r.ultimo_acceso).toLocaleDateString('es-CO') : 'Nunca' },
  ];

  if (loading) return <DashboardLayout title="Gestión de Usuarios" activeSection="usuarios" onNavigate={onNavigate}><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Gestión de Usuarios" activeSection="usuarios" onNavigate={onNavigate}>
      <button className="btn btn-primary mb-3" style={{ background: 'var(--primary-teal)', border: 'none' }}
        onClick={() => { resetForm(); setShowForm(true); }}>
        <i className="bi bi-plus-lg me-1"></i> Nuevo Usuario
      </button>

      {showForm && (
        <div className="form-card">
          <h5 className="mb-3">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre *</label>
                <input className="form-control" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Apellido</label>
                <input className="form-control" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Correo *</label>
                <input type="email" className="form-control" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Usuario *</label>
                <input className="form-control" value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })} required />
              </div>
              {!editing && (
                <div className="col-md-6">
                  <label className="form-label">Contraseña *</label>
                  <input type="password" className="form-control" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} required={!editing} />
                </div>
              )}
              <div className="col-md-6">
                <label className="form-label">Rol *</label>
                <select className="form-select" value={form.id_rol} onChange={e => setForm({ ...form, id_rol: parseInt(e.target.value) })} required>
                  <option value="">Seleccione...</option>
                  {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary" style={{ background: 'var(--primary-teal)', border: 'none' }}>
                {editing ? 'Actualizar' : 'Crear'} Usuario
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        actions={(row) => (
          <>
            <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(row)} title="Editar">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="btn btn-sm btn-outline-warning" onClick={() => handleToggleStatus(row)} title={row.estado ? 'Desactivar' : 'Activar'}>
              <i className={`bi ${row.estado ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
            </button>
            <button className="btn btn-sm btn-outline-info" onClick={() => handleResetPassword(row)} title="Restablecer contraseña">
              <i className="bi bi-key"></i>
            </button>
            <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirm(row)} title="Eliminar">
              <i className="bi bi-trash"></i>
            </button>
          </>
        )}
      />

      <ConfirmDialog
        show={!!confirm}
        title="Eliminar Usuario"
        message={`¿Eliminar a ${confirm?.nombre} ${confirm?.apellido || ''}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </DashboardLayout>
  );
};

export default UserManagement;
