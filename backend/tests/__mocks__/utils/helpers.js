const generarCodigoFactura = jest.fn().mockResolvedValue('FAC-2026-000001');
const calcularValoresFactura = jest.fn().mockResolvedValue({
  subtotal: 50000,
  cargo_fijo: 8500,
  cargo_variable: 41500,
  ajuste_estrato: 0,
  iva: 0,
  total_pagar: 50000
});
const calcularMoraCliente = jest.fn().mockResolvedValue(0);

module.exports = { generarCodigoFactura, calcularValoresFactura, calcularMoraCliente };
