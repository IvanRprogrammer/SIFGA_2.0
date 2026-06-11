import { getData, saveData, aprobarPropuestaCliente, rechazarPropuestaCliente } from '../data.js';
import { mostrarMensaje, formatMoney, logout, toggleMobileMenu } from '../utils.js';

window.logout = logout;
window.toggleMobileMenu = toggleMobileMenu;

let currentMap = null;
let currentMarkers = [];

export function inicializarAdmin() {
  console.log('Inicializando admin...');
  loadDashboard();
  const dashboardDiv = document.getElementById('dashboard');
  if (dashboardDiv) dashboardDiv.style.display = 'block';
}

export function toggleSubmenu(submenuId) {
  const submenu = document.getElementById(submenuId);
  if (submenu) submenu.style.display = submenu.style.display === 'none' ? 'block' : 'none';
}

export function showSection(section) {
  const sections = ['dashboard','gestionUsuarios','aprobarClientes','ajusteTarifa','ajusteTarifaCliente','limpiezaDatos','gestionPermisos','recaudos','reportes','rutas'];
  for (let i = 0; i < sections.length; i++) {
    const el = document.getElementById(sections[i]);
    if (el) el.style.display = 'none';
  }
  const selected = document.getElementById(section);
  if (selected) selected.style.display = 'block';
  const titles = { dashboard:'Dashboard Principal', gestionUsuarios:'Gestión de Usuarios', aprobarClientes:'Aprobar Clientes', ajusteTarifa:'Ajuste de Tarifa General', ajusteTarifaCliente:'Ajuste de Tarifa por Cliente', limpiezaDatos:'Limpieza de Datos', gestionPermisos:'Gestión de Permisos', recaudos:'Recaudos por Municipio', reportes:'Reportes Financieros', rutas:'Rutas de Facturación' };
  const titleEl = document.getElementById('sectionTitle');
  if (titleEl) titleEl.innerText = titles[section] || section;
  if (section === 'dashboard') loadDashboard();
  else if (section === 'gestionUsuarios') loadUsuarios();
  else if (section === 'aprobarClientes') cargarPropuestasPendientes();
  else if (section === 'ajusteTarifa') loadConfiguraciones();
  else if (section === 'ajusteTarifaCliente') { cargarClientesTarifa(); cargarTarifasEspeciales(); }
  else if (section === 'gestionPermisos') { loadVendedoresSelect(); loadClientesSelectPermiso(); loadPermisos(); }
  else if (section === 'recaudos') { loadRecaudosAdmin(); loadResumenMunicipios(); }
  else if (section === 'rutas') { setTimeout(() => { initMap(); cargarClientesEnSelectMapa(); }, 100); }
}

async function loadDashboard() {
  try {
    const token = sessionStorage.getItem('sifga_token');
    if (token) {
      const res = await fetch('http://localhost:3000/api/reportes/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const stats = await res.json();
        document.getElementById('totalIngresos').innerText = formatMoney(stats.total_recaudado || 0);
        document.getElementById('totalUsuarios').innerText = stats.total_usuarios || 0;
        document.getElementById('totalClientes').innerText = stats.total_clientes || 0;
        document.getElementById('totalPropuestas').innerText = stats.propuestas_pendientes || 0;
        const tbody = document.querySelector('#tablaUltimosRecaudos tbody');
        if (tbody && stats.ultimos_pagos) {
          tbody.innerHTML = '';
          for (const p of stats.ultimos_pagos) {
            const row = tbody.insertRow();
            row.insertCell(0).innerText = p.nombres + ' ' + (p.apellidos || '');
            row.insertCell(1).innerText = p.municipio || 'No especificado';
            row.insertCell(2).innerHTML = formatMoney(p.valor);
            row.insertCell(3).innerText = p.fecha_pago;
          }
        }
        return;
      }
    }
  } catch {}
  // Fallback to localStorage
  const data = getData();
  const totalIngresos = data.recaudos.reduce((sum, r) => sum + (r.monto || 0), 0);
  document.getElementById('totalIngresos').innerText = formatMoney(totalIngresos);
  document.getElementById('totalUsuarios').innerText = data.usuariosSistema.filter(u => u.activo).length;
  document.getElementById('totalClientes').innerText = data.clientes.length;
  document.getElementById('totalPropuestas').innerText = data.propuestasClientes.filter(p => p.estado === 'PENDIENTE').length;
  const tbody = document.querySelector('#tablaUltimosRecaudos tbody');
  if (tbody) {
    tbody.innerHTML = '';
    const ultimos = [...data.recaudos].reverse().slice(0, 5);
    for (const r of ultimos) {
      const row = tbody.insertRow();
      row.insertCell(0).innerText = r.cliente || 'N/A';
      row.insertCell(1).innerText = r.municipio || 'No especificado';
      row.insertCell(2).innerHTML = formatMoney(r.monto);
      row.insertCell(3).innerText = r.fecha;
    }
  }
}

