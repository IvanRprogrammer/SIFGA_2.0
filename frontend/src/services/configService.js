import api from './api';

export const getConfig = async () => {
  const { data } = await api.get('/config');
  return data;
};

export const updateConfig = async (configData) => {
  const { data } = await api.put('/config', configData);
  return data;
};

export const getSpecialRates = async () => {
  const { data } = await api.get('/config/tarifas-especiales');
  return data;
};

export const setSpecialRate = async (rateData) => {
  const { data } = await api.post('/config/tarifas-especiales', rateData);
  return data;
};

export const deleteSpecialRate = async (clienteId) => {
  const { data } = await api.delete(`/config/tarifas-especiales/${clienteId}`);
  return data;
};

export const getPermissions = async () => {
  const { data } = await api.get('/config/permisos');
  return data;
};

export const setPermission = async (permisoData) => {
  const { data } = await api.post('/config/permisos', permisoData);
  return data;
};

export const revokePermission = async (id) => {
  const { data } = await api.delete(`/config/permisos/${id}`);
  return data;
};
