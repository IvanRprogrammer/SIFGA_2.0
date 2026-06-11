import api from './api';

export const getClientes = async (estado) => {
  const params = estado ? { estado } : {};
  const { data } = await api.get('/clientes', { params });
  return data;
};

export const getCliente = async (id) => {
  const { data } = await api.get(`/clientes/${id}`);
  return data;
};

export const createCliente = async (clienteData) => {
  const { data } = await api.post('/clientes', clienteData);
  return data;
};

export const updateCliente = async (id, clienteData) => {
  const { data } = await api.put(`/clientes/${id}`, clienteData);
  return data;
};

export const searchClientes = async (termino) => {
  const { data } = await api.get('/clientes/search', { params: { termino } });
  return data;
};

export const getPendingProposals = async () => {
  const { data } = await api.get('/clientes/pendientes');
  return data;
};

export const approveProposal = async (id, contrasena_asignada) => {
  const { data } = await api.put(`/clientes/aprobar/${id}`, { contrasena_asignada });
  return data;
};

export const rejectProposal = async (id, observaciones) => {
  const { data } = await api.put(`/clientes/rechazar/${id}`, { observaciones });
  return data;
};

export const getMunicipios = async () => {
  const { data } = await api.get('/clientes/municipios');
  return data;
};

export const getEstratos = async () => {
  const { data } = await api.get('/clientes/estratos');
  return data;
};
