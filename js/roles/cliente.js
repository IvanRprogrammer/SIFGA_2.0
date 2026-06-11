import { getData, saveData } from "../data.js";
import {
  mostrarMensaje,
  formatMoney,
  getUsuarioLogueado,
  logout,
  toggleMobileMenu,
} from "../utils.js";

window.logout = logout;
window.toggleMobileMenu = toggleMobileMenu;

let clienteActual = null;

function getToken() {
  return sessionStorage.getItem('sifga_token');
}

function apiBase() {
  return 'http://localhost:3000/api';
}

async function getClienteFromAPI() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${apiBase()}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const profile = await res.json();
    if (!profile.id_cliente) return null;
    const cliRes = await fetch(`${apiBase()}/clientes/${profile.id_cliente}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!cliRes.ok) return null;
    return await cliRes.json();
  } catch {
    return null;
  }
}

async function getCliente() {
  if (clienteActual) return clienteActual;
  const apiClient = await getClienteFromAPI();
  if (apiClient) {
    clienteActual = apiClient;
    return clienteActual;
  }
  const data = getData();
  const usuario = getUsuarioLogueado();
  if (usuario && usuario.clienteId) {
    clienteActual = data.clientes.find((c) => c.id === usuario.clienteId);
  }
  return clienteActual;
}

function ocultarTodasSecciones() {
  const sections = ["dashboard", "facturas", "pagar", "historial", "anticipos"];
  for (let i = 0; i < sections.length; i++) {
    const el = document.getElementById(sections[i]);
    if (el) el.style.display = "none";
  }
}

export function inicializarCliente() {
  console.log("Inicializando panel de cliente...");
  loadDashboardCliente();
  const dashboardDiv = document.getElementById("dashboard");
  if (dashboardDiv) dashboardDiv.style.display = "block";
}

export function showSection(section) {
  console.log("showSection cliente:", section);
  ocultarTodasSecciones();
  const selected = document.getElementById(section);
  if (selected) selected.style.display = "block";
  const titles = {
    dashboard: "Mi Cuenta",
    facturas: "Mis Facturas",
    pagar: "Pagar Factura",
    historial: "Historial de Consumo",
    anticipos: "Anticipos y Recaudos",
  };
  const titleEl = document.getElementById("sectionTitle");
  if (titleEl) titleEl.innerText = titles[section] || section;
  if (section === "dashboard") {
    loadDashboardCliente();
  } else if (section === "facturas") {
    loadFacturasCliente();
  } else if (section === "pagar") {
    loadFacturasPagar();
  } else if (section === "historial") {
    loadHistorialCliente();
  } else if (section === "anticipos") {
    loadAnticiposCliente();
  }
}

async function loadDashboardCliente() {
  const cliente = await getCliente();
  if (!cliente) {
    console.log("No se encontró cliente");
    return;
  }

  // Get invoice data from API or fallback
  let facturasPendientes = [];
  let deudaTotal = 0;
  const token = getToken();
  const clienteId = cliente.id_cliente || cliente.id;

  if (token) {
    try {
      const res = await fetch(`${apiBase()}/facturas?id_cliente=${clienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const facturas = await res.json();
        facturasPendientes = facturas.filter(f => f.id_estado === 1 || f.estado_nombre === 'Pendiente');
        deudaTotal = facturasPendientes.reduce((sum, f) => sum + (f.total_pagar || 0), 0);
      }
    } catch {}
  }

  if (facturasPendientes.length === 0) {
    const data = getData();
    facturasPendientes = data.facturas.filter(
      (f) => f.clienteId === clienteId && f.estado === "Pendiente",
    );
    deudaTotal = facturasPendientes.reduce((sum, f) => sum + (f.totalPagar || 0), 0);
  }

  const estadoClienteEl = document.getElementById("estadoCliente");
  const deudaClienteEl = document.getElementById("deudaCliente");
  if (estadoClienteEl)
    estadoClienteEl.innerHTML = deudaTotal > 0 ? "En Mora" : "Al Día";
  if (deudaClienteEl) deudaClienteEl.innerText = formatMoney(deudaTotal);

  const tbody = document.querySelector("#tablaInfoCliente tbody");
  if (tbody) {
    tbody.innerHTML = "";
    const nombre = (cliente.nombres || cliente.nombre || '') + ' ' + (cliente.apellidos || '');
    const cedula = cliente.cedula || 'N/A';
    const direccion = cliente.direccion || cliente.ubicacion || 'N/A';
    const ciudad = cliente.municipio || cliente.ciudad || 'N/A';
    const region = cliente.region || 'N/A';
    const contador = cliente.numero_contador || cliente.contador || 'N/A';
    const email = cliente.correo || cliente.email || 'N/A';
    const telefono = cliente.telefono || 'N/A';
    const row1 = tbody.insertRow();
    row1.insertCell(0).innerHTML = "<strong>Nombre:</strong>";
    row1.insertCell(1).innerText = nombre.trim() || "N/A";
    const row2 = tbody.insertRow();
    row2.insertCell(0).innerHTML = "<strong>CC/NIT:</strong>";
    row2.insertCell(1).innerText = cedula;
    const row3 = tbody.insertRow();
    row3.insertCell(0).innerHTML = "<strong>Dirección:</strong>";
    row3.insertCell(1).innerText = direccion;
    const row4 = tbody.insertRow();
    row4.insertCell(0).innerHTML = "<strong>Ciudad/Región:</strong>";
    row4.insertCell(1).innerText = `${ciudad} / ${region}`;
    const row5 = tbody.insertRow();
    row5.insertCell(0).innerHTML = "<strong>Contador:</strong>";
    row5.insertCell(1).innerText = contador;
    const row6 = tbody.insertRow();
    row6.insertCell(0).innerHTML = "<strong>Email:</strong>";
    row6.insertCell(1).innerText = email;
    const row7 = tbody.insertRow();
    row7.insertCell(0).innerHTML = "<strong>Teléfono:</strong>";
    row7.insertCell(1).innerText = telefono;
  }
}

