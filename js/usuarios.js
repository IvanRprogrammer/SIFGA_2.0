// ============================================================================
// usuarios.js - GESTIÓN DE USUARIOS (Solo Administrador)
// Crear, listar, activar/desactivar, eliminar usuarios del sistema
// ============================================================================

import { getData, saveData } from "./data.js";
import { mostrarMensaje, formatMoney } from "./utils.js";
import { eliminarCliente } from "./clientes.js";

// Obtener todos los usuarios
export function obtenerUsuarios() {
  const data = getData();
  return [...data.usuariosSistema];
}

// Obtener usuarios por rol
export function obtenerUsuariosPorRol(rol) {
  const data = getData();
  return data.usuiosSistema.filter((u) => u.rol === rol);
}

// Obtener usuario por ID
export function obtenerUsuarioPorId(id) {
  const data = getData();
  return data.usuariosSistema.find((u) => u.id === id);
}

// Obtener usuario por email
export function obtenerUsuarioPorEmail(email) {
  const data = getData();
  return data.usuariosSistema.find((u) => u.email === email);
}

// Crear nuevo usuario (Admin)
export function crearUsuario(nombre, email, rol, password, clienteData = null) {
  const data = getData();

  if (data.usuariosSistema.some((u) => u.email === email)) {
    return { success: false, message: "El email ya está registrado" };
  }

  const newId = data.usuariosSistema.length + 1;
  const nuevoUsuario = {
    id: newId,
    nombre,
    email,
    rol,
    activo: true,
    password,
  };

  if (rol === "cliente" && clienteData) {
    const newClientId = data.clientes.length + 1;
    nuevoUsuario.clienteId = newClientId;
    data.clientes.push({
      id: newClientId,
      nombre,
      cedula: clienteData.cedula || "PENDIENTE",
      contador: clienteData.contador || "PENDIENTE",
      ubicacion: clienteData.direccion || "PENDIENTE",
      ciudad: clienteData.ciudad || "PENDIENTE",
      region: clienteData.region || "PENDIENTE",
      estrato: clienteData.estrato || "3",
      deuda: 0,
      email,
      telefono: clienteData.telefono || "PENDIENTE",
      historialLecturas: [],
    });
  }

  data.usuariosSistema.push(nuevoUsuario);
  saveData();

  return {
    success: true,
    message: `Usuario ${rol} creado: ${email} / ${password}`,
    usuario: nuevoUsuario,
  };
}

// Actualizar usuario
export function actualizarUsuario(id, datosActualizados) {
  const data = getData();
  const userIndex = data.usuariosSistema.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado" };
  }

  // No permitir modificar al administrador principal
  if (
    data.usuariosSistema[userIndex].rol === "administrador" &&
    datosActualizados.rol
  ) {
    return {
      success: false,
      message: "No se puede modificar el rol del administrador principal",
    };
  }

  data.usuariosSistema[userIndex] = {
    ...data.usuariosSistema[userIndex],
    ...datosActualizados,
  };
  saveData();

  return { success: true, message: "Usuario actualizado exitosamente" };
}

// Activar/Desactivar usuario
export function toggleUsuarioActivo(id) {
  const data = getData();
  const user = data.usuariosSistema.find((u) => u.id === id);

  if (!user) {
    return { success: false, message: "Usuario no encontrado" };
  }

  if (user.rol === "administrador") {
    return {
      success: false,
      message: "No se puede desactivar al administrador principal",
    };
  }

  user.activo = !user.activo;
  saveData();

  return {
    success: true,
    message: `Usuario ${user.activo ? "activado" : "desactivado"} exitosamente`,
  };
}

// Eliminar usuario completo (con todos sus datos asociados)
export function eliminarUsuarioCompleto(id) {
  const data = getData();
  const userIndex = data.usuariosSistema.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado" };
  }

  const user = data.usuiosSistema[userIndex];

  if (user.rol === "administrador") {
    return {
      success: false,
      message: "No se puede eliminar al administrador principal",
    };
  }

  // Si es cliente, eliminar todos sus datos
  if (user.rol === "cliente" && user.clienteId) {
    eliminarCliente(user.clienteId);
  }

  // Si es vendedor, eliminar sus propuestas y permisos
  if (user.rol === "vendedor") {
    data.propuestasClientes = data.propuestasClientes.filter(
      (p) => p.vendedorId !== user.id,
    );
    if (data.permisosVendedores) {
      data.permisosVendedores = data.permisosVendedores.filter(
        (p) => p.vendedorId !== user.id,
      );
    }
  }

  // Eliminar el usuario
  data.usuariosSistema.splice(userIndex, 1);
  saveData();

  return {
    success: true,
    message: `Usuario ${user.nombre} eliminado exitosamente`,
  };
}

// Cambiar contraseña
export function cambiarContrasena(id, nuevaContrasena) {
  const data = getData();
  const user = data.usuariosSistema.find((u) => u.id === id);

  if (!user) {
    return { success: false, message: "Usuario no encontrado" };
  }

  user.password = nuevaContrasena;
  saveData();

  return { success: true, message: "Contraseña cambiada exitosamente" };
}

// Obtener estadísticas de usuarios
export function obtenerEstadisticasUsuarios() {
  const data = getData();
  const usuarios = data.usuariosSistema;

  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter((u) => u.activo).length;
  const usuariosInactivos = totalUsuarios - usuariosActivos;

  const admins = usuarios.filter((u) => u.rol === "administrador").length;
  const vendedores = usuarios.filter((u) => u.rol === "vendedor").length;
  const clientes = usuarios.filter((u) => u.rol === "cliente").length;

  return {
    totalUsuarios,
    usuariosActivos,
    usuariosInactivos,
    admins,
    vendedores,
    clientes,
  };
}