async function loadUsuarios() {
  try {
    const token = sessionStorage.getItem('sifga_token');
    if (token) {
      const res = await fetch('http://localhost:3000/api/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const usuarios = await res.json();
        const tbody = document.querySelector('#tablaUsuarios tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        for (const u of usuarios) {
          const row = tbody.insertRow();
          row.insertCell(0).innerText = u.id_usuario;
          row.insertCell(1).innerText = u.nombre + (u.apellido ? ' ' + u.apellido : '');
          row.insertCell(2).innerText = u.correo;
          row.insertCell(3).innerText = '********';
          row.insertCell(4).innerText = u.rol;
          row.insertCell(5).innerText = u.estado ? 'Activo' : 'Inactivo';
          const accionesCell = row.insertCell(6);
          if (u.rol !== 'administrador') {
            accionesCell.innerHTML = `<button class="btn-primary" style="background:#3b82f6;margin-right:5px;" onclick="window.toggleUsuario(${u.id_usuario})">${u.estado ? 'Desactivar' : 'Activar'}</button><button class="btn-danger" onclick="window.eliminarUsuarioCompleto(${u.id_usuario})">Eliminar</button>`;
          } else { accionesCell.innerText = 'Acción no permitida'; }
        }
        return;
      }
    }
  } catch {}
  // Fallback
  const data = getData();
  const tbody = document.querySelector('#tablaUsuarios tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  for (const u of data.usuariosSistema) {
    const row = tbody.insertRow();
    row.insertCell(0).innerText = u.id;
    row.insertCell(1).innerText = u.nombre;
    row.insertCell(2).innerText = u.email;
    row.insertCell(3).innerText = u.password;
    row.insertCell(4).innerText = u.rol;
    row.insertCell(5).innerText = u.activo ? 'Activo' : 'Inactivo';
    const accionesCell = row.insertCell(6);
    if (u.rol !== 'administrador') {
      accionesCell.innerHTML = `<button class="btn-primary" style="background:#3b82f6;margin-right:5px;" onclick="window.toggleUsuario(${u.id})">${u.activo ? 'Desactivar' : 'Activar'}</button><button class="btn-danger" onclick="window.eliminarUsuarioCompleto(${u.id})">Eliminar</button>`;
    } else { accionesCell.innerText = 'Acción no permitida'; }
  }
}

export async function crearNuevoUsuario() {
  const nombre = document.getElementById('newUserNombre')?.value;
  const email = document.getElementById('newUserEmail')?.value;
  const rol = document.getElementById('newUserRol')?.value;
  const password = document.getElementById('newUserPassword')?.value;
  if (!nombre || !email) { mostrarMensaje('Complete todos los campos', 'error'); return; }
  const token = sessionStorage.getItem('sifga_token');
  if (token) {
    try {
      const idRol = rol === 'vendedor' ? 2 : 3;
      const res = await fetch('http://localhost:3000/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre, apellido: '', correo: email, usuario: email.split('@')[0], contrasena: password, id_rol: idRol }),
      });
      if (res.ok) { mostrarMensaje(`Usuario ${rol} creado: ${email} / ${password}`, 'exito'); document.getElementById('newUserNombre').value = ''; document.getElementById('newUserEmail').value = ''; loadUsuarios(); loadDashboard(); cargarClientesTarifa(); loadClientesSelectPermiso(); cargarClientesEnSelectMapa(); return; }
    } catch {}
  }
  // Fallback
  let data = getData();
  if (data.usuariosSistema.some(u => u.email === email)) { mostrarMensaje('Este email ya existe', 'error'); return; }
  const newId = data.usuariosSistema.length + 1;
  const nuevoUsuario = { id: newId, nombre, email, rol, activo: true, password };
  if (rol === 'cliente') {
    const newClientId = data.clientes.length + 1;
    nuevoUsuario.clienteId = newClientId;
    data.clientes.push({ id: newClientId, nombre, cedula: 'PENDIENTE', contador: 'PENDIENTE', ubicacion: 'PENDIENTE', ciudad: 'PENDIENTE', region: 'PENDIENTE', estrato: '3', deuda: 0, email, telefono: 'PENDIENTE', historialLecturas: [] });
  }
  data.usuariosSistema.push(nuevoUsuario); saveData();
  mostrarMensaje(`Usuario ${rol} creado: ${email} / ${password}`, 'exito');
  document.getElementById('newUserNombre').value = ''; document.getElementById('newUserEmail').value = '';
  loadUsuarios(); loadDashboard(); cargarClientesTarifa(); loadClientesSelectPermiso(); cargarClientesEnSelectMapa();
}

