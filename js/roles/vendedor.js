import { getData, saveData, crearPropuestaCliente } from "../data.js";
import {
  mostrarMensaje,
  formatMoney,
  logout,
  toggleMobileMenu,
} from "../utils.js";
import {
  calcularFactura,
  guardarFacturaCompleta,
  obtenerLecturasGuardadas,
} from "../facturacion.js";
import { generarHTMLFactura, mostrarFacturaEnPantalla } from "../impresion.js";

window.logout = logout;
window.toggleMobileMenu = toggleMobileMenu;

let vendedorId = parseInt(sessionStorage.getItem('sifga_userId')) || 2;
let currentMapV = null;
let currentMarkersV = [];
let todasLasLecturas = [];

function getToken() {
  return sessionStorage.getItem('sifga_token');
}

function apiBase() {
  return 'http://localhost:3000/api';
}

export function inicializarVendedor() {
  console.log("Inicializando panel de vendedor...");
  loadDashboardV();
  const dashboardDiv = document.getElementById("dashboard");
  if (dashboardDiv) dashboardDiv.style.display = "block";
}

export function ocultarFactura() {
  const resultadoDiv = document.getElementById("resultadoFactura");
  if (resultadoDiv) {
    resultadoDiv.style.display = "none";
    resultadoDiv.innerHTML = "";
  }
}

function ocultarTodasSecciones() {
  const sections = [
    "dashboard",
    "clientesActivos",
    "proponerCliente",
    "tomarLectura",
    "consultaFacturas",
    "anticiposRecaudos",
    "rutas",
  ];
  for (let i = 0; i < sections.length; i++) {
    const el = document.getElementById(sections[i]);
    if (el) el.style.display = "none";
  }
  ocultarFactura();
}

export function showSection(section) {
  console.log("showSection vendedor:", section);
  ocultarTodasSecciones();
  const selected = document.getElementById(section);
  if (selected) selected.style.display = "block";
  const titles = {
    dashboard: "Dashboard Vendedor",
    clientesActivos: "Gestión de Clientes Activos",
    proponerCliente: "Proponer Nuevo Cliente",
    tomarLectura: "Tomar Lectura y Facturar",
    consultaFacturas: "Consulta de Facturas",
    anticiposRecaudos: "Anticipos y Recaudos",
    rutas: "Rutas de Facturación",
  };
  const titleEl = document.getElementById("sectionTitle");
  if (titleEl) titleEl.innerText = titles[section] || section;
  if (section === "dashboard") {
    loadDashboardV();
  } else if (section === "clientesActivos") {
    setTimeout(() => cargarClientesActivos(), 50);
  } else if (section === "proponerCliente") {
    setTimeout(() => loadMisPropuestas(), 50);
  } else if (section === "tomarLectura") {
    setTimeout(() => loadClientesSelect(), 50);
  } else if (section === "consultaFacturas") {
    setTimeout(() => cargarLecturasGuardadas(), 50);
  } else if (section === "anticiposRecaudos") {
    setTimeout(() => cargarAnticiposRecaudos(), 50);
  } else if (section === "rutas") {
    setTimeout(() => {
      initMapV();
      cargarClientesEnSelectMapaV();
    }, 100);
  }
}

async function loadDashboardV() {
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/reportes/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const stats = await res.json();
        const elFacturas = document.getElementById("totalFacturas");
        const elPropuestas = document.getElementById("totalPropuestasV");
        const elRecaudos = document.getElementById("totalRecaudosV");
        if (elFacturas) elFacturas.innerText = stats.facturas_mes || stats.total_facturas || 0;
        if (elPropuestas) elPropuestas.innerText = stats.propuestas_pendientes || 0;
        if (elRecaudos) elRecaudos.innerText = formatMoney(stats.mis_recaudos || stats.total_recaudado || 0);
        return;
      }
    } catch {}
  }
  const data = getData();
  const mesActual = new Date().toISOString().slice(0, 7);
  const facturasMes = data.facturas.filter(
    (f) => f.periodo?.includes(mesActual) || false,
  );
  const misPropuestas = data.propuestasClientes.filter(
    (p) => p.vendedorId === vendedorId && p.estado === "PENDIENTE",
  );
  const totalRecaudos = data.recaudos.reduce(
    (sum, r) => sum + (r.monto || 0),
    0,
  );
  const totalFacturas = document.getElementById("totalFacturas");
  const totalPropuestas = document.getElementById("totalPropuestasV");
  const totalRecaudosEl = document.getElementById("totalRecaudosV");
  if (totalFacturas) totalFacturas.innerText = facturasMes.length;
  if (totalPropuestas) totalPropuestas.innerText = misPropuestas.length;
  if (totalRecaudosEl) totalRecaudosEl.innerText = formatMoney(totalRecaudos);
}

