# Plan de Implementación SIFGA 2.0 - Full Stack

## Estado Actual del Proyecto

### Proyecto Implementado

SIFGA 2.0 se encuentra actualmente en una fase avanzada de desarrollo.

Componentes implementados:

- Backend Node.js + Express
- Frontend React + Vite
- Prisma ORM
- MySQL
- JWT Authentication
- Bcrypt
- Jest (59 pruebas)
- Arquitectura modular por roles
- API REST funcional
- Postman Collection
- Recuperación de contraseña
- Sistema de facturación completo

---

## Fase 1: Preparación del Entorno (Completada)

### 1.1 Prerrequisitos

Verificar herramientas:

```bash
node -v
pnpm -v
git --version
```

Versiones recomendadas:

```text
Node.js 18+
PNPM 10+
Git 2+
MySQL 8+
```

### 1.2 Base de Datos

Verificar conexión:

```bash
mysql -u root -p
```

Seleccionar base de datos:

```sql
USE sifga_db;
SHOW TABLES;
```

### 1.3 Backend

```bash
cd backend

pnpm install

pnpm prisma validate

pnpm prisma generate

pnpm run dev
```

Resultado esperado:

```text
http://localhost:3000
```

### 1.4 Frontend

```bash
cd frontend

pnpm install

pnpm run dev
```

Resultado esperado:

```text
http://localhost:5173
```

---

## Fase 2: Configuración de Infraestructura (Completada)

### 2.1 Validación del Entorno

Backend:

```bash
pnpm prisma validate
pnpm prisma generate
```

Frontend:

```bash
pnpm run build
```

### 2.2 Validación Base de Datos

```bash
pnpm prisma studio
```

Verificar:

- usuarios
- clientes
- lecturas
- facturas
- pagos
- auditoria

### 2.3 Variables de Entorno

Archivo:

```text
backend/.env
```

Variables obligatorias:

```env
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=
```

---

## Fase 3: Adaptación de Supabase para SIFGA 2.0

### Objetivo

Implementar Supabase como repositorio secundario de demostración académica.

### Importante

```text
MySQL continúa siendo la base de datos principal.

Supabase NO reemplaza MySQL.

Supabase se utiliza únicamente para cumplir
los requerimientos académicos del proyecto.
```

### 3.1 Proyecto Supabase

Proyecto creado:

```text
sifga_2.0
```

Estado:

```text
ACTIVE
```

### 3.2 Obtener API Keys

Ruta:

```text
Settings
└── API
```

Copiar:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3.3 Integración Backend

Instalar SDK:

```bash
cd backend

pnpm add @supabase/supabase-js
```

Crear:

```text
backend/scripts/syncSupabase.js
```

Función:

```text
Sincronizar MySQL hacia Supabase
para demostración académica.
```

### 3.4 Sincronización Automática

Arquitectura:

```text
MySQL
  │
  ▼
Prisma ORM
  │
  ▼
syncSupabase.js
  │
  ▼
Supabase
```

Tablas sincronizadas:

- usuarios
- clientes
- facturas
- pagos

### 3.5 Ejecutar Sincronización

```bash
pnpm run sync:supabase
```

Resultado esperado:

```text
Usuarios sincronizados
Clientes sincronizados
Facturas sincronizadas
Pagos sincronizados
```

---

## Fase 4: Control de Versiones con GitHub

### 4.1 Inicializar Git

```bash
git init
```

### 4.2 Crear .gitignore

Excluir:

```text
node_modules
.env
dist
coverage
.vscode
```

### 4.3 Crear Repositorio

Nombre:

```text
sifga-2.0
```

### 4.4 Conectar Repositorio

```bash
git remote add origin https://github.com/USUARIO/sifga-2.0.git
```

### 4.5 Primer Commit

```bash
git add .

git commit -m "Initial commit SIFGA 2.0"
```

### 4.6 Publicar

```bash
git branch -M main

git push -u origin main
```

---

## Fase 5: Despliegue Frontend con Vercel

### Objetivo

Publicar la interfaz React de SIFGA 2.0.

### 5.1 Build Local

```bash
cd frontend

pnpm install

pnpm run build
```

Resultado esperado:

```text
dist/
```

### 5.2 Configuración Vercel

```text
Framework Preset: Vite
Root Directory: frontend
Build Command: pnpm run build
Output Directory: dist
```

### 5.3 Variables de Entorno

```env
VITE_API_URL=http://localhost:3000

VITE_SUPABASE_URL=

VITE_SUPABASE_ANON_KEY=
```

### 5.4 Deploy

Resultado esperado:

```text
https://sifga.vercel.app
```

---

## Fase 6: Validación Funcional

### Autenticación

- [ ] Login Administrador
- [ ] Login Vendedor
- [ ] Login Cliente

### Clientes

- [ ] Crear cliente
- [ ] Aprobar cliente
- [ ] Consultar cliente

### Lecturas

- [ ] Registrar lectura
- [ ] Consultar historial

### Facturación

- [ ] Generar factura
- [ ] Consultar factura

### Pagos

- [ ] Registrar pago
- [ ] Actualizar estado factura

### Supabase

- [ ] Ejecutar sincronización
- [ ] Verificar tablas
- [ ] Verificar registros

---

