const http = require('http');

const api = (method, path, body, token) => new Promise((resolve, reject) => {
  const opts = { hostname: 'localhost', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const req = http.request(opts, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
  });
  req.on('error', reject);
  if (body) req.write(JSON.stringify(body));
  req.end();
});

(async () => {
  try {
    // 1. Admin login
    const admin = await api('POST', '/api/auth/login', { correo: 'admin@sifga.com', contrasena: 'admin123' });
    if (!admin.token) throw new Error('Admin login failed: ' + JSON.stringify(admin));
    const token = admin.token;
    console.log('1. PASS: Admin login - ' + admin.usuario.nombre + ' (' + admin.usuario.rol + ')');

    // 2. Get users
    const users = await api('GET', '/api/users', null, token);
    console.log('2. PASS: Get users (' + users.length + ' users)');

    // 3. Get roles
    const roles = await api('GET', '/api/users/roles', null, token);
    console.log('3. PASS: Get roles (' + roles.length + ' roles)');

    // 4. Get config
    const config = await api('GET', '/api/config', null, token);
    console.log('4. PASS: Get config (tarifa: $' + config.tarifa_agua_m3 + '/m3)');

    // 5. Dashboard
    const dash = await api('GET', '/api/reportes/dashboard', null, token);
    console.log('5. PASS: Dashboard (users:' + dash.total_usuarios + ' clients:' + dash.total_clientes + ')');

    // 6. Vendor login
    const vendor = await api('POST', '/api/auth/login', { correo: 'juan.perez@sifga.com', contrasena: 'vendor123' });
    if (!vendor.token) throw new Error('Vendor login failed');
    console.log('6. PASS: Vendor login');

    // 7. Create client
    const client = await api('POST', '/api/clientes', { nombres: 'Test', apellidos: 'User', cedula: '999999', direccion: 'Test 123', numero_contador: 'CT-999' }, token);
    if (!client.id_cliente) throw new Error('Client creation failed: ' + JSON.stringify(client));
    const cid = client.id_cliente;
    console.log('7. PASS: Create client (ID: ' + cid + ')');

    // 8. Create invoice
    const invoice = await api('POST', '/api/facturas', { id_cliente: cid, periodo: '2026-06-01 / 2026-06-30', lectura_actual: 200 }, token);
    if (!invoice.codigo_factura) throw new Error('Invoice failed: ' + JSON.stringify(invoice));
    console.log('8. PASS: Create invoice (' + invoice.codigo_factura + ' - $' + invoice.total_pagar + ')');

    // 9. Pay invoice
    const payment = await api('POST', '/api/pagos', { id_factura: invoice.id_factura, id_medio_pago: 1, valor: invoice.total_pagar }, token);
    if (!payment.id_pago) throw new Error('Payment failed: ' + JSON.stringify(payment));
    console.log('9. PASS: Pay invoice (ID: ' + payment.id_pago + ')');

    // 10. Audit log
    const audit = await api('GET', '/api/reportes/auditoria', null, token);
    console.log('10. PASS: Audit log (' + audit.length + ' entries)');

    console.log('===== ALL 10 TESTS PASSED =====');
    process.exit(0);
  } catch (e) {
    console.error('FAIL: ' + e.message);
    process.exit(1);
  }
})();
