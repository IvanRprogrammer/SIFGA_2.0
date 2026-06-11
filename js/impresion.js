// ============================================================================
// impresion.js - MÓDULO DE IMPRESIÓN DE FACTURAS
// Versión profesional con QR, colores institucionales y formato de servicios públicos
// Paleta: Azul principal (#0f2b3d), Azul hover (#1a4a6f), Teal (#2dd4bf)
// ============================================================================

import { formatMoney } from "./utils.js";

// Datos de la empresa (configurables por el Administrador)
export const EMPRESA = {
  nombre: "AGUAS DE COLOMBIA S.A. E.S.P.",
  nit: "900.123.456-7",
  telefono: "(601) 123 4567",
  direccion: "Calle 100 # 8-55, Bogotá D.C.",
  lineaAtencion: "116",
  paginaWeb: "www.aguasdecolombia.com",
};

// Generar número de referencia de pago
function generarReferenciaPago() {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  const aleatorio = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${anio}${mes}${dia}${aleatorio}`;
}

// Generar código de barras visual
function generarCodigoBarras(numero) {
  const digitos = String(numero).replace(/[^0-9]/g, "");
  let barras = "";
  for (let i = 0; i < Math.min(50, digitos.length * 2); i++) {
    barras += "|";
  }
  return barras;
}

// Generar HTML de la factura profesional con QR
export function generarHTMLFactura(factura, cliente) {
  const fechaEmision =
    factura.fechaEmision || new Date().toISOString().split("T")[0];
  const referenciaPago = generarReferenciaPago();
  const codigoBarras = generarCodigoBarras(
    factura.numeroFactura + cliente.cedula,
  );
  const fechaVencimiento =
    factura.fechaVencimiento ||
    new Date(new Date().setDate(new Date().getDate() + 30))
      .toISOString()
      .split("T")[0];

  // Generar código QR con los datos de la factura
  const qrData = `FACTURA:${factura.numeroFactura}|CC:${cliente.cedula}|VALOR:${factura.totalPagar}|REF:${referenciaPago}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;

  const fechaLecturaFormateada = factura.fechaLectura
    ? new Date(factura.fechaLectura).toLocaleDateString("es-CO")
    : "No registrada";

  let porcentajeTexto = "";
  if (factura.porcentajeSubsidio > 0) {
    porcentajeTexto = `${Math.round(factura.porcentajeSubsidio * 100)}% subsidio`;
  } else if (factura.porcentajeSubsidio < 0) {
    porcentajeTexto = `${Math.round(Math.abs(factura.porcentajeSubsidio) * 100)}% contribución`;
  } else {
    porcentajeTexto = "Sin subsidio";
  }

  const claseUso =
    cliente.estrato && parseInt(cliente.estrato) <= 4
      ? "Residencial"
      : "Comercial";

  let html = `
    <div class="factura-container" id="facturaParaImprimir" style="font-family: 'Arial', 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header con gradiente azul -->
        <div style="background: linear-gradient(135deg, #0f2b3d 0%, #1a4a6f 100%); padding: 20px; color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="font-size: 36px;">💧</div>
                    <div>
                        <h2 style="margin: 0; font-size: 18px;">${EMPRESA.nombre}</h2>
                        <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.9;">Nit: ${EMPRESA.nit} | Tel: ${EMPRESA.telefono}</p>
                        <p style="margin: 2px 0 0 0; font-size: 10px; opacity: 0.8;">${EMPRESA.direccion}</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="background: white; padding: 5px 12px; border-radius: 20px; display: inline-block;">
                        <img src="${qrUrl}" alt="Código QR" width="70" height="70" style="border-radius: 8px;">
                    </div>
                    <p style="font-size: 8px; margin-top: 5px; opacity: 0.8;">Escanea para pagar</p>
                </div>
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <h1 style="margin: 0; font-size: 22px; letter-spacing: 2px;">RECIBO DE AGUA</h1>
                <p style="margin: 5px 0 0 0; font-size: 10px; opacity: 0.8;">Sistema Integrado de Facturación y Gestión de Agua</p>
            </div>
        </div>
        
        <!-- Contenido principal -->
        <div style="padding: 20px;">
            
            <!-- Datos del usuario y contrato -->
            <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                <div style="flex: 1; background: #f8fafc; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0;">
                    <h3 style="color: #0f2b3d; font-size: 13px; margin: 0 0 10px 0; border-left: 3px solid #2dd4bf; padding-left: 8px;">DATOS DEL USUARIO</h3>
                    <p style="margin: 5px 0; font-size: 12px;"><strong>${cliente.nombre}</strong></p>
                    <p style="margin: 5px 0; font-size: 11px; color: #475569;">${cliente.ubicacion || "Dirección no registrada"}</p>
                    <p style="margin: 5px 0; font-size: 11px; color: #475569;">${cliente.ciudad ? cliente.ciudad + ", " + (cliente.region || "") : "Ciudad no registrada"}</p>
                </div>
                <div style="flex: 1; background: #f8fafc; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0;">
                    <h3 style="color: #0f2b3d; font-size: 13px; margin: 0 0 10px 0; border-left: 3px solid #2dd4bf; padding-left: 8px;">DATOS DEL CONTRATO</h3>
                    <table style="width: 100%; font-size: 11px;">
                        <tr><td style="padding: 4px;">Cuenta Contrato:</td><td style="padding: 4px;"><strong>${factura.numeroFactura}</strong></td></tr>
                        <tr><td style="padding: 4px;">Estrato:</td><td style="padding: 4px;"><strong>${factura.estrato}</strong> (${porcentajeTexto})</td></tr>
                        <tr><td style="padding: 4px;">Clase de Uso:</td><td style="padding: 4px;"><strong>${claseUso}</strong></td></tr>
                        <tr><td style="padding: 4px;">Número Contador:</td><td style="padding: 4px;"><strong>${factura.clienteContador || cliente.contador}</strong></td></tr>
                    </table>
                </div>
            </div>
            
            <!-- Datos técnicos y lectura -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <h3 style="color: #0f2b3d; font-size: 13px; margin: 0 0 10px 0; border-left: 3px solid #2dd4bf; padding-left: 8px;">DATOS TÉCNICOS</h3>
                <table style="width: 100%; border-collapse: collapse; text-align: center;">
                    <thead>
                        <tr style="background: #e2e8f0;">
                            <th style="padding: 8px; font-size: 11px;">Lectura Anterior (m3)</th>
                            <th style="padding: 8px; font-size: 11px;">Lectura Actual (m3)</th>
                            <th style="padding: 8px; font-size: 11px;">Consumo (m3)</th>
                            <th style="padding: 8px; font-size: 11px;">Fecha Lectura</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; font-size: 11px;">${factura.lecturaAnterior || 0}</td>
                            <td style="padding: 8px; font-size: 11px;">${factura.lecturaActual}</td>
                            <td style="padding: 8px; font-size: 11px;"><strong>${factura.consumoM3}</strong></td>
                            <td style="padding: 8px; font-size: 11px;">${fechaLecturaFormateada}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Detalle de cargos -->
            <div style="margin-bottom: 20px;">
                <h3 style="color: #0f2b3d; font-size: 13px; margin: 0 0 10px 0; border-left: 3px solid #2dd4bf; padding-left: 8px;">DETALLE DE CARGOS</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f1f5f9; border-bottom: 2px solid #2dd4bf;">
                            <th style="padding: 10px; text-align: left; font-size: 12px;">Concepto</th>
                            <th style="padding: 10px; text-align: right; font-size: 12px;">Valor</th>
                            <th style="padding: 10px; text-align: left; font-size: 12px;">Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; font-size: 11px;">Consumo de Agua</td>
                            <td style="padding: 8px; text-align: right; font-size: 11px;">${formatMoney(factura.valorAgua)}</td>
                            <td style="padding: 8px; font-size: 11px;">${factura.consumoM3} m3 × ${formatMoney(factura.tarifaAplicada)}/m3</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; font-size: 11px;">Alcantarillado</td>
                            <td style="padding: 8px; text-align: right; font-size: 11px;">${formatMoney(factura.valorAlcantarillado)}</td>
                            <td style="padding: 8px; font-size: 11px;">45% del consumo de agua</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; font-size: 11px;">Aseo</td>
                            <td style="padding: 8px; text-align: right; font-size: 11px;">${formatMoney(factura.valorAseo)}</td>
                            <td style="padding: 8px; font-size: 11px;">30% del consumo de agua</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Subsidios y contribuciones -->
            <div style="margin-bottom: 20px;">
                <h3 style="color: #0f2b3d; font-size: 13px; margin: 0 0 10px 0; border-left: 3px solid #2dd4bf; padding-left: 8px;">SUBSIDIOS Y CONTRIBUCIONES</h3>
                <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 8px;">
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; font-size: 11px;">Subtotal:</td>
                            <td style="padding: 8px; text-align: right; font-size: 11px;">${formatMoney(factura.subtotal)}</td>
                        </tr>`;

  if (factura.descuentoSubsidio > 0) {
    html += `<tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; font-size: 11px; color: #10b981;">Subsidio por Estrato ${factura.estrato}:</td>
                            <td style="padding: 8px; text-align: right; font-size: 11px; color: #10b981;">- ${formatMoney(factura.descuentoSubsidio)}</td>
                        </tr>`;
  }
  if (factura.contribucion > 0) {
    html += `<tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; font-size: 11px; color: #ef4444;">Contribución por Estrato ${factura.estrato}:</td>
                            <td style="padding: 8px; text-align: right; font-size: 11px; color: #ef4444;">+ ${formatMoney(factura.contribucion)}</td>
                        </tr>`;
  }

  html += `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; font-size: 11px;">Cargo Fijo:</td>
                            <td style="padding: 8px; text-align: right; font-size: 11px;">${formatMoney(factura.cargoFijo || 5000)}</td>
                        </tr>`;

  if (factura.moraAnterior > 0) {
    html += `<tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; font-size: 11px; color: #f59e0b;">Mora de facturas anteriores:</td>
                            <td style="padding: 8px; text-align: right; font-size: 11px; color: #f59e0b;">+ ${formatMoney(factura.moraAnterior)}</td>
                        </tr>`;
  }

  html += `
                        <tr style="background: #e2e8f0; font-weight: bold;">
                            <td style="padding: 10px; font-size: 13px;">TOTAL A PAGAR</td>
                            <td style="padding: 10px; text-align: right; font-size: 18px; color: #0f2b3d;">${formatMoney(factura.totalPagar)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Información para pagos -->
            <div style="background: #f0fdf4; border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid #2dd4bf;">
                <h3 style="color: #0f2b3d; font-size: 13px; margin: 0 0 10px 0;">📢 PARA PAGOS</h3>
                <p style="font-size: 11px; margin: 5px 0;">Consulte las direcciones para pago llamando a la línea de atención: <strong>${EMPRESA.lineaAtencion}</strong></p>
                <div style="margin-top: 10px;">
                    <strong style="font-size: 11px;">🏦 BANCOS AUTORIZADOS:</strong>
                    <p style="font-size: 10px; margin: 3px 0;">Bancolombia, Davivienda, Banco de Bogotá, AV Villas, Caja Social, Colpatria, BBVA</p>
                </div>
                <div style="margin-top: 8px;">
                    <strong style="font-size: 11px;">💻 CANALES DE PAGO:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px; font-size: 10px;">
                        <li>Bancos y corporaciones (todas las sucursales)</li>
                        <li>Cajeros automáticos (Redeban, Multicolor)</li>
                        <li>Puntos de pago autorizados</li>
                        <li>Portal web: ${EMPRESA.paginaWeb}</li>
                    </ul>
                </div>
            </div>
            
            <!-- Quejas y reclamos -->
            <div style="background: #fef3c7; border-radius: 12px; padding: 12px; margin-bottom: 20px; text-align: center;">
                <p style="font-size: 10px; margin: 0;"><strong>📞 Informes, solicitudes, quejas y reclamos:</strong> Línea ${EMPRESA.lineaAtencion} - www.acualinea.gov.co</p>
            </div>
            
            <!-- Documento de pago y código de barras -->
            <div style="background: linear-gradient(135deg, #0f2b3d 0%, #1a4a6f 100%); border-radius: 12px; padding: 15px; margin-bottom: 20px; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <p style="margin: 5px 0; font-size: 11px;"><strong>Documento de Pago:</strong> ${referenciaPago}</p>
                        <p style="margin: 5px 0; font-size: 11px;"><strong>Periodo Facturado:</strong> ${factura.periodo}</p>
                        <p style="margin: 5px 0; font-size: 11px;"><strong>Fecha de Vencimiento:</strong> ${fechaVencimiento}</p>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-family: monospace; font-size: 24px; letter-spacing: 3px;">${codigoBarras}</div>
                        <p style="font-size: 9px; margin-top: 5px;">${factura.numeroFactura} | ${cliente.cedula}</p>
                    </div>
                </div>
            </div>
            
            <!-- Total destacado -->
            <div style="background: #0f2b3d; border-radius: 12px; padding: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div>
                    <span style="font-size: 12px; color: #94a3b8;">Cuenta Contrato:</span>
                    <strong style="font-size: 18px; color: white; display: block;">${factura.numeroFactura}</strong>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 12px; color: #94a3b8;">Valor a Pagar:</span>
                    <strong style="font-size: 24px; color: #2dd4bf; display: block;">${formatMoney(factura.totalPagar)}</strong>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 9px; color: #666;">Visite nuestros CADES, centros de atención y consulte por Internet para obtener copia de su factura y presentar sus solicitudes</p>
                <p style="font-size: 8px; color: #94a3b8; margin-top: 8px;">Creado by Programmer Ivan Rodríguez - Derechos Reservados © 2026 SIFGA</p>
            </div>
        </div>
    </div>
    <div style="text-align: center; margin-top: 20px;">
        <button class="btn-primary" onclick="window.imprimirFacturaActual()" style="background: #0f2b3d; color: white; padding: 12px 30px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">🖨️ Imprimir Factura</button>
    </div>`;

  return html;
}

export function mostrarFacturaEnPantalla(
  htmlContent,
  contenedorId = "resultadoFactura",
) {
  const resultadoDiv = document.getElementById(contenedorId);
  if (resultadoDiv) {
    resultadoDiv.innerHTML = htmlContent;
    resultadoDiv.style.display = "block";
    resultadoDiv.scrollIntoView({ behavior: "smooth" });
  }
}

export function imprimirFactura(htmlContent) {
  const ventana = window.open("", "_blank");
  ventana.document.write(`
        <html>
        <head>
            <title>Factura SIFGA</title>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Arial', 'Segoe UI', sans-serif; 
                    padding: 20px; 
                    background: #f5f5f5;
                }
                @media print {
                    body { padding: 0; margin: 0; background: white; }
                    .factura-botones { display: none; }
                    .btn-primary { display: none; }
                }
            </style>
        </head>
        <body>${htmlContent}</body>
        </html>
    `);
  ventana.document.close();
  ventana.print();
}

window.imprimirFacturaActual = () => {
  const contenido = document.getElementById("facturaParaImprimir");
  if (contenido) {
    imprimirFactura(contenido.outerHTML);
  }
};
