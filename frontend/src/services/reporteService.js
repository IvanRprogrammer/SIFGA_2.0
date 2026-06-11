import api from './api';

export const getDashboardStats = async () => {
  const { data } = await api.get('/reportes/dashboard');
  return data;
};

export const getMonthlyReport = async (anio, mes) => {
  const { data } = await api.get('/reportes/mensual', { params: { anio, mes } });
  return data;
};

export const getAnnualReport = async (anio) => {
  const { data } = await api.get('/reportes/anual', { params: { anio } });
  return data;
};

export const getAuditLog = async (filters = {}) => {
  const { data } = await api.get('/reportes/auditoria', { params: filters });
  return data;
};
