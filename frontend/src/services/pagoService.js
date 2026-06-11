import api from './api';

export const getPagos = async (filters = {}) => {
  const { data } = await api.get('/pagos', { params: filters });
  return data;
};

export const createPago = async (pagoData) => {
  const { data } = await api.post('/pagos', pagoData);
  return data;
};

export const getMediosPago = async () => {
  const { data } = await api.get('/pagos/medios-pago');
  return data;
};

export const getResumenMunicipios = async () => {
  const { data } = await api.get('/pagos/resumen-municipios');
  return data;
};
