export function formatMoney(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('es-CO');
}

export function formatPeriod(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return 'N/A';
  return `${formatDate(fechaInicio)} / ${formatDate(fechaFin)}`;
}

export function formatConsumo(m3) {
  if (m3 === null || m3 === undefined) return '0 m³';
  return `${Number(m3).toLocaleString('es-CO')} m³`;
}
