const http = require('http');
const api = (method, path, body, token) => new Promise((resolve, reject) => {
  const opts = { hostname: '127.0.0.1', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
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
  let pass = 0, fail = 0;
  try {
    const r1 = await api('POST', '/api/auth/login', { correo: 'admin@sifga.com', contrasena: 'admin123' });
    if (!r1.token) { console.log('FAIL login:', JSON.stringify(r1)); fail++; } 
    else { console.log('PASS: Admin login - ' + r1.usuario.nombre + ' (' + r1.usuario.rol + ')'); pass++; }
    const t = r1.token;
    const r2 = await api('GET', '/api/users', null, t);
    console.log('PASS: Get users (' + r2.length + ' users)'); pass++;
    const r3 = await api('GET', '/api/reportes/dashboard', null, t);
    console.log('PASS: Dashboard (' + r3.total_usuarios + ' users)'); pass++;
    const r4 = await api('POST', '/api/auth/login', { correo: 'juan.perez@sifga.com', contrasena: 'vendor123' });
    console.log('PASS: Vendor login'); pass++;
    console.log('===== ' + pass + '/' + (pass+fail) + ' TESTS PASSED =====');
  } catch(e) { console.log('FAIL:', e.message); }
})();
