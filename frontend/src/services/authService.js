import api from './api';

export const login = async (correo, contrasena) => {
  const { data } = await api.post('/auth/login', { correo, contrasena });
  localStorage.setItem('sifga_token', data.token);
  localStorage.setItem('sifga_user', JSON.stringify(data.usuario));
  return data;
};

export const logout = () => {
  localStorage.removeItem('sifga_token');
  localStorage.removeItem('sifga_user');
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

export const changePassword = async (contrasena_actual, nueva_contrasena) => {
  const { data } = await api.put('/auth/change-password', { contrasena_actual, nueva_contrasena });
  return data;
};

export const forgotPassword = async (correo) => {
  const { data } = await api.post('/auth/forgot-password', { correo });
  return data;
};

export const resetPassword = async (token, nueva_contrasena) => {
  const { data } = await api.post('/auth/reset-password', { token, nueva_contrasena });
  return data;
};
