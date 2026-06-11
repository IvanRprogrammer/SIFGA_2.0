// ============================================================================
// rutas.js - MAPAS Y GEOLOCALIZACIÓN
// Manejo de mapas, ubicación de clientes, rutas de facturación
// ============================================================================

import { getData } from "./data.js";
import { mostrarMensaje } from "./utils.js";

// Coordenadas por ciudad (Colombia)
const COORDENADAS_CIUDADES = {
  Bogota: [4.711, -74.0721],
  Medellin: [6.2442, -75.5812],
  Cali: [3.4516, -76.532],
  Barranquilla: [10.9639, -74.7964],
  Cartagena: [10.391, -75.4794],
  Bucaramanga: [7.1193, -73.1227],
  Pereira: [4.8087, -75.6906],
  "Santa Marta": [11.2408, -74.199],
  Manizales: [5.0675, -75.5207],
  Villavicencio: [4.1427, -73.6267],
};

// Configuración del mapa
export function configurarMapa(
  contenedorId,
  centro = [4.711, -74.0721],
  zoom = 11,
) {
  const mapDiv = document.getElementById(contenedorId);
  if (!mapDiv) return null;

  // Si ya tiene mapa, no crear otro
  if (mapDiv._leaflet_id) return null;

  const map = L.map(contenedorId).setView(centro, zoom);
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  ).addTo(map);

  return map;
}

// Añadir marcador de cliente
export function añadirMarcadorCliente(map, cliente, popupContent = null) {
  if (!map || !cliente || !cliente.ciudad) return null;

  const coords = COORDENADAS_CIUDADES[cliente.ciudad];
  if (!coords) return null;

  const contenido =
    popupContent ||
    `
        <b>${cliente.nombre}</b><br>
        Ciudad: ${cliente.ciudad}<br>
        Contador: ${cliente.contador}<br>
        Dirección: ${cliente.ubicacion || "No registrada"}
    `;

  const marker = L.marker(coords).addTo(map);
  marker.bindPopup(contenido);

  return marker;
}

// Añadir marcador de ruta
export function añadirMarcadorRuta(map, nombre, coordenadas, descripcion = "") {
  if (!map || !coordenadas) return null;

  const marker = L.marker(coordenadas).addTo(map);
  marker.bindPopup(`
        <b>${nombre}</b><br>
        ${descripcion}
    `);

  return marker;
}

// Dibujar ruta entre puntos
export function dibujarRuta(map, puntos, color = "#2dd4bf") {
  if (!map || !puntos || puntos.length < 2) return null;

  const polyline = L.polyline(puntos, {
    color: color,
    weight: 4,
    opacity: 0.7,
  }).addTo(map);
  map.fitBounds(polyline.getBounds());

  return polyline;
}

// Centrar mapa en cliente
export function centrarMapaEnCliente(map, clienteId) {
  const data = getData();
  const cliente = data.clientes.find((c) => c.id === clienteId);

  if (!map || !cliente || !cliente.ciudad) {
    mostrarMensaje("No se pudo ubicar al cliente", "error");
    return false;
  }

  const coords = COORDENADAS_CIUDADES[cliente.ciudad];
  if (!coords) {
    mostrarMensaje(`No hay coordenadas para ${cliente.ciudad}`, "error");
    return false;
  }

  map.setView(coords, 13);

  // Añadir marcador destacado
  const marker = L.marker(coords).addTo(map);
  marker
    .bindPopup(
      `
        <b>${cliente.nombre}</b><br>
        Ciudad: ${cliente.ciudad}<br>
        Contador: ${cliente.contador}<br>
        Dirección: ${cliente.ubicacion || "No registrada"}
    `,
    )
    .openPopup();

  return true;
}

// Obtener coordenadas de una ciudad
export function obtenerCoordenadasCiudad(ciudad) {
  return COORDENADAS_CIUDADES[ciudad] || null;
}

// Obtener todas las ciudades disponibles
export function obtenerCiudadesDisponibles() {
  return Object.keys(COORDENADAS_CIUDADES);
}

// Generar rutas de facturación (agrupar clientes por ciudad)
export function generarRutasFacturacion() {
  const data = getData();
  const clientes = data.clientes;
  const rutas = {};

  for (let i = 0; i < clientes.length; i++) {
    const c = clientes[i];
    if (c.ciudad) {
      if (!rutas[c.ciudad]) {
        rutas[c.ciudad] = {
          ciudad: c.ciudad,
          clientes: [],
          coordenadas: COORDENADAS_CIUDADES[c.ciudad],
          totalClientes: 0,
          totalDeuda: 0,
        };
      }
      rutas[c.ciudad].clientes.push(c);
      rutas[c.ciudad].totalClientes++;
      rutas[c.ciudad].totalDeuda += c.deuda || 0;
    }
  }

  return Object.values(rutas);
}

// Buscar cliente por ubicación (ciudad)
export function buscarClientesPorCiudad(ciudad) {
  const data = getData();
  return data.clientes.filter((c) => c.ciudad === ciudad);
}

// Limpiar todos los marcadores del mapa
export function limpiarMarcadores(map, markers) {
  if (!map) return;

  for (let i = 0; i < markers.length; i++) {
    map.removeLayer(markers[i]);
  }
  return [];
}