async function loadFacturasCliente() {
  const cliente = await getCliente();
  if (!cliente) return;
  const clienteId = cliente.id_cliente || cliente.id;
  let misFacturas = [];
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/facturas?id_cliente=${clienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        misFacturas = await res.json();
      }
    } catch {}
  }
  if (misFacturas.length === 0) {
    const data = getData();
    misFacturas = data.facturas
      .filter((f) => f.clienteId === clienteId)
      .map(f => ({
        codigo_factura: f.numeroFactura,
        periodo: f.periodo,
        total_pagar: f.totalPagar,
        fecha_vencimiento: f.fechaVencimiento,
        estado_nombre: f.estado
      }));
  }
  misFacturas.sort((a, b) => new Date(b.fecha_emision || b.fechaEmision) - new Date(a.fecha_emision || a.fechaEmision));
  const tbody = document.querySelector("#tablaFacturas tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (misFacturas.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 5;
    cell.innerText = "No tienes facturas registradas";
    cell.style.textAlign = "center";
    return;
  }
  for (const f of misFacturas) {
    const row = tbody.insertRow();
    row.insertCell(0).innerText = f.codigo_factura || f.numeroFactura || "N/A";
    row.insertCell(1).innerText = f.periodo || "N/A";
    row.insertCell(2).innerText = formatMoney(f.total_pagar || f.totalPagar || 0);
    row.insertCell(3).innerText = f.fecha_vencimiento || f.fechaVencimiento || "N/A";
    let estado = f.estado_nombre || f.estado || "Pendiente";
    let estadoClass = "estado-pendiente";
    if (estado === "Pagada") {
      estadoClass = "estado-aprobado";
    } else if (estado === "En Mora") {
      estado = "En Mora";
    }
    const estadoCell = row.insertCell(4);
    estadoCell.innerText = estado;
    estadoCell.className = estadoClass;
  }
}