## Fase 7: Mejoras Futuras

### Funcionales

- [ ] Reportes PDF
- [ ] Exportación Excel
- [ ] Dashboard Analítico
- [ ] Notificaciones por Correo
- [ ] Geolocalización
- [ ] Módulo de Mapas

### Técnicas

- [ ] Docker
- [ ] Swagger
- [ ] Redis
- [ ] CI/CD
- [ ] Backups Automáticos

---

## Arquitectura Final

```text
Frontend (React + Vite)
          │
          ▼
       Vercel
          │
          ▼
Backend (Node.js + Express)
          │
          ▼
      Prisma ORM
          │
          ▼
 MySQL (Principal)
          │
          ▼
 SyncSupabase.js
          │
          ▼
 Supabase (Demo Académica)
```

##estructura final de SIFGA 2.0

SIFGA 2.0/
├── .gitignore
├── package.json ← workspace root (pnpm dev/build/start)
├── pnpm-workspace.yaml
├── PLAN_IMPLEMENTACION.md
│
├── index.html ← legacy entry point
├── administrador.html
├── vendedor.html
├── cliente.html
│
├── assets/
│ └── logo.png
│
├── css/
│ └── styles.css
│
├── js/ ← legacy JS (API-first + localStorage fallback)
│ ├── api.js, auth.js, data.js, main.js, utils.js
│ ├── facturacion.js, impresion.js, recaudos.js, rutas.js, usuarios.js
│ ├── modules/
│ │ ├── permisos.js, propuestas.js, reportes.js, tarifas.js
│ └── roles/
│ ├── admin.js, cliente.js, vendedor.js
│
├── postman/
│ └── sifga-api-postman.json
│
├── backend/ ← Express API (pnpm start → puerto 3000)
│ ├── .env
│ ├── package.json
│ ├── jest.config.js ← NUEVO
│ ├── test_runner.js
│ │
│ ├── database/
│ │ └── schema.sql
│ ├── prisma/
│ │ ├── schema.prisma
│ │ └── seed.js
│ ├── scripts/
│ │ └── (check_db, init_db, run_schema, syncSupabase, test_api)
│ │
│ ├── src/
│ │ ├── app.js ← entry point
│ │ ├── config/
│ │ │ ├── constants.js, database.js, index.js, prisma.js, supabase.js
│ │ ├── controllers/
│ │ │ ├── authController.js ← login, register, forgot/reset, profile, changePassword
│ │ │ ├── clienteController.js
│ │ │ ├── configController.js
│ │ │ ├── facturaController.js
│ │ │ ├── lecturaController.js
│ │ │ ├── pagoController.js
│ │ │ ├── reporteController.js
│ │ │ └── userController.js
│ │ ├── middleware/
│ │ │ ├── auth.js, errorHandler.js, validator.js
│ │ ├── models/
│ │ │ └── index.js ← NUEVO (Prisma re-exports)
│ │ ├── routes/
│ │ │ ├── index.js
│ │ │ └── (auth, user, cliente, lectura, factura, pago, config, reporte)Routes.js
│ │ └── utils/
│ │ ├── auditoria.js
│ │ ├── helpers.js
│ │ └── mailer.js ← NUEVO (Nodemailer)
│ │
│ └── tests/ ← NUEVO (Jest)
│ ├── auth.test.js ← 12 tests
│ ├── cliente.test.js ← 12 tests
│ ├── factura.test.js ← 10 tests
│ ├── lectura.test.js ← 9 tests
│ ├── pago.test.js ← 9 tests
│ ├── coverage/
│ │ ├── reporte-tecnico.md ← NUEVO
│ │ └── lcov-report/
│ └── **mocks**/
│ ├── database.js, auditoria.js, helpers.js
│
└── frontend/ ← React + Vite (pnpm build → dist/)
├── .env
├── package.json
├── vite.config.js
├── index.html
│
├── public/
│ └── logo.png ← NUEVO
│
└── src/
├── main.jsx
├── App.jsx
├── assets/
│ └── styles.css
├── components/
│ ├── common/
│ │ ├── ConfirmDialog.jsx, DataTable.jsx, LoadingSpinner.jsx
│ │ ├── ProtectedRoute.jsx, StatusBadge.jsx
│ └── layout/
│ ├── DashboardLayout.jsx, Sidebar.jsx, TopBar.jsx
├── contexts/
│ └── AuthContext.jsx
├── hooks/
│ ├── useApi.js ← NUEVO
│ └── useLocalStorage.js ← NUEVO
├── pages/
│ ├── auth/ → LoginPage.jsx
│ ├── admin/ → 9 páginas (Dashboard, Users, Clientes, Propuestas, Config, Recaudos, Reportes, Auditoría)
│ ├── vendor/ → 8 páginas (Dashboard, Clientes, Proponer, Lectura, Facturación, Consulta, Recaudos)
│ └── client/ → 6 páginas (Cuenta, Facturas, Pagar, Consumo, Pagos)
├── services/
│ ├── api.js, authService.js, clienteService.js, configService.js
│ ├── facturaService.js, lecturaService.js, pagoService.js
│ ├── reporteService.js, userService.js
└── utils/
├── constants.js ← NUEVO
├── formatters.js ← NUEVO
└── validators.js ← NUEVO
