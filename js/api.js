const SIFGA_API = (() => {
  const BASE_URL = 'http://localhost:3000/api';

  function getToken() {
    return sessionStorage.getItem('sifga_token');
  }

  function setToken(token) {
    sessionStorage.setItem('sifga_token', token);
  }

  function clearToken() {
    sessionStorage.removeItem('sifga_token');
  }

  async function request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const token = getToken();
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }

  return {
    // Auth
    login: (correo, contrasena) =>
      request('POST', '/auth/login', { correo, contrasena }),
    getProfile: () => request('GET', '/auth/profile'),
    changePassword: (contrasena_actual, nueva_contrasena) =>
      request('PUT', '/auth/change-password', { contrasena_actual, nueva_contrasena }),

    // Users
    getUsers: () => request('GET', '/users'),
    getUser: (id) => request('GET', `/users/${id}`),
    createUser: (data) => request('POST', '/users', data),
    updateUser: (id, data) => request('PUT', `/users/${id}`, data),
    deleteUser: (id) => request('DELETE', `/users/${id}`),
    toggleUserStatus: (id) => request('PATCH', `/users/${id}/toggle-status`),
    resetUserPassword: (id, pass) => request('POST', `/users/${id}/reset-password`, { nueva_contrasena: pass }),
    getRoles: () => request('GET', '/users/roles'),

    // Clients
    getClientes: (estado) => request('GET', `/clientes${estado ? `?estado=${estado}` : ''}`),
    getCliente: (id) => request('GET', `/clientes/${id}`),
    createCliente: (data) => request('POST', '/clientes', data),
    updateCliente: (id, data) => request('PUT', `/clientes/${id}`, data),
    searchClientes: (termino) => request('GET', `/clientes/search?termino=${encodeURIComponent(termino)}`),
    getPendingProposals: () => request('GET', '/clientes/pendientes'),
    approveProposal: (id, contrasena) => request('PUT', `/clientes/aprobar/${id}`, { contrasena_asignada: contrasena }),
    rejectProposal: (id, obs) => request('PUT', `/clientes/rechazar/${id}`, { observaciones: obs }),
    getMunicipios: () => request('GET', '/clientes/municipios'),
    getEstratos: () => request('GET', '/clientes/estratos'),

    // Invoices
    getFacturas: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request('GET', `/facturas${q ? '?' + q : ''}`);
    },
    getFactura: (id) => request('GET', `/facturas/${id}`),
    createFactura: (data) => request('POST', '/facturas', data),
    searchFacturas: (termino) => request('GET', `/facturas/search?termino=${encodeURIComponent(termino)}`),
    getEstadosFactura: () => request('GET', '/facturas/estados'),

    // Payments
    getPagos: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request('GET', `/pagos${q ? '?' + q : ''}`);
    },
    createPago: (data) => request('POST', '/pagos', data),
    getMediosPago: () => request('GET', '/pagos/medios-pago'),
    getResumenMunicipios: () => request('GET', '/pagos/resumen-municipios'),

    // Readings
    getLecturas: (id_cliente) => {
      const q = id_cliente ? `?id_cliente=${id_cliente}` : '';
      return request('GET', `/lecturas${q}`);
    },
    createLectura: (data) => request('POST', '/lecturas', data),
    getHistorialLecturas: (clienteId) => request('GET', `/lecturas/cliente/${clienteId}/historial`),

    // Reports
    getDashboardStats: () => request('GET', '/reportes/dashboard'),
    getMonthlyReport: (anio, mes) => request('GET', `/reportes/mensual?anio=${anio}&mes=${mes}`),
    getAnnualReport: (anio) => request('GET', `/reportes/anual?anio=${anio}`),
    getAuditLog: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request('GET', `/reportes/auditoria${q ? '?' + q : ''}`);
    },

    // Config
    getConfig: () => request('GET', '/config'),
    updateConfig: (data) => request('PUT', '/config', data),
    getSpecialRates: () => request('GET', '/config/tarifas-especiales'),
    setSpecialRate: (data) => request('POST', '/config/tarifas-especiales', data),
    deleteSpecialRate: (clienteId) => request('DELETE', `/config/tarifas-especiales/${clienteId}`),
    getPermissions: () => request('GET', '/config/permisos'),
    setPermission: (data) => request('POST', '/config/permisos', data),
    revokePermission: (id) => request('DELETE', `/config/permisos/${id}`),

    // Auth helpers
    setToken,
    getToken,
    clearToken,
  };
})();