async function loadFacturasPagar() {
  const cliente = await getCliente();
  if (!cliente) return;
  const clienteId = cliente.id_cliente || cliente.id;
  let facturasPendientes = [];
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/facturas?id_cliente=${clienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const facturas = await res.json();
        facturasPendientes = facturas.filter(f => f.id_estado === 1 || f.estado_nombre === 'Pendiente' || f.estado_nombre === 'En Mora');
      }
    } catch {}
  }
  if (facturasPendientes.length === 0) {
    const data = getData();
    facturasPendientes = data.facturas.filter(
      (f) => f.clienteId === clienteId && (f.estado === "Pendiente" || f.estado === "En Mora"),
    );
  }
  const select = document.getElementById("selectFacturaPagar");
  if (!select) return;
  select.innerHTML =
    '<option value="">Seleccione una factura pendiente</option>';
  for (const f of facturasPendientes) {
    const option = document.createElement("option");
    const facturaNumero = f.codigo_factura || f.numeroFactura;
    option.value = facturaNumero;
    option.dataset.id = f.id_factura || f.id;
    option.dataset.total = f.total_pagar || f.totalPagar || 0;
    option.textContent = `${facturaNumero} - ${formatMoney(f.total_pagar || f.totalPagar || 0)} - Vence: ${f.fecha_vencimiento || f.fechaVencimiento || "N/A"}`;
    select.appendChild(option);
  }
}

export async function pagarFactura() {
  const select = document.getElementById("selectFacturaPagar");
  const selectedOption = select?.options[select.selectedIndex];
  const numeroFactura = select?.value;
  const idFactura = selectedOption?.dataset?.id;
  const totalPagar = parseFloat(selectedOption?.dataset?.total || 0);
  const metodoPago = document.getElementById("metodoPagoCliente")?.value;
  const metodoTexto = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia" }[metodoPago] || "Desconocido";

  if (!numeroFactura) {
    mostrarMensaje("Seleccione una factura para pagar", "error");
    return;
  }

  const token = getToken();
  if (token && idFactura) {
    try {
      const mediosRes = await fetch(`${apiBase()}/pagos/medios-pago`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mediosRes.ok) {
        const medios = await mediosRes.json();
        const medioMap = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' };
        const medio = medios.find(m => m.nombre === medioMap[metodoPago]);
        const idMedioPago = medio ? medio.id_medio_pago : 1;
        const payRes = await fetch(`${apiBase()}/pagos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id_factura: parseInt(idFactura),
            id_medio_pago: idMedioPago,
            valor: totalPagar,
            referencia: `Pago ${numeroFactura}`
          }),
        });
        if (payRes.ok) {
          const resultadoDiv = document.getElementById("resultadoPago");
          if (resultadoDiv) {
            resultadoDiv.innerHTML = `Pago de ${formatMoney(totalPagar)} realizado exitosamente<br>Método: ${metodoTexto}<br>Factura: ${numeroFactura}`;
            resultadoDiv.style.display = "block";
            setTimeout(() => { resultadoDiv.style.display = "none"; }, 5000);
          }
          mostrarMensaje(`Pago de ${formatMoney(totalPagar)} realizado`, "exito");
          clienteActual = null;
          loadDashboardCliente();
          loadFacturasCliente();
          loadFacturasPagar();
          loadAnticiposCliente();
          return;
        }
      }
    } catch {}
  }

  // Fallback to localStorage
  let data = getData();
  const cliente = await getCliente();
  const factura = data.facturas.find((f) => f.numeroFactura === numeroFactura);
  if (factura && (factura.estado === "Pendiente" || factura.estado === "En Mora")) {
    factura.estado = "Pagada";
    const nuevoRecaudo = {
      id: data.recaudos.length + 5001,
      cliente: (cliente.nombres || cliente.nombre || ''),
      clienteId: cliente.id_cliente || cliente.id,
      monto: factura.totalPagar,
      fecha: new Date().toISOString().split("T")[0],
      tipo: `Pago online - ${metodoTexto}`,
      municipio: cliente.municipio || cliente.ciudad || "No especificado",
      facturaReferencia: numeroFactura,
    };
    data.recaudos.push(nuevoRecaudo);
    if (cliente) {
      const deudaField = cliente.deuda_actual !== undefined ? 'deuda_actual' : 'deuda';
      cliente[deudaField] = Math.max(0, (cliente[deudaField] || 0) - factura.totalPagar);
    }
    saveData();
    const resultadoDiv = document.getElementById("resultadoPago");
    if (resultadoDiv) {
      resultadoDiv.innerHTML = `Pago de ${formatMoney(factura.totalPagar)} realizado exitosamente<br>Método: ${metodoTexto}<br>Factura: ${numeroFactura}`;
      resultadoDiv.style.display = "block";
      setTimeout(() => { resultadoDiv.style.display = "none"; }, 5000);
    }
    mostrarMensaje(`Pago de ${formatMoney(factura.totalPagar)} realizado`, "exito");
    clienteActual = null;
    loadDashboardCliente();
    loadFacturasCliente();
    loadFacturasPagar();
    loadAnticiposCliente();
  } else {
    mostrarMensaje("No se pudo procesar el pago", "error");
  }
}

async function loadHistorialCliente() {
  const cliente = await getCliente();
  if (!cliente) return;
  const clienteId = cliente.id_cliente || cliente.id;
  let misFacturas = [];
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/lecturas/cliente/${clienteId}/historial`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        misFacturas = await res.json();
        const tbody = document.querySelector("#tablaHistorial tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (misFacturas.length === 0) {
          const row = tbody.insertRow();
          const cell = row.insertCell(0);
          cell.colSpan = 4;
          cell.innerText = "No hay historial de consumo registrado";
          cell.style.textAlign = "center";
          return;
        }
        for (const f of misFacturas) {
          const row = tbody.insertRow();
          row.insertCell(0).innerText = f.fecha_lectura || "N/A";
          row.insertCell(1).innerText = (f.lectura_actual || 0) + " m3";
          row.insertCell(2).innerText = (f.consumo_m3 || 0) + " m3";
          const total = f.total_pagar || 0;
          row.insertCell(3).innerText =
            f.estado_factura === "Pagada" ? formatMoney(total) : (f.estado_factura || "Pendiente");
        }
        return;
      }
    } catch {}
  }
  const data = getData();
  misFacturas = data.facturas
    .filter((f) => f.clienteId === clienteId)
    .sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision));
  const tbody = document.querySelector("#tablaHistorial tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (misFacturas.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 4;
    cell.innerText = "No hay historial de consumo registrado";
    cell.style.textAlign = "center";
    return;
  }
  for (const f of misFacturas) {
    const row = tbody.insertRow();
    row.insertCell(0).innerText = f.periodo || "N/A";
    row.insertCell(1).innerText = (f.lecturaActual || 0) + " m3";
    row.insertCell(2).innerText = (f.consumoM3 || 0) + " m3";
    row.insertCell(3).innerText =
      f.estado === "Pagada" ? formatMoney(f.totalPagar) : "Pendiente";
  }
}

