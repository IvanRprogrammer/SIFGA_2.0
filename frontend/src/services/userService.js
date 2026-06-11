import api from './api';

export const getUsers = async () => {
  const { data } = await api.get('/users');
  return data;
};

export const getUser = async (id) => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

export const createUser = async (userData) => {
  const { data } = await api.post('/users', userData);
  return data;
};

export const updateUser = async (id, userData) => {
  const { data } = await api.put(`/users/${id}`, userData);
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

export const toggleUserStatus = async (id) => {
  const { data } = await api.patch(`/users/${id}/toggle-status`);
  return data;
};

export const resetUserPassword = async (id, nueva_contrasena) => {
  const { data } = await api.post(`/users/${id}/reset-password`, { nueva_contrasena });
  return data;
};

export const getRoles = async () => {
  const { data } = await api.get('/users/roles');
  return data;
};