async function cargarClientesActivos() {
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const clientes = await res.json();
        const tbody = document.querySelector("#tablaClientesActivos tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (clientes.length === 0) {
          const row = tbody.insertRow();
          const cell = row.insertCell(0);
          cell.colSpan = 9;
          cell.innerText = "No hay clientes registrados";
          cell.style.textAlign = "center";
          return;
        }
        for (const c of clientes) {
          const row = tbody.insertRow();
          const nombreCompleto = (c.nombres || '') + ' ' + (c.apellidos || '');
          row.insertCell(0).innerText = c.id_cliente;
          row.insertCell(1).innerText = nombreCompleto.trim() || "N/A";
          row.insertCell(2).innerText = c.cedula || "N/A";
          row.insertCell(3).innerText = c.numero_contador || "N/A";
          row.insertCell(4).innerText = c.municipio || "N/A";
          row.insertCell(5).innerText = c.telefono || "N/A";
          row.insertCell(6).innerText = c.correo || "N/A";
          row.insertCell(7).innerText = "Modificar permitido";
          row.insertCell(8).innerHTML =
            `<button class="btn-primary" style="background:#3b82f6;" onclick="window.mostrarFormularioModificar(${c.id_cliente})">Modificar</button>`;
        }
        return;
      }
    } catch {}
  }
  const data = getData();
  const permisos = data.permisosVendedores || [];
  const tbody = document.querySelector("#tablaClientesActivos tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (data.clientes.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 9;
    cell.innerText = "No hay clientes registrados";
    cell.style.textAlign = "center";
    return;
  }
  for (let i = 0; i < data.clientes.length; i++) {
    const c = data.clientes[i];
    const tienePermiso = permisos.some(
      (p) => p.vendedorId === vendedorId && p.clienteId === c.id,
    );
    const row = tbody.insertRow();
    row.insertCell(0).innerText = c.id;
    row.insertCell(1).innerText = c.nombre || "N/A";
    row.insertCell(2).innerText = c.cedula || "N/A";
    row.insertCell(3).innerText = c.contador || "N/A";
    row.insertCell(4).innerText = c.ciudad || "N/A";
    row.insertCell(5).innerText = c.telefono || "N/A";
    row.insertCell(6).innerText = c.email || "N/A";
    row.insertCell(7).innerText = tienePermiso
      ? "Modificar permitido"
      : "Solo lectura";
    if (tienePermiso) {
      row.insertCell(8).innerHTML =
        `<button class="btn-primary" style="background:#3b82f6;" onclick="window.mostrarFormularioModificar(${c.id})">Modificar</button>`;
    } else {
      row.insertCell(8).innerHTML =
        '<span class="estado-pendiente">Sin permiso</span>';
    }
  }
}

window.mostrarFormularioModificar = async function (clienteId) {
  const token = getToken();
  let c = null;
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/clientes/${clienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) c = await res.json();
    } catch {}
  }
  if (!c) {
    const data = getData();
    c = data.clientes.find((c) => c.id === clienteId);
  }
  if (!c) return;
  const nombreCompleto = (c.nombres || c.nombre || '') + ' ' + (c.apellidos || '');
  document.getElementById("modificarClienteId").value = c.id_cliente || c.id;
  document.getElementById("modificarNombre").value = nombreCompleto.trim() || c.nombre || "";
  document.getElementById("modificarCedula").value = c.cedula || "";
  document.getElementById("modificarDireccion").value = c.direccion || c.ubicacion || "";
  document.getElementById("modificarContador").value = c.numero_contador || c.contador || "";
  document.getElementById("modificarCiudad").value = c.municipio || c.ciudad || "";
  document.getElementById("modificarRegion").value = c.region || "";
  document.getElementById("modificarEstrato").value = c.estrato_numero || c.estrato || "3";
  document.getElementById("modificarEmail").value = c.correo || c.email || "";
  document.getElementById("modificarTelefono").value = c.telefono || "";
  const form = document.getElementById("formModificarCliente");
  if (form) form.style.display = "block";
};