async function loadAnticiposCliente() {
  const cliente = await getCliente();
  if (!cliente) return;
  const clienteId = cliente.id_cliente || cliente.id;
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${apiBase()}/pagos?id_cliente=${clienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        let pagos = await res.json();
        pagos.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));
        const tbody = document.querySelector("#tablaAnticiposCliente tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (pagos.length === 0) {
          const row = tbody.insertRow();
          const cell = row.insertCell(0);
          cell.colSpan = 4;
          cell.innerText = "No hay registro de anticipos o recaudos";
          cell.style.textAlign = "center";
          return;
        }
        for (const r of pagos) {
          const row = tbody.insertRow();
          row.insertCell(0).innerText = r.fecha_pago;
          row.insertCell(1).innerText = r.medio_pago_nombre || "Pago";
          row.insertCell(2).innerText = formatMoney(r.valor);
          row.insertCell(3).innerText = r.codigo_factura || "-";
        }
        return;
      }
    } catch {}
  }
  const data = getData();
  const misRecaudos = data.recaudos.filter(
    (r) => r.clienteId === clienteId || r.cliente === (cliente.nombres || cliente.nombre || ''),
  );
  const tbody = document.querySelector("#tablaAnticiposCliente tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (misRecaudos.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 4;
    cell.innerText = "No hay registro de anticipos o recaudos";
    cell.style.textAlign = "center";
    return;
  }
  misRecaudos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  for (const r of misRecaudos) {
    const row = tbody.insertRow();
    row.insertCell(0).innerText = r.fecha;
    row.insertCell(1).innerText = r.tipo || "Pago";
    row.insertCell(2).innerText = formatMoney(r.monto);
    row.insertCell(3).innerText = r.facturaReferencia || "-";
  }
}
