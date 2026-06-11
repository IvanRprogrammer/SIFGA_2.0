import { loadData, getData } from './data.js';
import { toggleMobileMenu, getUsuarioLogueado, logout } from './utils.js';

window.toggleMobileMenu = toggleMobileMenu;
window.logout = logout;

async function inicializarPorRol() {
  const usuario = getUsuarioLogueado();
  const currentPage = window.location.pathname;

  if (!usuario && !currentPage.includes('index.html')) {
    window.location.href = 'index.html';
    return;
  }

  if (currentPage.includes('administrador.html')) {
    const module = await import('./roles/admin.js');
    window.showSection = module.showSection;
    window.toggleSubmenu = module.toggleSubmenu;
    window.crearNuevoUsuario = module.crearNuevoUsuario;
    window.guardarConfiguracion = module.guardarConfiguracion;
    window.guardarTarifaPorCliente = module.guardarTarifaPorCliente;
    window.limpiarPropuestasAprobadas = module.limpiarPropuestasAprobadas;
    window.otorgarPermiso = module.otorgarPermiso;
    window.filtrarRecaudosPorMunicipio = module.filtrarRecaudosPorMunicipio;
    window.generarReporte = module.generarReporte;
    window.buscarClienteEnMapa = module.buscarClienteEnMapa;
    module.inicializarAdmin();
  } else if (currentPage.includes('vendedor.html')) {
    const module = await import('./roles/vendedor.js');
    window.showSection = module.showSection;
    window.cargarLecturasGuardadas = module.cargarLecturasGuardadas;
    window.buscarFacturasPorCC = module.buscarFacturasPorCC;
    window.generarFactura = module.generarFactura;
    window.enviarPropuesta = module.enviarPropuesta;
    window.guardarModificacionCliente = module.guardarModificacionCliente;
    window.cancelarModificacion = module.cancelarModificacion;
    window.buscarClienteEnMapaV = module.buscarClienteEnMapaV;
    module.inicializarVendedor();
  } else if (currentPage.includes('cliente.html')) {
    const module = await import('./roles/cliente.js');
    window.showSection = module.showSection;
    window.pagarFactura = module.pagarFactura;
    module.inicializarCliente();
  }

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) toggleMobileMenu();
    });
  });
}

function mostrarNombreUsuario() {
  const usuario = getUsuarioLogueado();
  const nameSpan = document.getElementById('userNameDisplay');
  if (usuario && nameSpan) nameSpan.innerHTML = usuario.nombre;
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  inicializarPorRol();
  mostrarNombreUsuario();
});