export async function guardarModificacionCliente() {
  const id = parseInt(document.getElementById("modificarClienteId").value);
  const nombre = document.getElementById("modificarNombre").value;
  const cedula = document.getElementById("modificarCedula").value;
  const direccion = document.getElementById("modificarDireccion").value;
  const contador = document.getElementById("modificarContador").value;
  const ciudad = document.getElementById("modificarCiudad").value;
  const region = document.getElementById("modificarRegion").value;
  const estrato = document.getElementById("modificarEstrato").value;
  const email = document.getElementById("modificarEmail").value;
  const telefono = document.getElementById("modificarTelefono").value;

  if (!nombre || !cedula || !contador) {
    mostrarMensaje("Complete campos obligatorios", "error");
    return;
  }

  const token = getToken();
  if (token) {
    try {
      const nameParts = nombre.trim().split(' ');
      const nombres = nameParts[0] || nombre;
      const apellidos = nameParts.slice(1).join(' ') || '';
      const res = await fetch(`${apiBase()}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombres, apellidos, cedula, direccion, telefono, correo: email,
          numero_contador: contador, id_municipio: null, id_estrato: parseInt(estrato) || null
        }),
      });
      if (res.ok) {
        mostrarMensaje(`Datos de ${nombre} actualizados`, "exito");
        cancelarModificacion();
        cargarClientesActivos();
        loadDashboardV();
        return;
      }
    } catch {}
  }

  let data = getData();
  const cliente = data.clientes.find((c) => c.id === id);
  if (cliente) {
    cliente.nombre = nombre;
    cliente.cedula = cedula;
    cliente.ubicacion = direccion;
    cliente.contador = contador;
    cliente.ciudad = ciudad;
    cliente.region = region;
    cliente.estrato = estrato;
    cliente.email = email;
    cliente.telefono = telefono;
    const usuario = data.usuariosSistema.find((u) => u.clienteId === id);
    if (usuario) {
      usuario.nombre = nombre;
      usuario.email = email;
    }
    saveData();
    mostrarMensaje(`Datos de ${nombre} actualizados`, "exito");
    cancelarModificacion();
    cargarClientesActivos();
    loadDashboardV();
  }
}

export function cancelarModificacion() {
  const form = document.getElementById("formModificarCliente");
  if (form) form.style.display = "none";
}

export async function enviarPropuesta() {
  const nombre = document.getElementById("propNombre")?.value;
  const cedula = document.getElementById("propCedula")?.value;
  const direccion = document.getElementById("propDireccion")?.value;
  const contador = document.getElementById("propContador")?.value;
  const ciudad = document.getElementById("propCiudad")?.value;
  const region = document.getElementById("propRegion")?.value;
  const estrato = document.getElementById("propEstrato")?.value;
  const email = document.getElementById("propEmail")?.value;
  const telefono = document.getElementById("propTelefono")?.value;

  if (!nombre || !cedula || !contador || !ciudad || !region) {
    mostrarMensaje("Complete campos obligatorios", "error");
    return;
  }

  const nameParts = nombre.trim().split(' ');
  const nombres = nameParts[0] || nombre;
  const apellidos = nameParts.slice(1).join(' ') || '';

  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombres, apellidos, cedula, direccion, telefono, correo: email,
          numero_contador: contador, id_municipio: null, id_estrato: parseInt(estrato) || null
        }),
      });
      if (res.ok) {
        mostrarMensaje(`Propuesta enviada para ${nombre}`, "exito");
        limpiarFormPropuesta();
        loadMisPropuestas();
        loadDashboardV();
        return;
      }
      const errData = await res.json();
      mostrarMensaje(errData.error || 'Error al crear cliente', 'error');
      return;
    } catch {}
  }

  // Fallback: use data.js which also tries API via SIFGA_API
  const resultado = await crearPropuestaCliente({
    vendedorId: vendedorId,
    nombre: nombre,
    cedula: cedula,
    direccion: direccion,
    numeroContador: contador,
    ciudad: ciudad,
    region: region,
    estrato: estrato,
    email: email,
    telefono: telefono,
  });

  if (resultado.success) {
    mostrarMensaje(`Propuesta enviada para ${nombre}`, "exito");
    limpiarFormPropuesta();
    loadMisPropuestas();
    loadDashboardV();
  } else {
    mostrarMensaje(resultado.message, "error");
  }
}

function limpiarFormPropuesta() {
  document.getElementById("propNombre").value = "";
  document.getElementById("propCedula").value = "";
  document.getElementById("propDireccion").value = "";
  document.getElementById("propContador").value = "";
  document.getElementById("propCiudad").value = "";
  document.getElementById("propRegion").value = "";
  document.getElementById("propEmail").value = "";
  document.getElementById("propTelefono").value = "";
}

async function loadMisPropuestas() {
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/clientes/pendientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const propuestas = await res.json();
        const tbody = document.querySelector("#tablaMisPropuestas tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (propuestas.length === 0) {
          const row = tbody.insertRow();
          const cell = row.insertCell(0);
          cell.colSpan = 6;
          cell.innerText = "No tienes propuestas registradas";
          cell.style.textAlign = "center";
          return;
        }
        for (const p of propuestas) {
          const row = tbody.insertRow();
          row.insertCell(0).innerText = p.id_propuesta;
          const nombreCompleto = (p.nombres || '') + ' ' + (p.apellidos || '');
          row.insertCell(1).innerText = nombreCompleto.trim() || "N/A";
          row.insertCell(2).innerText = p.cedula || "N/A";
          row.insertCell(3).innerText = p.municipio || "N/A";
          row.insertCell(4).innerText = p.numero_contador || "N/A";
          const estadosMap = { 1: 'PENDIENTE', 2: 'APROBADA', 3: 'RECHAZADA' };
          const estadoTexto = estadosMap[p.id_estado] || 'PENDIENTE';
          let estadoClass = "estado-pendiente";
          if (estadoTexto === "APROBADA") estadoClass = "estado-aprobado";
          const estadoCell = row.insertCell(5);
          estadoCell.innerText = estadoTexto;
          estadoCell.className = estadoClass;
        }
        return;
      }
    } catch {}
  }
  const data = getData();
  const mis = data.propuestasClientes.filter(
    (p) => p.vendedorId === vendedorId,
  );
  const tbody = document.querySelector("#tablaMisPropuestas tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (mis.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 6;
    cell.innerText = "No tienes propuestas registradas";
    cell.style.textAlign = "center";
    return;
  }
  for (let i = 0; i < mis.length; i++) {
    const p = mis[i];
    const row = tbody.insertRow();
    row.insertCell(0).innerText = p.id;
    row.insertCell(1).innerText = p.nombre;
    row.insertCell(2).innerText = p.cedula;
    row.insertCell(3).innerText = p.ciudad || "N/A";
    row.insertCell(4).innerText = p.numeroContador || "N/A";
    let estadoTexto = p.estado;
    let estadoClass = "estado-pendiente";
    if (p.estado === "APROBADA") {
      estadoTexto = "APROBADA";
      estadoClass = "estado-aprobado";
    } else if (p.estado === "RECHAZADA") {
      estadoTexto = "RECHAZADA";
    }
    const estadoCell = row.insertCell(5);
    estadoCell.innerText = estadoTexto;
    estadoCell.className = estadoClass;
  }
}

async function loadClientesSelect() {
  const token = getToken();
  let clientes = [];
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        clientes = await res.json();
      }
    } catch {}
  }
  if (clientes.length === 0) {
    const data = getData();
    clientes = data.clientes.map(c => ({
      id_cliente: c.id,
      nombres: c.nombre,
      apellidos: ''
    }));
  }
  const select = document.getElementById("selectCliente");
  if (!select) return;
  select.innerHTML = '<option value="">Seleccione un cliente</option>';
  for (const c of clientes) {
    const option = document.createElement("option");
    option.value = c.id_cliente;
    const nombre = (c.nombres || '') + ' ' + (c.apellidos || '');
    option.textContent = nombre.trim() || c.nombre || 'Cliente';
    select.appendChild(option);
  }
}

export async function generarFactura() {
  const clienteId = parseInt(document.getElementById("selectCliente")?.value);
  const lecturaActual = parseFloat(
    document.getElementById("lecturaActual")?.value,
  );
  const fechaInicio = document.getElementById("fechaInicioPeriodo")?.value;
  const fechaFin = document.getElementById("fechaFinPeriodo")?.value;
  const fechaLectura =
    document.getElementById("fechaLectura")?.value ||
    new Date().toISOString().split("T")[0];
  const periodo = fechaInicio && fechaFin ? `${fechaInicio} / ${fechaFin}` : "";

  if (!clienteId || !lecturaActual || !periodo) {
    mostrarMensaje(
      "Seleccione un cliente, ingrese la lectura y el periodo",
      "error",
    );
    return;
  }

  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/facturas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id_cliente: clienteId,
          periodo,
          fecha_lectura: fechaLectura,
          lectura_actual: lecturaActual,
          observaciones: null
        }),
      });
      if (res.ok) {
        const result = await res.json();
        // Fetch full invoice for display
        const facturaRes = await fetch(`${apiBase()}/facturas/${result.id_factura}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (facturaRes.ok) {
          const facturaFull = await facturaRes.json();
          ocultarTodasSecciones();
          const clienteData = {
            nombre: (facturaFull.nombres || '') + ' ' + (facturaFull.apellidos || ''),
            cedula: facturaFull.cedula,
            ubicacion: facturaFull.direccion,
            telefono: facturaFull.telefono,
            ciudad: facturaFull.municipio,
            contador: facturaFull.numero_contador,
            estrato: facturaFull.estrato_numero
          };
          const facturaDisplay = {
            numeroFactura: facturaFull.codigo_factura,
            clienteId: facturaFull.id_cliente,
            clienteNombre: (facturaFull.nombres || '') + ' ' + (facturaFull.apellidos || ''),
            clienteCedula: facturaFull.cedula,
            clienteContador: facturaFull.numero_contador,
            clienteDireccion: facturaFull.direccion,
            clienteCiudad: facturaFull.municipio,
            estrato: facturaFull.estrato_numero,
            periodo: facturaFull.periodo,
            fechaLectura: facturaFull.fecha_lectura,
            fechaEmision: facturaFull.fecha_emision,
            fechaVencimiento: facturaFull.fecha_vencimiento,
            lecturaAnterior: facturaFull.lectura_anterior,
            lecturaActual: facturaFull.lectura_actual,
            consumoM3: facturaFull.consumo_m3,
            tarifaAplicada: facturaFull.tarifa_agua,
            valorAgua: facturaFull.valor_agua,
            valorAlcantarillado: facturaFull.valor_alcantarillado,
            valorAseo: facturaFull.valor_aseo,
            subtotal: facturaFull.subtotal,
            porcentajeSubsidio: facturaFull.porcentaje_subsidio,
            descuentoSubsidio: facturaFull.descuento_subsidio,
            contribucion: facturaFull.contribucion,
            cargoFijo: facturaFull.cargo_fijo,
            moraAnterior: facturaFull.mora_anterior,
            totalPagar: facturaFull.total_pagar,
            estado: facturaFull.estado_nombre || 'Pendiente'
          };
          const htmlFactura = generarHTMLFactura(facturaDisplay, clienteData);
          mostrarFacturaEnPantalla(htmlFactura, "resultadoFactura");
          mostrarMensaje(`Factura ${facturaFull.codigo_factura} generada y guardada`, "exito");
          document.getElementById("lecturaActual").value = "";
          document.getElementById("fechaInicioPeriodo").value = "";
          document.getElementById("fechaFinPeriodo").value = "";
          loadClientesSelect();
          loadDashboardV();
          if (document.getElementById("consultaFacturas")?.style.display === "block") {
            cargarLecturasGuardadas();
          }
          return;
        }
      }
    } catch {}
  }

  // Fallback to localStorage
  let data = getData();
  const cliente = data.clientes.find((c) => c.id === clienteId);
  if (!cliente) {
    mostrarMensaje("Cliente no encontrado", "error");
    return;
  }
  try {
    const facturaCalculada = calcularFactura(
      cliente,
      lecturaActual,
      periodo,
      fechaLectura,
      true,
    );
    guardarFacturaCompleta(facturaCalculada, clienteId, lecturaActual, periodo);
    ocultarTodasSecciones();
    const htmlFactura = generarHTMLFactura(facturaCalculada, cliente);
    mostrarFacturaEnPantalla(htmlFactura, "resultadoFactura");
    mostrarMensaje(
      `Factura ${facturaCalculada.numeroFactura} generada y guardada`,
      "exito",
    );
    document.getElementById("lecturaActual").value = "";
    document.getElementById("fechaInicioPeriodo").value = "";
    document.getElementById("fechaFinPeriodo").value = "";
    loadClientesSelect();
    loadDashboardV();
    if (document.getElementById("consultaFacturas")?.style.display === "block") {
      cargarLecturasGuardadas();
    }
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

export async function cargarLecturasGuardadas() {
  console.log("Cargando lecturas guardadas...");
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/facturas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const facturas = await res.json();
        todasLasLecturas = facturas.map(f => ({
          id: f.id_factura,
          numeroFactura: f.codigo_factura || 'N/A',
          clienteNombre: (f.nombres || '') + ' ' + (f.apellidos || ''),
          clienteId: f.id_cliente,
          clienteCedula: f.cedula,
          lecturaActual: f.lectura_actual,
          periodo: f.periodo || 'N/A',
          fechaLectura: f.fecha_lectura || f.fecha_emision,
          fechaRegistro: f.fecha_emision,
          fechaVencimiento: f.fecha_vencimiento || 'N/A',
          totalPagar: f.total_pagar || 0,
          estado: f.estado_nombre || 'Pendiente',
          facturaId: f.id_factura,
        }));
        filtrarFacturasGeneral();
        return;
      }
    } catch {}
  }
  const lecturas = obtenerLecturasGuardadas();
  todasLasLecturas = lecturas;
  filtrarFacturasGeneral();
}

