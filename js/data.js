let sifgaData = null;
let useAPI = false;

function initData() {
  return {
    config: {
      tarifaPorM3: 2800,
      tarifaAlcantarillado: 45,
      tarifaAseo: 30,
      plazoPagoDias: 30,
      interesMoraPorc: 2.0,
      cargoFijo: 5000,
    },
    usuariosSistema: [
      { id: 1, nombre: 'Admin Principal', email: 'admin@sifga.com', rol: 'administrador', activo: true, password: 'admin123' },
      { id: 2, nombre: 'Juan Perez', email: 'juan.perez@sifga.com', rol: 'vendedor', activo: true, password: 'vendor123' },
    ],
    permisosVendedores: [],
    propuestasClientes: [],
    clientes: [],
    facturas: [],
    recaudos: [],
    lecturasGuardadas: [],
    ultimoConsecutivoFactura: 0,
  };
}

export function loadData() {
  const stored = localStorage.getItem('sifga_db');
  if (stored) {
    sifgaData = JSON.parse(stored);
    if (!sifgaData.facturas) sifgaData.facturas = [];
    if (!sifgaData.recaudos) sifgaData.recaudos = [];
    if (!sifgaData.propuestasClientes) sifgaData.propuestasClientes = [];
    if (!sifgaData.clientes) sifgaData.clientes = [];
    if (!sifgaData.usuariosSistema) sifgaData.usuariosSistema = [];
    if (!sifgaData.permisosVendedores) sifgaData.permisosVendedores = [];
    if (!sifgaData.lecturasGuardadas) sifgaData.lecturasGuardadas = [];
    if (sifgaData.ultimoConsecutivoFactura === undefined) sifgaData.ultimoConsecutivoFactura = 0;
    if (!sifgaData.config) {
      sifgaData.config = { tarifaPorM3: 2800, tarifaAlcantarillado: 45, tarifaAseo: 30, plazoPagoDias: 30, interesMoraPorc: 2.0, cargoFijo: 5000 };
    }
  } else {
    sifgaData = initData();
    saveData();
  }
  return sifgaData;
}

export function saveData() {
  if (sifgaData) {
    localStorage.setItem('sifga_db', JSON.stringify(sifgaData));
  }
}

export function getData() {
  if (!sifgaData) loadData();
  return sifgaData;
}

export function setData(newData) {
  sifgaData = newData;
  saveData();
}

// API-backed functions - these will use the backend when available
async function ensureAPIReady() {
  if (!useAPI) {
    try {
      const token = sessionStorage.getItem('sifga_token');
      if (token) useAPI = true;
    } catch { useAPI = false; }
  }
  return useAPI;
}

