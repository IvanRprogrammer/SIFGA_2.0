import api from './api';

export const getLecturas = async (id_cliente) => {
  const params = id_cliente ? { id_cliente } : {};
  const { data } = await api.get('/lecturas', { params });
  return data;
};

export const createLectura = async (lecturaData) => {
  const { data } = await api.post('/lecturas', lecturaData);
  return data;
};

export const getHistorialLecturas = async (clienteId) => {
  const { data } = await api.get(`/lecturas/cliente/${clienteId}/historial`);
  return data;
};