export function filtrarFacturasGeneral() {
  const textoBusqueda =
    document.getElementById("buscarFacturaGeneral")?.value.toLowerCase() || "";
  const estadoFiltro =
    document.getElementById("filtroEstadoFactura")?.value || "";

  let lecturasFiltradas = [...todasLasLecturas];

  if (textoBusqueda) {
    lecturasFiltradas = lecturasFiltradas.filter(
      (l) =>
        (l.numeroFactura &&
          l.numeroFactura.toLowerCase().includes(textoBusqueda)) ||
        (l.clienteNombre &&
          l.clienteNombre.toLowerCase().includes(textoBusqueda)) ||
        (l.estado && l.estado.toLowerCase().includes(textoBusqueda)),
    );
  }

  if (estadoFiltro) {
    lecturasFiltradas = lecturasFiltradas.filter(
      (l) => l.estado === estadoFiltro,
    );
  }

  const tbody = document.querySelector("#tablaLecturasGuardadas tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (lecturasFiltradas.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 9;
    cell.innerText = textoBusqueda
      ? `No hay facturas que coincidan con "${textoBusqueda}"`
      : "No hay facturas registradas";
    cell.style.textAlign = "center";
    return;
  }

  const lecturasOrdenadas = [...lecturasFiltradas].reverse();
  for (let i = 0; i < lecturasOrdenadas.length; i++) {
    const l = lecturasOrdenadas[i];
    const row = tbody.insertRow();
    row.insertCell(0).innerText = l.numeroFactura || "N/A";
    row.insertCell(1).innerText = l.clienteNombre || "N/A";
    row.insertCell(2).innerText = l.lecturaActual + " m3";
    row.insertCell(3).innerText = l.periodo || "N/A";
    row.insertCell(4).innerText = l.fechaLectura;
    row.insertCell(5).innerText = formatMoney(l.totalPagar || 0);
    row.insertCell(6).innerText = l.fechaVencimiento || "N/A";

    let estado = l.estado || "Pendiente";
    let estadoClass = "estado-pendiente";
    if (estado === "Pagada") {
      estadoClass = "estado-aprobado";
    } else if (estado === "En Mora") {
      estado = "En Mora";
    }

    const estadoCell = row.insertCell(7);
    estadoCell.innerText = estado;
    estadoCell.className = estadoClass;

    row.insertCell(8).innerHTML = `
            <button class="btn-primary" style="background:#3b82f6; margin-right:5px; padding:4px 8px;" onclick="window.verFacturaGuardada(${l.id})">Ver</button>
            <button class="btn-danger" onclick="window.eliminarFacturaGuardada(${l.id})">Eliminar</button>
        `;
  }
}

