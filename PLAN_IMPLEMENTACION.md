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