async function cargarPropuestasPendientes() {
  try {
    const token = sessionStorage.getItem('sifga_token');
    if (token) {
      const res = await fetch('http://localhost:3000/api/clientes/pendientes', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const propuestas = await res.json();
        const tbody = document.querySelector('#tablaPropuestas tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (propuestas.length === 0) { const row = tbody.insertRow(); const cell = row.insertCell(0); cell.colSpan = 13; cell.innerText = 'No hay propuestas pendientes'; cell.style.textAlign = 'center'; return; }
        for (const p of propuestas) {
          const row = tbody.insertRow();
          row.insertCell(0).innerText = p.id_propuesta;
          row.insertCell(1).innerText = (p.vendedor_nombre || '') + ' ' + (p.vendedor_apellido || '');
          row.insertCell(2).innerText = p.nombres + ' ' + (p.apellidos || '');
          row.insertCell(3).innerText = p.cedula || 'N/A';
          row.insertCell(4).innerText = p.numero_contador || 'N/A';
          row.insertCell(5).innerText = p.municipio || 'N/A';
          row.insertCell(6).innerText = p.region || 'N/A';
          row.insertCell(7).innerText = p.direccion || 'N/A';
          row.insertCell(8).innerText = p.correo || 'N/A';
          row.insertCell(9).innerText = p.telefono || 'N/A';
          row.insertCell(10).innerHTML = `<input type="password" id="passPropuesta_${p.id_propuesta}" placeholder="Contraseña" style="width:100px;">`;
          row.insertCell(11).innerHTML = '<span class="estado-pendiente">PENDIENTE</span>';
          row.insertCell(12).innerHTML = `<button class="btn-primary" onclick="window.aprobarPropuesta(${p.id_propuesta})">Aprobar</button><button class="btn-danger" style="margin-left:5px;" onclick="window.rechazarPropuesta(${p.id_propuesta})">Rechazar</button>`;
        }
        return;
      }
    }
  } catch {}
  // Fallback
  const data = getData();
  const propuestas = data.propuestasClientes.filter(p => p.estado === 'PENDIENTE');
  const tbody = document.querySelector('#tablaPropuestas tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (propuestas.length === 0) { const row = tbody.insertRow(); const cell = row.insertCell(0); cell.colSpan = 13; cell.innerText = 'No hay propuestas pendientes'; cell.style.textAlign = 'center'; return; }
  for (const p of propuestas) {
    const vendedor = data.usuariosSistema.find(u => u.id === p.vendedorId);
    const row = tbody.insertRow();
    row.insertCell(0).innerText = p.id;
    row.insertCell(1).innerText = vendedor?.nombre || 'N/A';
    row.insertCell(2).innerText = p.nombre || 'N/A';
    row.insertCell(3).innerText = p.cedula || 'N/A';
    row.insertCell(4).innerText = p.numeroContador || 'N/A';
    row.insertCell(5).innerText = p.ciudad || 'N/A';
    row.insertCell(6).innerText = p.region || 'N/A';
    row.insertCell(7).innerText = p.direccion || 'N/A';
    row.insertCell(8).innerText = p.email || 'N/A';
    row.insertCell(9).innerText = p.telefono || 'N/A';
    row.insertCell(10).innerHTML = `<input type="password" id="passPropuesta_${p.id}" placeholder="Contraseña" style="width:100px;">`;
    row.insertCell(11).innerHTML = '<span class="estado-pendiente">PENDIENTE</span>';
    row.insertCell(12).innerHTML = `<button class="btn-primary" onclick="window.aprobarPropuesta(${p.id})">Aprobar</button><button class="btn-danger" style="margin-left:5px;" onclick="window.rechazarPropuesta(${p.id})">Rechazar</button>`;
  }
}

window.aprobarPropuesta = async function(propuestaId) {
  const passInput = document.getElementById(`passPropuesta_${propuestaId}`);
  const contrasena = passInput?.value?.trim() || 'sifga2025';
  const token = sessionStorage.getItem('sifga_token');
  if (token) {
    try {
      const res = await fetch(`http://localhost:3000/api/clientes/aprobar/${propuestaId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contrasena_asignada: contrasena }),
      });
      if (res.ok) {
        const data = await res.json();
        mostrarMensaje(data.mensaje || 'Cliente aprobado', 'exito');
        cargarPropuestasPendientes(); loadUsuarios(); loadDashboard(); cargarClientesTarifa(); loadClientesSelectPermiso(); cargarClientesEnSelectMapa();
        return;
      }
    } catch {}
  }
  const resultado = aprobarPropuestaCliente(propuestaId, contrasena);
  mostrarMensaje(resultado.message, resultado.success ? 'exito' : 'error');
  if (resultado.success) { cargarPropuestasPendientes(); loadUsuarios(); loadDashboard(); cargarClientesTarifa(); loadClientesSelectPermiso(); cargarClientesEnSelectMapa(); }
};

window.rechazarPropuesta = async function(propuestaId) {
  if (!confirm('¿Rechazar esta propuesta?')) return;
  const token = sessionStorage.getItem('sifga_token');
  if (token) {
    try {
      const res = await fetch(`http://localhost:3000/api/clientes/rechazar/${propuestaId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ observaciones: 'Rechazada por el administrador' }),
      });
      if (res.ok) { mostrarMensaje('Propuesta rechazada', 'exito'); cargarPropuestasPendientes(); loadDashboard(); return; }
    } catch {}
  }
  const resultado = rechazarPropuestaCliente(propuestaId);
  mostrarMensaje(resultado.message, resultado.success ? 'exito' : 'error');
  if (resultado.success) { cargarPropuestasPendientes(); loadDashboard(); }
};

window.toggleUsuario = function(id) {
  let data = getData();
  const user = data.usuariosSistema.find(u => u.id === id);
  if (user && user.rol !== 'administrador') { user.activo = !user.activo; saveData(); loadUsuarios(); loadDashboard(); mostrarMensaje(`Usuario ${user.nombre} ${user.activo ? 'activado' : 'desactivado'}`, 'exito'); }
};

window.eliminarUsuarioCompleto = function(id) {
  if (!confirm('¿Eliminar este usuario permanentemente?')) return;
  let data = getData();
  const userIndex = data.usuariosSistema.findIndex(u => u.id === id);
  if (userIndex !== -1 && data.usuariosSistema[userIndex].rol !== 'administrador') {
    const user = data.usuariosSistema[userIndex];
    if (user.rol === 'cliente' && user.clienteId) {
      data.facturas = data.facturas.filter(f => f.clienteId !== user.clienteId);
      data.recaudos = data.recaudos.filter(r => r.clienteId !== user.clienteId);
      data.clientes = data.clientes.filter(c => c.id !== user.clienteId);
    }
    data.usuariosSistema.splice(userIndex, 1); saveData();
    loadUsuarios(); loadDashboard(); cargarClientesTarifa(); loadClientesSelectPermiso(); cargarClientesEnSelectMapa();
    mostrarMensaje(`Usuario ${user.nombre} eliminado`, 'exito');
  } else { mostrarMensaje('No se puede eliminar al administrador principal', 'error'); }
};

function loadConfiguraciones() {
  const data = getData();
  if (document.getElementById('tarifaAgua')) document.getElementById('tarifaAgua').value = data.config.tarifaPorM3 || 2800;
  if (document.getElementById('tarifaAlcantarillado')) document.getElementById('tarifaAlcantarillado').value = data.config.tarifaAlcantarillado || 45;
  if (document.getElementById('tarifaAseo')) document.getElementById('tarifaAseo').value = data.config.tarifaAseo || 30;
  if (document.getElementById('plazoPago')) document.getElementById('plazoPago').value = data.config.plazoPagoDias || 30;
  if (document.getElementById('interesMora')) document.getElementById('interesMora').value = data.config.interesMoraPorc || 2.0;
  if (document.getElementById('cargoFijo')) document.getElementById('cargoFijo').value = data.config.cargoFijo || 5000;
}

export async function guardarConfiguracion() {
  const tarifaAgua = document.getElementById('tarifaAgua');
  const tarifaAlcantarillado = document.getElementById('tarifaAlcantarillado');
  const tarifaAseo = document.getElementById('tarifaAseo');
  const plazoPago = document.getElementById('plazoPago');
  const interesMora = document.getElementById('interesMora');
  const cargoFijo = document.getElementById('cargoFijo');
  const token = sessionStorage.getItem('sifga_token');
  if (token) {
    try {
      const body = {};
      if (tarifaAgua) body.tarifa_agua_m3 = parseFloat(tarifaAgua.value);
      if (tarifaAlcantarillado) body.tarifa_alcantarillado_porcentaje = parseFloat(tarifaAlcantarillado.value);
      if (tarifaAseo) body.tarifa_aseo_porcentaje = parseFloat(tarifaAseo.value);
      if (plazoPago) body.plazo_pago_dias = parseInt(plazoPago.value);
      if (interesMora) body.interes_mora_porcentaje = parseFloat(interesMora.value);
      if (cargoFijo) body.cargo_fijo = parseFloat(cargoFijo.value);
      const res = await fetch('http://localhost:3000/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (res.ok) { mostrarMensaje('Configuración guardada', 'exito'); return; }
    } catch {}
  }
  let data = getData();
  if (tarifaAgua) data.config.tarifaPorM3 = parseFloat(tarifaAgua.value);
  if (tarifaAlcantarillado) data.config.tarifaAlcantarillado = parseFloat(tarifaAlcantarillado.value);
  if (tarifaAseo) data.config.tarifaAseo = parseFloat(tarifaAseo.value);
  if (plazoPago) data.config.plazoPagoDias = parseInt(plazoPago.value);
  if (interesMora) data.config.interesMoraPorc = parseFloat(interesMora.value);
  if (cargoFijo) data.config.cargoFijo = parseFloat(cargoFijo.value);
  saveData();
  mostrarMensaje('Configuración guardada', 'exito');
}

function cargarClientesTarifa() {
  const data = getData();
  const select = document.getElementById('selectClienteTarifa');
  if (!select) return;
  select.innerHTML = '<option value="">Seleccione un cliente</option>';
  for (const c of data.clientes) {
    const option = document.createElement('option');
    option.value = c.id; option.textContent = `${c.nombre} - ${c.ciudad || 'Sin ciudad'}`;
    select.appendChild(option);
  }
}

function cargarTarifasEspeciales() {
  const data = getData();
  const tbody = document.querySelector('#tablaTarifasEspeciales tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const especiales = data.clientes.filter(c => c.tarifaEspecial || c.plazoEspecial);
  if (especiales.length === 0) { const row = tbody.insertRow(); const cell = row.insertCell(0); cell.colSpan = 5; cell.innerText = 'No hay clientes con tarifa especial'; cell.style.textAlign = 'center'; return; }
  for (const c of especiales) {
    const row = tbody.insertRow();
    row.insertCell(0).innerText = c.nombre;
    row.insertCell(1).innerText = c.tarifaEspecial ? formatMoney(c.tarifaEspecial) + '/m3' : 'General';
    row.insertCell(2).innerText = c.plazoEspecial ? c.plazoEspecial + ' días' : 'General';
    row.insertCell(3).innerText = c.fechaModificacion || 'N/A';
    row.insertCell(4).innerHTML = `<button class="btn-danger" onclick="window.eliminarTarifaEspecial(${c.id})">Eliminar</button>`;
  }
}

window.eliminarTarifaEspecial = function(id) {
  if (!confirm('¿Eliminar configuración especial?')) return;
  let data = getData();
  const c = data.clientes.find(c => c.id === id);
  if (c) { c.tarifaEspecial = null; c.plazoEspecial = null; saveData(); cargarTarifasEspeciales(); mostrarMensaje('Configuración eliminada', 'exito'); }
};

export function guardarTarifaPorCliente() {
  const clienteId = parseInt(document.getElementById('selectClienteTarifa')?.value);
  const tarifaEspecial = document.getElementById('tarifaEspecial')?.value;
  const plazoEspecial = document.getElementById('plazoEspecial')?.value;
  const extender = parseInt(document.getElementById('extenderVencimiento')?.value);
  if (!clienteId) { mostrarMensaje('Seleccione un cliente', 'error'); return; }
  let data = getData();
  const cliente = data.clientes.find(c => c.id === clienteId);
  if (!cliente) { mostrarMensaje('Cliente no encontrado', 'error'); return; }
  let mensajes = [];
  if (tarifaEspecial && tarifaEspecial !== '') { cliente.tarifaEspecial = parseFloat(tarifaEspecial); mensajes.push(`Tarifa especial: ${formatMoney(cliente.tarifaEspecial)} por m3`); }
  if (plazoEspecial && plazoEspecial !== '') { cliente.plazoEspecial = parseInt(plazoEspecial); mensajes.push(`Plazo especial: ${cliente.plazoEspecial} días`); }
  if (extender && extender > 0) {
    const facturasPendientes = data.facturas.filter(f => f.clienteId === clienteId && f.estado === 'Pendiente');
    for (const f of facturasPendientes) {
      const fecha = new Date(f.fechaVencimiento);
      fecha.setDate(fecha.getDate() + extender);
      f.fechaVencimiento = fecha.toISOString().split('T')[0];
    }
    mensajes.push(`Vencimiento extendido ${extender} días`);
  }
  if (mensajes.length === 0) { mostrarMensaje('Complete al menos un campo', 'error'); return; }
  cliente.fechaModificacion = new Date().toISOString().split('T')[0];
  saveData();
  mostrarMensaje(`Configuración guardada para ${cliente.nombre}`, 'exito');
  if (document.getElementById('tarifaEspecial')) document.getElementById('tarifaEspecial').value = '';
  if (document.getElementById('plazoEspecial')) document.getElementById('plazoEspecial').value = '';
  if (document.getElementById('extenderVencimiento')) document.getElementById('extenderVencimiento').value = '';
  cargarTarifasEspeciales();
}

export function limpiarPropuestasAprobadas() {
  if (!confirm('¿Eliminar todas las propuestas aprobadas?')) return;
  let data = getData();
  const original = data.propuestasClientes.length;
  data.propuestasClientes = data.propuestasClientes.filter(p => p.estado !== 'APROBADA');
  saveData();
  mostrarMensaje(`Se eliminaron ${original - data.propuestasClientes.length} propuestas`, 'exito');
  cargarPropuestasPendientes();
  loadDashboard();
}

function loadVendedoresSelect() {
  const data = getData();
  const select = document.getElementById('selectVendedorPermiso');
  if (!select) return;
  select.innerHTML = '<option value="">Seleccione un vendedor</option>';
  const vendedores = data.usuariosSistema.filter(u => u.rol === 'vendedor');
  for (const v of vendedores) { const option = document.createElement('option'); option.value = v.id; option.textContent = v.nombre; select.appendChild(option); }
}

function loadClientesSelectPermiso() {
  const data = getData();
  const select = document.getElementById('selectClientePermiso');
  if (!select) return;
  select.innerHTML = '<option value="">Seleccione un cliente</option>';
  for (const c of data.clientes) { const option = document.createElement('option'); option.value = c.id; option.textContent = c.nombre; select.appendChild(option); }
}

export function otorgarPermiso() {
  const vendedorId = parseInt(document.getElementById('selectVendedorPermiso')?.value);
  const clienteId = parseInt(document.getElementById('selectClientePermiso')?.value);
  const tipoPermiso = document.getElementById('tipoPermiso')?.value;
  const fechaExpiracion = document.getElementById('fechaExpiracion')?.value;
  if (!vendedorId || !clienteId || !fechaExpiracion) { mostrarMensaje('Complete todos los campos', 'error'); return; }
  let data = getData();
  if (!data.permisosVendedores) data.permisosVendedores = [];
  data.permisosVendedores.push({ id: data.permisosVendedores.length + 1, vendedorId, clienteId, permiso: tipoPermiso, fechaExpiracion });
  saveData();
  mostrarMensaje('Permiso otorgado', 'exito');
  loadPermisos();
}

function loadPermisos() {
  const data = getData();
  const tbody = document.querySelector('#tablaPermisos tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!data.permisosVendedores || data.permisosVendedores.length === 0) { const row = tbody.insertRow(); const cell = row.insertCell(0); cell.colSpan = 5; cell.innerText = 'No hay permisos activos'; cell.style.textAlign = 'center'; return; }
  for (const p of data.permisosVendedores) {
    const v = data.usuariosSistema.find(u => u.id === p.vendedorId);
    const c = data.clientes.find(cl => cl.id === p.clienteId);
    const row = tbody.insertRow();
    row.insertCell(0).innerText = v?.nombre || 'N/A';
    row.insertCell(1).innerText = c?.nombre || 'N/A';
    row.insertCell(2).innerText = p.permiso === 'modificar' ? 'Modificar datos' : 'Solo visualizar';
    row.insertCell(3).innerText = p.fechaExpiracion;
    row.insertCell(4).innerHTML = `<button class="btn-danger" onclick="window.eliminarPermiso(${p.id})">Revocar</button>`;
  }
}

window.eliminarPermiso = function(id) {
  if (!confirm('¿Revocar este permiso?')) return;
  let data = getData();
  data.permisosVendedores = data.permisosVendedores.filter(p => p.id !== id);
  saveData();
  loadPermisos();
  mostrarMensaje('Permiso revocado', 'exito');
};

let currentMunicipioFiltro = '';

function loadRecaudosAdmin() {
  const data = getData();
  let recaudosFiltrados = data.recaudos;
  if (currentMunicipioFiltro) recaudosFiltrados = data.recaudos.filter(r => r.municipio === currentMunicipioFiltro);
  const total = recaudosFiltrados.reduce((sum, r) => sum + (r.monto || 0), 0);
  const totalRecaudosEl = document.getElementById('totalRecaudosMunicipio');
  if (totalRecaudosEl) totalRecaudosEl.innerText = formatMoney(total);
  const tbody = document.querySelector('#tablaRecaudosAdmin tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (recaudosFiltrados.length === 0) { const row = tbody.insertRow(); const cell = row.insertCell(0); cell.colSpan = 6; cell.innerText = 'No hay recaudos registrados'; cell.style.textAlign = 'center'; return; }
  for (const r of recaudosFiltrados) {
    const row = tbody.insertRow();
    row.insertCell(0).innerText = r.id;
    row.insertCell(1).innerText = r.cliente;
    row.insertCell(2).innerText = r.municipio || 'No especificado';
    row.insertCell(3).innerHTML = formatMoney(r.monto);
    row.insertCell(4).innerText = r.fecha;
    row.insertCell(5).innerHTML = `<button class="btn-danger" onclick="window.eliminarRecaudo(${r.id})">Eliminar</button>`;
  }
}

export function filtrarRecaudosPorMunicipio() {
  currentMunicipioFiltro = document.getElementById('filtroMunicipioRecaudo')?.value;
  loadRecaudosAdmin();
  loadResumenMunicipios();
}

function loadResumenMunicipios() {
  const data = getData();
  const municipios = ['Bogota','Medellin','Cali'];
  const totalGeneral = data.recaudos.reduce((sum, r) => sum + (r.monto || 0), 0);
  const tbody = document.querySelector('#tablaResumenMunicipios tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  for (const m of municipios) {
    const totalM = data.recaudos.filter(r => r.municipio === m).reduce((sum, r) => sum + (r.monto || 0), 0);
    const pct = totalGeneral > 0 ? ((totalM / totalGeneral) * 100).toFixed(1) : 0;
    const row = tbody.insertRow();
    row.insertCell(0).innerText = m;
    row.insertCell(1).innerHTML = formatMoney(totalM);
    row.insertCell(2).innerText = pct + '%';
  }
}

window.eliminarRecaudo = function(id) {
  if (!confirm('¿Eliminar este recaudo permanentemente?')) return;
  let data = getData();
  data.recaudos = data.recaudos.filter(r => r.id !== id);
  saveData();
  loadRecaudosAdmin();
  loadResumenMunicipios();
  loadDashboard();
  mostrarMensaje('Recaudo eliminado', 'exito');
};

export function generarReporte() {
  const tipo = document.getElementById('tipoReporte')?.value;
  const periodo = document.getElementById('periodoReporte')?.value;
  const data = getData();
  let recaudosFiltrados = [];
  let totalIngresos = 0;
  if (tipo === 'mensual') { recaudosFiltrados = data.recaudos.filter(r => r.fecha.startsWith(periodo)); }
  else { const year = periodo.split('-')[0]; recaudosFiltrados = data.recaudos.filter(r => r.fecha.startsWith(year)); }
  totalIngresos = recaudosFiltrados.reduce((sum, r) => sum + (r.monto || 0), 0);
  const totalClientes = data.clientes.length;
  const totalFacturas = data.facturas.length;
  const totalRecaudosHistoricos = data.recaudos.reduce((sum, r) => sum + (r.monto || 0), 0);
  const carteraVencida = data.facturas.filter(f => f.estado === 'En Mora').reduce((sum, f) => sum + f.totalPagar, 0);
  const activosCorrientes = totalRecaudosHistoricos * 0.3;
  const activosFijos = totalRecaudosHistoricos * 0.5;
  const totalActivos = activosCorrientes + activosFijos;
  const pasivosCorrientes = carteraVencida * 0.4;
  const pasivosLargoPlazo = carteraVencida * 0.2;
  const totalPasivos = pasivosCorrientes + pasivosLargoPlazo;
  const patrimonio = totalActivos - totalPasivos;
  const costosOperacion = totalIngresos * 0.45;
  const gastosAdmin = totalIngresos * 0.15;
  const utilidadBruta = totalIngresos - costosOperacion;
  const utilidadNeta = utilidadBruta - gastosAdmin;
  const entradasEfectivo = totalIngresos;
  const salidasEfectivo = costosOperacion + gastosAdmin;
  const flujoNeto = entradasEfectivo - salidasEfectivo;
  const rentabilidad = totalIngresos > 0 ? ((utilidadNeta / totalIngresos) * 100).toFixed(2) : 0;
  const liquidez = totalPasivos > 0 ? (activosCorrientes / totalPasivos).toFixed(2) : 0;
  const crecimiento = totalIngresos > 0 ? ((totalIngresos / totalRecaudosHistoricos) * 100).toFixed(2) : 0;
  const fechaGeneracion = new Date().toLocaleString();
  const nombreEmpresa = 'AGUAS DE COLOMBIA S.A. E.S.P.';
  const anio = new Date().getFullYear();
  const recaudosRows = recaudosFiltrados.length > 0 ? recaudosFiltrados.map(r => `<tr><td style="padding:6px;">${r.fecha}</td><td style="padding:6px;">${r.cliente}</td><td style="padding:6px;">${r.municipio || 'No especificado'}</td><td style="padding:6px;text-align:right;">${formatMoney(r.monto)}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;">No hay recaudos en este periodo</td></tr>';

  const html = `
    <div class="reporte-financiero" style="background:white;padding:25px;border-radius:16px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align:center;margin-bottom:30px;padding-bottom:15px;border-bottom:2px solid #0f2b3d;">
        <div style="font-size:24px;font-weight:bold;color:#0f2b3d;">SIFGA</div>
        <h2 style="margin:5px 0;">${nombreEmpresa}</h2>
        <h3>Reporte de Cierre de Ingresos - ${tipo === 'mensual' ? 'Mensual' : 'Anual'}</h3>
        <p>Periodo: ${periodo} | Fecha de generación: ${fechaGeneracion}</p>
      </div>
      <div style="margin-bottom:25px;">
        <h3 style="background:#0f2b3d;color:white;padding:10px;border-radius:8px;margin:0 0 15px 0;">Resumen Ejecutivo</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;">
          <div style="background:#f0fdf4;padding:12px;border-radius:8px;border-left:4px solid #10b981;"><div style="font-size:12px;color:#555;">Total Ingresos Periodo</div><div style="font-size:22px;font-weight:bold;">${formatMoney(totalIngresos)}</div></div>
          <div style="background:#eff6ff;padding:12px;border-radius:8px;border-left:4px solid #3b82f6;"><div style="font-size:12px;color:#555;">Ingresos Históricos</div><div style="font-size:22px;font-weight:bold;">${formatMoney(totalRecaudosHistoricos)}</div></div>
          <div style="background:#fef3c7;padding:12px;border-radius:8px;border-left:4px solid #f59e0b;"><div style="font-size:12px;color:#555;">Cartera en Mora</div><div style="font-size:22px;font-weight:bold;">${formatMoney(carteraVencida)}</div></div>
          <div style="background:#fee2e2;padding:12px;border-radius:8px;border-left:4px solid #ef4444;"><div style="font-size:12px;color:#555;">Clientes Registrados</div><div style="font-size:22px;font-weight:bold;">${totalClientes}</div></div>
        </div>
      </div>
      <div style="margin-bottom:25px;">
        <h3 style="background:#1a4a6f;color:white;padding:10px;border-radius:8px;margin:0 0 15px 0;">Balance General</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div style="background:#f8fafc;padding:15px;border-radius:8px;"><h4 style="color:#0f2b3d;margin:0 0 10px 0;">ACTIVOS</h4><table style="width:100%;font-size:13px;"><tr><td style="padding:4px;">Activos Corrientes</td><td style="text-align:right;">${formatMoney(activosCorrientes)}</td></tr><tr><td style="padding:4px;">Activos Fijos (Infraestructura)</td><td style="text-align:right;">${formatMoney(activosFijos)}</td></tr><tr style="font-weight:bold;border-top:1px solid #ddd;"><td style="padding:4px;">TOTAL ACTIVOS</td><td style="text-align:right;">${formatMoney(totalActivos)}</td></tr></table></div>
          <div style="background:#f8fafc;padding:15px;border-radius:8px;"><h4 style="color:#0f2b3d;margin:0 0 10px 0;">PASIVOS Y PATRIMONIO</h4><table style="width:100%;font-size:13px;"><tr><td style="padding:4px;">Pasivos Corrientes</td><td style="text-align:right;">${formatMoney(pasivosCorrientes)}</td></tr><tr><td style="padding:4px;">Pasivos Largo Plazo</td><td style="text-align:right;">${formatMoney(pasivosLargoPlazo)}</td></tr><tr><td style="padding:4px;">Patrimonio</td><td style="text-align:right;">${formatMoney(patrimonio)}</td></tr><tr style="font-weight:bold;border-top:1px solid #ddd;"><td style="padding:4px;">TOTAL PASIVOS + PATRIMONIO</td><td style="text-align:right;">${formatMoney(totalActivos)}</td></tr></table></div>
        </div>
      </div>
      <div style="margin-bottom:25px;">
        <h3 style="background:#1a4a6f;color:white;padding:10px;border-radius:8px;margin:0 0 15px 0;">Estado de Resultados</h3>
        <div style="background:#f8fafc;padding:15px;border-radius:8px;max-width:500px;"><table style="width:100%;font-size:13px;"><tr><td style="padding:4px;">Ingresos por Servicios</td><td style="text-align:right;">${formatMoney(totalIngresos)}</td></tr><tr><td style="padding:4px;">Costos de Operación</td><td style="text-align:right;">- ${formatMoney(costosOperacion)}</td></tr><tr style="border-bottom:1px solid #ddd;"><td style="padding:4px;">Utilidad Bruta</td><td style="text-align:right;">${formatMoney(utilidadBruta)}</td></tr><tr><td style="padding:4px;">Gastos Administrativos</td><td style="text-align:right;">- ${formatMoney(gastosAdmin)}</td></tr><tr style="font-weight:bold;border-top:1px solid #ddd;"><td style="padding:4px;">UTILIDAD NETA</td><td style="text-align:right;">${formatMoney(utilidadNeta)}</td></tr></table></div>
      </div>
      <div style="margin-bottom:25px;">
        <h3 style="background:#1a4a6f;color:white;padding:10px;border-radius:8px;margin:0 0 15px 0;">Estado de Flujo de Efectivo</h3>
        <div style="background:#f8fafc;padding:15px;border-radius:8px;max-width:500px;"><table style="width:100%;font-size:13px;"><tr><td style="padding:4px;">Entradas de Efectivo (Ingresos)</td><td style="text-align:right;">${formatMoney(entradasEfectivo)}</td></tr><tr><td style="padding:4px;">Salidas de Efectivo (Costos + Gastos)</td><td style="text-align:right;">- ${formatMoney(salidasEfectivo)}</td></tr><tr style="font-weight:bold;border-top:1px solid #ddd;"><td style="padding:4px;">FLUJO NETO DE EFECTIVO</td><td style="text-align:right;">${formatMoney(flujoNeto)}</td></tr></table></div>
      </div>
      <div style="margin-bottom:25px;">
        <h3 style="background:#1a4a6f;color:white;padding:10px;border-radius:8px;margin:0 0 15px 0;">Indicadores Financieros</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;">
          <div style="background:#f8fafc;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:12px;color:#555;">Rentabilidad</div><div style="font-size:20px;font-weight:bold;">${rentabilidad}%</div></div>
          <div style="background:#f8fafc;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:12px;color:#555;">Liquidez</div><div style="font-size:20px;font-weight:bold;">${liquidez}</div></div>
          <div style="background:#f8fafc;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:12px;color:#555;">Crecimiento</div><div style="font-size:20px;font-weight:bold;">${crecimiento}%</div></div>
        </div>
      </div>
      <div style="margin-bottom:25px;">
        <h3 style="background:#1a4a6f;color:white;padding:10px;border-radius:8px;margin:0 0 15px 0;">Detalle de Recaudos del Periodo</h3>
        <div class="table-container" style="overflow-x:auto;"><table style="width:100%;font-size:12px;border-collapse:collapse;"><thead><tr style="background:#f1f5f9;"><th style="padding:8px;text-align:left;">Fecha</th><th style="padding:8px;text-align:left;">Cliente</th><th style="padding:8px;text-align:left;">Municipio</th><th style="padding:8px;text-align:right;">Monto</th></tr></thead><tbody>${recaudosRows}<tr style="font-weight:bold;background:#f0fdf4;"><td colspan="3" style="padding:8px;text-align:right;">TOTAL</td><td style="padding:8px;text-align:right;">${formatMoney(totalIngresos)}</td></tr></tbody></table></div>
      </div>
      <div style="text-align:center;margin-top:20px;padding-top:15px;border-top:1px solid #ddd;font-size:11px;color:#666;">
        <p>Documento generado por SIFGA - Sistema Integrado de Facturación y Gestión de Agua</p>
        <p>Creado by Programmer Ivan Rodríguez - Derechos Reservados © ${anio}</p>
        <div style="margin-top:10px;"><button class="btn-primary" onclick="window.print()">🖨️ Imprimir Reporte</button></div>
      </div>
    </div>`;
  const vistaReporte = document.getElementById('vistaReporte');
  if (vistaReporte) vistaReporte.innerHTML = html;
}

function cargarClientesEnSelectMapa() {
  const data = getData();
  const select = document.getElementById('selectClienteMapa');
  if (!select) return;
  select.innerHTML = '<option value="">Seleccione un cliente</option>';
  for (const c of data.clientes) { const option = document.createElement('option'); option.value = c.id; option.textContent = `${c.nombre} - ${c.ciudad || 'Sin ciudad'}`; select.appendChild(option); }
}

export function buscarClienteEnMapa() {
  const clienteId = document.getElementById('selectClienteMapa')?.value;
  if (!clienteId) { mostrarMensaje('Seleccione un cliente', 'error'); return; }
  const data = getData();
  const cliente = data.clientes.find(c => c.id === parseInt(clienteId));
  if (!cliente || !cliente.ciudad) { mostrarMensaje('Cliente sin ciudad asignada', 'error'); return; }
  const coords = { Bogota: [4.711, -74.0721], Medellin: [6.2442, -75.5812], Cali: [3.4516, -76.532] }[cliente.ciudad];
  if (!coords) { mostrarMensaje(`No hay coordenadas para ${cliente.ciudad}`, 'error'); return; }
  if (currentMap) {
    currentMap.setView(coords, 13);
    for (const m of currentMarkers) currentMap.removeLayer(m);
    currentMarkers = [];
    const marker = L.marker(coords).addTo(currentMap);
    marker.bindPopup(`<b>${cliente.nombre}</b><br>Ciudad: ${cliente.ciudad}<br>Contador: ${cliente.contador}`).openPopup();
    currentMarkers.push(marker);
    mostrarMensaje(`Cliente ubicado: ${cliente.nombre}`, 'exito');
  }
}

function initMap() {
  const mapDiv = document.getElementById('mapaRutas');
  if (!mapDiv || mapDiv._leaflet_id) return;
  currentMap = L.map('mapaRutas').setView([4.711, -74.0721], 11);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: 'Map data' }).addTo(currentMap);
  const data = getData();
  const coordsMap = { Bogota: [4.711, -74.0721], Medellin: [6.2442, -75.5812], Cali: [3.4516, -76.532] };
  for (const c of data.clientes) {
    if (c.ciudad && coordsMap[c.ciudad]) {
      const marker = L.marker(coordsMap[c.ciudad]).addTo(currentMap);
      marker.bindPopup(`<b>${c.nombre}</b><br>Ciudad: ${c.ciudad}`);
      currentMarkers.push(marker);
    }
  }
}
