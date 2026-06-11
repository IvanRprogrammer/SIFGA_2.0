# Plan de Implementación SIFGA 2.0 - Full Stack

## Fase 1: Preparación del Entorno (Día 1)

### 1.1 Prerrequisitos
- Node.js 18+ instalado
- MySQL 8 instalado y en ejecución
- Git configurado
- VS Code o editor preferido

### 1.2 Base de Datos

Puedes usar **MySQL Workbench**, **DBeaver**, **HeidiSQL** o cualquier cliente MySQL. Solo abre `backend/database/schema.sql` y ejecútalo completo (Create Database + tablas + datos iniciales).

O por consola:
```bash
mysql -u root -p < backend/database/schema.sql
```

### 1.3 Backend
```bash
cd backend
pnpm install
# Copiar .env.example a .env y configurar credenciales MySQL
pnpm dev               # Inicia en http://localhost:3000
```

### 1.4 Frontend
```bash
cd frontend
pnpm install
pnpm dev               # Inicia en http://localhost:5173
```

### 1.5 Usar pnpm globalmente
Este proyecto usa `pnpm` en vez de `npm`. Si no lo tienes:
```bash
# Windows (PowerShell):
iwr https://get.pnpm.io/install.ps1 -useb | iex

# Con npm si lo tienes:
npm install -g pnpm
```

### 1.6 Verificar
- Health check: GET http://localhost:3000/health
- Frontend: http://localhost:5173
- Login: admin@sifga.com / admin123

---

## Fase 2: Migración de Datos (Día 2)

### 2.1 Scripts de Migración
Crear script en `backend/database/migrate.js` que:
1. Lee datos del prototipo desde localStorage (vía archivo JSON exportado)
2. Transforma al nuevo esquema relacional
3. Inserta en MySQL con transacciones

### 2.2 Validación
- Verificar integridad referencial
- Comparar totales de registros
- Probar login con credenciales migradas

---

## Fase 3: Pruebas de API (Día 2-3)

### 3.1 Postman Collection
Importar `postman/sifga-api-postman.json` en Postman

### 3.2 Flujo de Pruebas
1. Login Admin → Obtener token
2. CRUD Usuarios
3. CRUD Clientes + Aprobación
4. Registrar Lectura + Generar Factura
5. Registrar Pago
6. Reportes y Dashboard
7. Auditoría

---

## Fase 4: Despliegue (Día 3-4)

### 4.1 Producción Backend
```bash
# Usar PM2 para procesos persistente
pnpm add --global pm2
pm2 start src/app.js --name sifga-api
pm2 save
pm2 startup
```

### 4.2 Producción Frontend
```bash
cd frontend
pnpm build
# Servir dist/ con nginx o similar
```

### 4.3 Variables de Entorno Producción
```
NODE_ENV=production
DB_PASSWORD=<password_segura>
JWT_SECRET=<secret_aleatorio_64_chars>
FRONTEND_URL=https://sifga.midominio.com
```

---

## Fase 5: Mejoras Futuras

### 5.1 Pendientes
- [ ] Módulo de mapas (Leaflet) - Ruteo de vendedores
- [ ] Impresión de facturas desde React
- [ ] Envío de correos reales (recuperación contraseña)
- [ ] Reportes en PDF/Excel
- [ ] Dashboard con gráficos (Chart.js o Recharts)
- [ ] Modo oscuro
- [ ] Paginación en tablas grandes
- [ ] Filtros avanzados
- [ ] Exportar datos

### 5.2 Arquitectura Escalable
- Dockerizar aplicación (docker-compose)
- Implementar caché con Redis
- Cola de tareas (Bull/BullMQ) para facturación masiva
- Tests unitarios y de integración (Jest)
- Documentación API con Swagger/OpenAPI

---

## Estructura Final del Proyecto

```
SIFGA 2.0/
├── backend/
│   ├── src/
│   │   ├── config/          # Config DB, constantes
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middleware/       # Auth, validación, errores
│   │   ├── routes/          # Definición de rutas
│   │   ├── utils/           # Helpers, auditoría
│   │   └── app.js           # Punto de entrada Express
│   ├── database/
│   │   └── schema.sql       # DDL completo + datos iniciales
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── assets/          # CSS, imágenes
│   │   ├── components/      # Componentes reutilizables
│   │   │   ├── common/      # DataTable, Badge, Spinner, etc.
│   │   │   └── layout/      # Sidebar, TopBar, DashboardLayout
│   │   ├── contexts/        # AuthContext
│   │   ├── pages/           # Páginas por rol
│   │   │   ├── admin/       # 8 páginas de administración
│   │   │   ├── vendor/      # 7 páginas de vendedor
│   │   │   ├── client/      # 5 páginas de cliente
│   │   │   └── auth/        # Login
│   │   ├── services/        # Capa API (Axios)
│   │   ├── App.jsx          # Router principal
│   │   └── main.jsx         # Entry point Vite
│   ├── index.html
│   ├── vite.config.js       # Proxy API
│   └── package.json
├── postman/
│   └── sifga-api-postman.json
└── PLAN_IMPLEMENTACION.md
```

---

## Mapeo Prototipo → Full Stack

| Funcionalidad | Prototipo (localStorage) | Full Stack (MySQL + API) |
|--------------|------------------------|------------------------|
| Almacenamiento | localStorage (sifga_db) | MySQL 8 (12 tablas) |
| Autenticación | Comparación directa | JWT + Bcrypt |
| Roles | String en usuario | Tabla roles + FK |
| Clientes | Array en data.clientes | Tabla clientes |
| Propuestas | Array en data.propuestasClientes | Tabla propuestas_clientes + workflow |
| Lecturas | Array en data.lecturasGuardadas | Tabla lecturas |
| Facturas | Array en data.facturas | Tabla facturas (con cálculos server-side) |
| Pagos | Array en data.recaudos | Tabla pagos + actualización automática |
| Config | Objeto en data.config | Tabla configuracion + tarifas_especiales |
| Permisos | Array en data.permisosVendedores | Tabla permisos_vendedores |
| Auditoría | No existe | Tabla auditoria (automática) |
| Reportes | Cálculo en JS cliente | Vistas SQL + endpoints |