export async function crearPropuestaCliente(propuestaData) {
  if (await ensureAPIReady()) {
    try {
      const data = await SIFGA_API.createCliente(propuestaData);
      return { success: true, message: data.mensaje || 'Propuesta enviada', propuesta: data };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
  const data = getData();
  const nuevaPropuesta = {
    id: data.propuestasClientes.length + 1,
    fechaPropuesta: new Date().toISOString().split('T')[0],
    estado: 'PENDIENTE',
    ...propuestaData,
  };
  data.propuestasClientes.push(nuevaPropuesta);
  saveData();
  return { success: true, message: 'Propuesta enviada al administrador', propuesta: nuevaPropuesta };
}

export async function obtenerPropuestasPendientes() {
  if (await ensureAPIReady()) {
    try {
      return await SIFGA_API.getPendingProposals();
    } catch { return []; }
  }
  return getData().propuestasClientes.filter(p => p.estado === 'PENDIENTE');
}

export async function aprobarPropuestaCliente(propuestaId, contrasenaAsignada) {
  if (await ensureAPIReady()) {
    try {
      const data = await SIFGA_API.approveProposal(propuestaId, contrasenaAsignada);
      return { success: true, message: data.mensaje || 'Cliente aprobado' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
  const data = getData();
  const propuesta = data.propuestasClientes.find(p => p.id === propuestaId);
  if (!propuesta || propuesta.estado !== 'PENDIENTE') return { success: false, message: 'Propuesta no encontrada o ya procesada' };
  const nuevoClienteId = data.clientes.length + 1;
  data.clientes.push({ id: nuevoClienteId, nombre: propuesta.nombre, cedula: propuesta.cedula, contador: propuesta.numeroContador, ubicacion: propuesta.direccion, ciudad: propuesta.ciudad, region: propuesta.region, estrato: propuesta.estrato || '3', deuda: 0, email: propuesta.email, telefono: propuesta.telefono, historialLecturas: [] });
  const nuevoUsuarioId = data.usuariosSistema.length + 1;
  data.usuariosSistema.push({ id: nuevoUsuarioId, nombre: propuesta.nombre, email: propuesta.email, rol: 'cliente', activo: true, password: contrasenaAsignada, clienteId: nuevoClienteId });
  propuesta.estado = 'APROBADA';
  propuesta.fechaAprobacion = new Date().toISOString().split('T')[0];
  propuesta.passwordAsignada = contrasenaAsignada;
  saveData();
  return { success: true, message: `Cliente ${propuesta.nombre} aprobado. Credenciales: ${propuesta.email} / ${contrasenaAsignada}` };
}

export async function rechazarPropuestaCliente(propuestaId) {
  if (await ensureAPIReady()) {
    try {
      const data = await SIFGA_API.rejectProposal(propuestaId);
      return { success: true, message: data.mensaje || 'Propuesta rechazada' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
  const data = getData();
  const propuesta = data.propuestasClientes.find(p => p.id === propuestaId);
  if (!propuesta) return { success: false, message: 'Propuesta no encontrada' };
  propuesta.estado = 'RECHAZADA';
  propuesta.fechaRechazo = new Date().toISOString().split('T')[0];
  saveData();
  return { success: true, message: `Propuesta de ${propuesta.nombre} rechazada` };
}

export async function guardarFactura(factura) {
  if (await ensureAPIReady()) {
    try {
      return await SIFGA_API.createFactura(factura);
    } catch (e) { throw e; }
  }
  const data = getData();
  const nuevaFactura = { ...factura, id: Date.now() };
  data.facturas.push(nuevaFactura);
  saveData();
  return nuevaFactura;
}

export async function obtenerFacturas() {
  if (await ensureAPIReady()) {
    try {
      return await SIFGA_API.getFacturas();
    } catch { return []; }
  }
  return getData().facturas;
}

export function obtenerFacturasPorCliente(clienteId) {
  return getData().facturas.filter(f => f.clienteId === clienteId);
}

export function actualizarEstadoFactura(facturaId, nuevoEstado) {
  const data = getData();
  const factura = data.facturas.find(f => f.id === facturaId);
  if (factura) { factura.estado = nuevoEstado; saveData(); return true; }
  return false;
}

export function verificarEstadosFacturas() {
  const data = getData();
  const hoy = new Date();
  let actualizados = 0;
  for (let i = 0; i < data.facturas.length; i++) {
    const f = data.facturas[i];
    if (f.estado === 'Pendiente') {
      const fechaVenc = new Date(f.fechaVencimiento);
      if (fechaVenc < hoy) { f.estado = 'En Mora'; actualizados++; }
    }
  }
  if (actualizados > 0) saveData();
  return actualizados;
}

export function guardarLecturaManual(lectura) {
  const data = getData();
  if (!data.lecturasGuardadas) data.lecturasGuardadas = [];
  data.lecturasGuardadas.push(lectura);
  saveData();
  return lectura;
}

export function obtenerLecturasGuardadas() {
  return getData().lecturasGuardadas || [];
}

export async function fetchFromAPI(endpoint) {
  try {
    const token = sessionStorage.getItem('sifga_token');
    const res = await fetch(`http://localhost:3000/api${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return await res.json();
  } catch { return null; }
}