export function limpiarFiltrosFacturas() {
  const busquedaGeneral = document.getElementById("buscarFacturaGeneral");
  const filtroEstado = document.getElementById("filtroEstadoFactura");
  const busquedaCC = document.getElementById("buscarFacturaPorCC");
  if (busquedaGeneral) busquedaGeneral.value = "";
  if (filtroEstado) filtroEstado.value = "";
  if (busquedaCC) busquedaCC.value = "";
  cargarLecturasGuardadas();
}

window.verFacturaGuardada = async function (lecturaId) {
  console.log("Ver factura guardada ID:", lecturaId);
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/facturas/${lecturaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const facturaFull = await res.json();
        const clienteData = {
          nombre: (facturaFull.nombres || '') + ' ' + (facturaFull.apellidos || ''),
          cedula: facturaFull.cedula,
          ubicacion: facturaFull.direccion,
          telefono: facturaFull.telefono,
          ciudad: facturaFull.municipio,
          contador: facturaFull.numero_contador,
          estrato: facturaFull.estrato_numero
        };
        const facturaDisplay = {
          numeroFactura: facturaFull.codigo_factura,
          clienteId: facturaFull.id_cliente,
          clienteNombre: (facturaFull.nombres || '') + ' ' + (facturaFull.apellidos || ''),
          clienteCedula: facturaFull.cedula,
          clienteContador: facturaFull.numero_contador,
          clienteDireccion: facturaFull.direccion,
          clienteCiudad: facturaFull.municipio,
          estrato: facturaFull.estrato_numero,
          periodo: facturaFull.periodo,
          fechaLectura: facturaFull.fecha_lectura,
          fechaEmision: facturaFull.fecha_emision,
          fechaVencimiento: facturaFull.fecha_vencimiento,
          lecturaAnterior: facturaFull.lectura_anterior,
          lecturaActual: facturaFull.lectura_actual,
          consumoM3: facturaFull.consumo_m3,
          tarifaAplicada: facturaFull.tarifa_agua,
          valorAgua: facturaFull.valor_agua,
          valorAlcantarillado: facturaFull.valor_alcantarillado,
          valorAseo: facturaFull.valor_aseo,
          subtotal: facturaFull.subtotal,
          porcentajeSubsidio: facturaFull.porcentaje_subsidio,
          descuentoSubsidio: facturaFull.descuento_subsidio,
          contribucion: facturaFull.contribucion,
          cargoFijo: facturaFull.cargo_fijo,
          moraAnterior: facturaFull.mora_anterior,
          totalPagar: facturaFull.total_pagar,
          estado: facturaFull.estado_nombre || 'Pendiente'
        };
        ocultarTodasSecciones();
        const htmlFactura = generarHTMLFactura(facturaDisplay, clienteData);
        mostrarFacturaEnPantalla(htmlFactura, "resultadoFactura");
        mostrarMensaje(`Mostrando factura de ${clienteData.nombre}`, "exito");
        return;
      }
    } catch {}
  }

  // Fallback to localStorage
  const lecturas = obtenerLecturasGuardadas();
  const lectura = lecturas.find((l) => l.id === lecturaId);
  if (!lectura) {
    mostrarMensaje("No se encontró la factura", "error");
    return;
  }
  const data = getData();
  const cliente = data.clientes.find((c) => c.id === lectura.clienteId);
  if (!cliente) {
    mostrarMensaje("Cliente no encontrado", "error");
    return;
  }
  let factura = data.facturas.find((f) => f.id === lectura.facturaId);
  if (!factura) {
    const tarifaBase = data.config.tarifaPorM3 || 2800;
    const consumoM3 = lectura.lecturaActual;
    const estrato = parseInt(cliente.estrato || 3);
    const valorAgua = consumoM3 * tarifaBase;
    const valorAlcantarillado = valorAgua * 0.45;
    const valorAseo = valorAgua * 0.3;
    const subtotal = valorAgua + valorAlcantarillado + valorAseo;
    let porcentajeSubsidio = 0;
    if (estrato === 1) porcentajeSubsidio = 0.7;
    else if (estrato === 2) porcentajeSubsidio = 0.5;
    else if (estrato === 3) porcentajeSubsidio = 0.15;
    else if (estrato === 4) porcentajeSubsidio = 0;
    else if (estrato === 5) porcentajeSubsidio = -0.2;
    else if (estrato === 6) porcentajeSubsidio = -0.3;
    let descuentoSubsidio = 0;
    let contribucion = 0;
    if (porcentajeSubsidio > 0)
      descuentoSubsidio = subtotal * porcentajeSubsidio;
    else if (porcentajeSubsidio < 0)
      contribucion = subtotal * Math.abs(porcentajeSubsidio);
    const totalPagar = subtotal - descuentoSubsidio + contribucion + 5000;
    factura = {
      numeroFactura: lectura.numeroFactura,
      clienteId: lectura.clienteId,
      clienteNombre: lectura.clienteNombre,
      clienteCedula: lectura.clienteCedula,
      clienteContador: cliente.contador,
      clienteDireccion: cliente.ubicacion,
      clienteCiudad: cliente.ciudad,
      clienteRegion: cliente.region,
      estrato: estrato,
      periodo: lectura.periodo,
      fechaLectura: lectura.fechaLectura,
      fechaEmision:
        lectura.fechaRegistro?.split(",")[0] ||
        new Date().toISOString().split("T")[0],
      fechaVencimiento:
        lectura.fechaVencimiento ||
        new Date(new Date().setDate(new Date().getDate() + 30))
          .toISOString()
          .split("T")[0],
      lecturaAnterior: 0,
      lecturaActual: lectura.lecturaActual,
      consumoM3: consumoM3,
      tarifaAplicada: tarifaBase,
      valorAgua: valorAgua,
      valorAlcantarillado: valorAlcantarillado,
      valorAseo: valorAseo,
      subtotal: subtotal,
      porcentajeSubsidio: porcentajeSubsidio,
      descuentoSubsidio: descuentoSubsidio,
      contribucion: contribucion,
      cargoFijo: 5000,
      moraAnterior: 0,
      totalPagar: totalPagar,
      estado: lectura.estado || "Pendiente",
    };
  }
  ocultarTodasSecciones();
  const htmlFactura = generarHTMLFactura(factura, cliente);
  mostrarFacturaEnPantalla(htmlFactura, "resultadoFactura");
  mostrarMensaje(`Mostrando factura de ${cliente.nombre}`, "exito");
};

