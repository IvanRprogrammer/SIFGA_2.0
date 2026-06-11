const STATUS_MAP = {
  'Pendiente': 'bg-pendiente',
  'Pagada': 'bg-pagada',
  'Mora': 'bg-mora',
  'Anulada': 'bg-anulada',
  'Aprobada': 'bg-aprobada',
  'Rechazada': 'bg-rechazada',
  'activo': 'bg-pagada',
  'inactivo': 'bg-anulada',
  'suspendido': 'bg-mora',
};

const StatusBadge = ({ status }) => {
  const cls = STATUS_MAP[status] || 'bg-secondary';
  return <span className={`badge badge-estado ${cls}`}>{status}</span>;
};

export default StatusBadge;
