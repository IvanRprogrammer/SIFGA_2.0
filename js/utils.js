// ============================================================================
// utils.js - FUNCIONES REUTILIZABLES
// ============================================================================

import { getData, saveData } from "./data.js";

export function formatMoney(amount) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function mostrarMensaje(mensaje, tipo = "exito") {
  const mensajeDiv = document.createElement("div");
  mensajeDiv.style.cssText =
    "position:fixed; top:20px; right:20px; z-index:9999; padding:12px 20px; border-radius:8px; font-weight:bold; background:#d1fae5; color:#065f46; border-left:4px solid #10b981; box-shadow:0 2px 10px rgba(0,0,0,0.1);";
  if (tipo === "error") {
    mensajeDiv.style.background = "#fee2e2";
    mensajeDiv.style.color = "#991b1b";
    mensajeDiv.style.borderLeftColor = "#ef4444";
  }
  mensajeDiv.innerHTML = mensaje;
  document.body.appendChild(mensajeDiv);
  setTimeout(() => {
    mensajeDiv.remove();
  }, 4000);
}

export function logout() {
  // CAMBIADO: localStorage -> sessionStorage
  sessionStorage.removeItem("sifga_user");
  sessionStorage.removeItem("sifga_role");
  sessionStorage.removeItem("sifga_userName");
  sessionStorage.removeItem("sifga_userId");
  window.location.href = "index.html";
}

export function getUsuarioLogueado() {
  // CAMBIADO: localStorage -> sessionStorage
  const userEmail = sessionStorage.getItem("sifga_user");
  if (!userEmail) return null;
  const data = getData();
  return data.usuariosSistema.find((u) => u.email === userEmail);
}

export function toggleMobileMenu() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  if (sidebar && overlay) {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
  }
}

export function generarNumeroFactura() {
  const anio = new Date().getFullYear();
  const data = getData();
  let maxConsecutivo = data.ultimoConsecutivoFactura || 0;

  const facturasExistentes = data.facturas.filter(
    (f) => f.numeroFactura && f.numeroFactura.includes(anio.toString()),
  );
  for (let i = 0; i < facturasExistentes.length; i++) {
    const partes = facturasExistentes[i].numeroFactura.split("-");
    if (partes.length === 3) {
      const consecutivo = parseInt(partes[2]);
      if (consecutivo > maxConsecutivo) maxConsecutivo = consecutivo;
    }
  }

  const nuevoConsecutivo = maxConsecutivo + 1;
  data.ultimoConsecutivoFactura = nuevoConsecutivo;
  saveData();

  return `FAC-${anio}-${String(nuevoConsecutivo).padStart(4, "0")}`;
}