window.eliminarFacturaGuardada = function (lecturaId) {
  if (
    !confirm(
      "¿Eliminar esta factura permanentemente? Esta acción será registrada.",
    )
  )
    return;
  let data = getData();
  const lectura = data.lecturasGuardadas.find((l) => l.id === lecturaId);
  if (lectura) {
    data.facturas = data.facturas.filter((f) => f.id !== lectura.facturaId);
    data.lecturasGuardadas = data.lecturasGuardadas.filter(
      (l) => l.id !== lecturaId,
    );
    saveData();
    cargarLecturasGuardadas();
    mostrarMensaje("Factura eliminada", "exito");
  }
};

export async function buscarFacturasPorCC() {
  const ccBuscar = document.getElementById("buscarFacturaPorCC")?.value.trim();
  if (!ccBuscar) {
    mostrarMensaje("Ingrese una cédula o NIT", "error");
    return;
  }
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/facturas/search?termino=${encodeURIComponent(ccBuscar)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const facturas = await res.json();
        const tbody = document.querySelector("#tablaLecturasGuardadas tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (facturas.length === 0) {
          const row = tbody.insertRow();
          const cell = row.insertCell(0);
          cell.colSpan = 9;
          cell.innerText = `No se encontraron facturas para CC: ${ccBuscar}`;
          cell.style.textAlign = "center";
          return;
        }
        const lecturasOrdenadas = facturas.reverse();
        for (const f of lecturasOrdenadas) {
          const row = tbody.insertRow();
          row.insertCell(0).innerText = f.codigo_factura || "N/A";
          const nombre = (f.nombres || '') + ' ' + (f.apellidos || '');
          row.insertCell(1).innerText = nombre.trim() || "N/A";
          row.insertCell(2).innerText = f.lectura_actual + " m3";
          row.insertCell(3).innerText = f.periodo || "N/A";
          row.insertCell(4).innerText = f.fecha_emision || "N/A";
          row.insertCell(5).innerText = formatMoney(f.total_pagar || 0);
          row.insertCell(6).innerText = f.fecha_vencimiento || "N/A";
          let estado = f.estado_nombre || "Pendiente";
          let estadoClass = "estado-pendiente";
          if (estado === "Pagada") { estadoClass = "estado-aprobado"; }
          const estadoCell = row.insertCell(7);
          estadoCell.innerText = estado;
          estadoCell.className = estadoClass;
          row.insertCell(8).innerHTML = `
            <button class="btn-primary" style="background:#3b82f6; margin-right:5px; padding:4px 8px;" onclick="window.verFacturaGuardada(${f.id_factura})">Ver</button>
          `;
        }
        return;
      }
    } catch {}
  }
  const lecturas = obtenerLecturasGuardadas();
  const lecturasFiltradas = lecturas.filter(
    (l) => l.clienteCedula === ccBuscar,
  );
  const tbody = document.querySelector("#tablaLecturasGuardadas tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (lecturasFiltradas.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 9;
    cell.innerText = `No se encontraron facturas para CC: ${ccBuscar}`;
    cell.style.textAlign = "center";
    return;
  }
  const lecturasOrdenadas = [...lecturasFiltradas].reverse();
  for (let i = 0; i < lecturasOrdenadas.length; i++) {
    const l = lecturasOrdenadas[i];
    const row = tbody.insertRow();
    row.insertCell(0).innerText = l.numeroFactura || "N/A";
    row.insertCell(1).innerText = l.clienteNombre || "N/A";
    row.insertCell(2).innerText = l.lecturaActual + " m3";
    row.insertCell(3).innerText = l.periodo || "N/A";
    row.insertCell(4).innerText = l.fechaLectura;
    row.insertCell(5).innerText = formatMoney(l.totalPagar || 0);
    row.insertCell(6).innerText = l.fechaVencimiento || "N/A";
    let estado = l.estado || "Pendiente";
    let estadoClass = "estado-pendiente";
    if (estado === "Pagada") { estadoClass = "estado-aprobado"; }
    const estadoCell = row.insertCell(7);
    estadoCell.innerText = estado;
    estadoCell.className = estadoClass;
    row.insertCell(8).innerHTML = `
      <button class="btn-primary" style="background:#3b82f6; margin-right:5px; padding:4px 8px;" onclick="window.verFacturaGuardada(${l.id})">Ver</button>
      <button class="btn-danger" onclick="window.eliminarFacturaGuardada(${l.id})">Eliminar</button>
    `;
  }
}

