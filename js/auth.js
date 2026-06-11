import { getData, saveData } from './data.js';

export async function login(email, password, selectedRole) {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email, contrasena: password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    sessionStorage.setItem('sifga_token', data.token);
    sessionStorage.setItem('sifga_user', data.usuario.correo);
    sessionStorage.setItem('sifga_role', data.usuario.rol);
    sessionStorage.setItem('sifga_userName', data.usuario.nombre);
    sessionStorage.setItem('sifga_userId', data.usuario.id_usuario);

    if (data.usuario.rol !== selectedRole) {
      sessionStorage.clear();
      return { success: false, message: 'El usuario no tiene el rol seleccionado' };
    }

    return { success: true, role: data.usuario.rol };
  } catch {
    return loginFallback(email, password, selectedRole);
  }
}

function loginFallback(email, password, selectedRole) {
  const data = getData();
  let usuario = data.usuariosSistema.find(u => u.email === email && u.password === password);
  if (usuario && usuario.rol === selectedRole && usuario.activo) {
    sessionStorage.setItem('sifga_user', usuario.email);
    sessionStorage.setItem('sifga_role', usuario.rol);
    sessionStorage.setItem('sifga_userName', usuario.nombre);
    sessionStorage.setItem('sifga_userId', usuario.id);
    return { success: true, role: usuario.rol };
  }
  return { success: false, message: 'Credenciales incorrectas' };
}

export function logout() {
  sessionStorage.removeItem('sifga_token');
  sessionStorage.removeItem('sifga_user');
  sessionStorage.removeItem('sifga_role');
  sessionStorage.removeItem('sifga_userName');
  sessionStorage.removeItem('sifga_userId');
  window.location.href = 'index.html';
}

export function isAuthenticated() {
  const user = sessionStorage.getItem('sifga_user');
  const role = sessionStorage.getItem('sifga_role');
  return !!(user && role);
}

export function getCurrentUser() {
  const userEmail = sessionStorage.getItem('sifga_user');
  if (!userEmail) return null;
  return getData().usuariosSistema.find(u => u.email === userEmail);
}

export function getCurrentRole() {
  return sessionStorage.getItem('sifga_role');
}

export function hasRole(role) {
  return getCurrentRole() === role;
}

export function redirectByRole(role) {
  const pages = { administrador: 'administrador.html', vendedor: 'vendedor.html', cliente: 'cliente.html' };
  window.location.href = pages[role] || 'index.html';
}
