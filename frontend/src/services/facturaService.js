import api from './api';

export const getFacturas = async (filters = {}) => {
  const { data } = await api.get('/facturas', { params: filters });
  return data;
};

export const getFactura = async (id) => {
  const { data } = await api.get(`/facturas/${id}`);
  return data;
};

export const createFactura = async (facturaData) => {
  const { data } = await api.post('/facturas', facturaData);
  return data;
};

export const searchFacturas = async (termino) => {
  const { data } = await api.get('/facturas/search', { params: { termino } });
  return data;
};

export const getEstadosFactura = async () => {
  const { data } = await api.get('/facturas/estados');
  return data;
};