export async function cargarAnticiposRecaudos(filtro = "") {
  console.log("Cargando anticipos y recaudos, filtro:", filtro);
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/pagos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        let pagos = await res.json();
        if (filtro && filtro.trim() !== "") {
          const filtroLower = filtro.toLowerCase().trim();
          pagos = pagos.filter(
            (r) => (r.nombres || '').toLowerCase().includes(filtroLower) ||
                   (r.apellidos || '').toLowerCase().includes(filtroLower)
          );
        }
        const tbody = document.querySelector("#tablaAnticiposRecaudos tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (pagos.length === 0) {
          const row = tbody.insertRow();
          const cell = row.insertCell(0);
          cell.colSpan = 6;
          cell.innerText = filtro
            ? `No se encontraron recaudos para "${filtro}"`
            : "No hay recaudos registrados";
          cell.style.textAlign = "center";
          return;
        }
        pagos.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));
        for (const r of pagos) {
          const row = tbody.insertRow();
          const nombre = (r.nombres || '') + ' ' + (r.apellidos || '');
          row.insertCell(0).innerText = nombre.trim() || "N/A";
          row.insertCell(1).innerText = formatMoney(r.valor);
          row.insertCell(2).innerText = r.fecha_pago;
          row.insertCell(3).innerText = r.medio_pago_nombre || "Pago";
          row.insertCell(4).innerText = r.codigo_factura || "-";
          let estado = "Normal";
          let estadoClass = "";
          const estadoCell = row.insertCell(5);
          estadoCell.innerText = estado;
          if (estadoClass) estadoCell.className = estadoClass;
        }
        return;
      }
    } catch {}
  }
  const data = getData();
  const tbody = document.querySelector("#tablaAnticiposRecaudos tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  let recaudos = [...data.recaudos];
  if (filtro && filtro.trim() !== "") {
    const filtroLower = filtro.toLowerCase().trim();
    recaudos = recaudos.filter(
      (r) => r.cliente && r.cliente.toLowerCase().includes(filtroLower),
    );
  }
  if (recaudos.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 6;
    cell.innerText = filtro
      ? `No se encontraron recaudos para "${filtro}"`
      : "No hay recaudos registrados";
    cell.style.textAlign = "center";
    return;
  }
  recaudos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  for (let i = 0; i < recaudos.length; i++) {
    const r = recaudos[i];
    const row = tbody.insertRow();
    row.insertCell(0).innerText = r.cliente || "N/A";
    row.insertCell(1).innerText = formatMoney(r.monto);
    row.insertCell(2).innerText = r.fecha;
    row.insertCell(3).innerText = r.tipo || "Pago";
    row.insertCell(4).innerText = r.facturaReferencia || "-";
    let estado = "Normal";
    let estadoClass = "";
    if (r.tipo === "Pago manual") {
      estado = "Pago Manual";
      estadoClass = "estado-pendiente";
    } else if (r.tipo?.includes("Pago online")) {
      estado = "Pago Online";
      estadoClass = "estado-aprobado";
    }
    const estadoCell = row.insertCell(5);
    estadoCell.innerText = estado;
    if (estadoClass) estadoCell.className = estadoClass;
  }
}

// ========== RUTAS ==========
async function cargarClientesEnSelectMapaV() {
  const token = getToken();
  let clientes = [];
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) clientes = await res.json();
    } catch {}
  }
  if (clientes.length === 0) {
    const data = getData();
    clientes = data.clientes.map(c => ({
      id_cliente: c.id,
      nombres: c.nombre,
      municipio: c.ciudad
    }));
  }
  const select = document.getElementById("selectClienteMapaV");
  if (!select) return;
  select.innerHTML = '<option value="">Seleccione un cliente</option>';
  for (let i = 0; i < clientes.length; i++) {
    const option = document.createElement("option");
    option.value = clientes[i].id_cliente;
    const nombre = (clientes[i].nombres || '') + ' ' + (clientes[i].apellidos || '');
    option.textContent = `${nombre.trim() || 'Cliente'} - ${clientes[i].municipio || "Sin ciudad"}`;
    select.appendChild(option);
  }
}

export function buscarClienteEnMapaV() {
  const clienteId = document.getElementById("selectClienteMapaV")?.value;
  if (!clienteId) {
    mostrarMensaje("Seleccione un cliente", "error");
    return;
  }
  const data = getData();
  const cliente = data.clientes.find((c) => c.id === parseInt(clienteId));
  if (!cliente || !cliente.ciudad) {
    mostrarMensaje("Cliente sin ciudad asignada", "error");
    return;
  }
  const coords = {
    Bogota: [4.711, -74.0721],
    Medellin: [6.2442, -75.5812],
    Cali: [3.4516, -76.532],
  }[cliente.ciudad];
  if (!coords) {
    mostrarMensaje(`No hay coordenadas para ${cliente.ciudad}`, "error");
    return;
  }
  if (currentMapV) {
    currentMapV.setView(coords, 13);
    for (let i = 0; i < currentMarkersV.length; i++) {
      currentMapV.removeLayer(currentMarkersV[i]);
    }
    currentMarkersV = [];
    const marker = L.marker(coords).addTo(currentMapV);
    marker
      .bindPopup(
        `<b>${cliente.nombre}</b><br>Ciudad: ${cliente.ciudad}<br>Contador: ${cliente.contador}`,
      )
      .openPopup();
    currentMarkersV.push(marker);
    mostrarMensaje(`Cliente ubicado: ${cliente.nombre}`, "exito");
  }
}

function initMapV() {
  console.log("Inicializando mapa de rutas...");
  const mapDiv = document.getElementById("mapaRutasV");
  if (!mapDiv) {
    console.error("No se encontró el contenedor #mapaRutasV");
    return;
  }
  if (mapDiv._leaflet_id) {
    console.log("El mapa ya está inicializado");
    return;
  }
  try {
    currentMapV = L.map("mapaRutasV").setView([4.711, -74.0721], 11);
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "Map data OpenStreetMap",
      },
    ).addTo(currentMapV);
    const data = getData();
    const coordsMap = {
      Bogota: [4.711, -74.0721],
      Medellin: [6.2442, -75.5812],
      Cali: [3.4516, -76.532],
    };
    let marcadoresAgregados = 0;
    for (let i = 0; i < data.clientes.length; i++) {
      const c = data.clientes[i];
      if (c.ciudad && coordsMap[c.ciudad]) {
        const marker = L.marker(coordsMap[c.ciudad]).addTo(currentMapV);
        marker.bindPopup(
          `<b>${c.nombre}</b><br>Ciudad: ${c.ciudad}<br>Contador: ${c.contador}`,
        );
        currentMarkersV.push(marker);
        marcadoresAgregados++;
      }
    }
    console.log(`Mapa inicializado con ${marcadoresAgregados} marcadores`);
    if (marcadoresAgregados === 0) {
      L.popup()
        .setLatLng([4.711, -74.0721])
        .setContent("No hay clientes con ubicación registrada")
        .openOn(currentMapV);
    }
  } catch (error) {
    console.error("Error al inicializar el mapa:", error);
    mostrarMensaje("Error al cargar el mapa", "error");
  }
}
