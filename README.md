# SIFGA 2.0
## Sistema Integrado de Facturación y Gestión de Agua

![Version](https://img.shields.io/badge/version-2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![MySQL](https://img.shields.io/badge/MySQL-8-orange)
![Prisma](https://img.shields.io/badge/Prisma-ORM-purple)
![License](https://img.shields.io/badge/license-Academic-lightgrey)

---

## Descripción

SIFGA 2.0 (Sistema Integrado de Facturación y Gestión de Agua) es una aplicación Full Stack desarrollada para la administración integral de empresas prestadoras de servicios públicos de agua.

El sistema permite gestionar:

- Usuarios
- Clientes
- Lecturas de medidores
- Facturación
- Recaudo de pagos
- Reportes
- Auditoría
- Control de acceso por roles

La solución fue desarrollada utilizando tecnologías modernas orientadas a la escalabilidad, mantenibilidad y seguridad.

---

# Arquitectura del Proyecto

```text
Frontend (React + Vite)
        │
        ▼
Backend (Node.js + Express)
        │
        ▼
Prisma ORM
        │
        ▼
MySQL 8
```

Integraciones complementarias:

```text
GitHub
Vercel
Supabase (Académico)
Postman
OpenCode
```

---

# Tecnologías Utilizadas

## Backend

- Node.js
- Express.js
- Prisma ORM
- JWT Authentication
- Bcrypt
- Nodemailer
- Jest
- MySQL

## Frontend

- React 18
- Vite
- Axios
- React Router DOM
- Bootstrap
- Context API

## Infraestructura

- GitHub
- Vercel
- Supabase (Integración académica)
- Postman

---

# Funcionalidades Implementadas

## Gestión de Usuarios

- Crear usuarios
- Editar usuarios
- Eliminar usuarios
- Consultar usuarios
- Recuperación de contraseña

## Gestión de Clientes

- Registro de clientes
- Aprobación administrativa
- Consulta de clientes

## Gestión de Lecturas

- Registro de lecturas
- Historial de consumos
- Seguimiento de medidores

## Facturación

- Generación automática
- Control de estados
- Cálculo de consumo

## Pagos

- Registro de pagos
- Actualización automática de facturas
- Historial de recaudo

## Administración

- Dashboard
- Gestión de usuarios
- Gestión de clientes
- Reportes

---

# Roles del Sistema

## Administrador

- Gestión total del sistema
- Aprobar clientes
- Gestionar usuarios
- Consultar reportes

## Vendedor

- Registrar clientes
- Tomar lecturas
- Generar facturas

## Cliente

- Consultar facturas
- Consultar pagos
- Consultar consumo

---

# Estructura del Proyecto

```text
SIFGA 2.0
│
├── backend
│   ├── prisma
│   ├── src
│   │   ├── controllers
│   │   ├── routes
│   │   ├── middleware
│   │   ├── services
│   │   ├── utils
│   │   └── app.js
│   │
│   ├── tests
│   └── package.json
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── contexts
│   │   ├── hooks
│   │   ├── pages
│   │   ├── services
│   │   └── App.jsx
│   │
│   └── package.json
│
├── postman
│   └── sifga-api-postman.json
│
└── README.md
```

---

# Instalación del Proyecto

## Clonar Repositorio

```bash
git clone https://github.com/TU-USUARIO/sifga-2.0.git

cd sifga-2.0
```

---

# Instalación Backend

```bash
cd backend

pnpm install
```

---

# Instalación Frontend

```bash
cd frontend

pnpm install
```

---

# Configuración Backend

Crear archivo:

```text
backend/.env
```

Ejemplo:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=7777
DB_NAME=sifga_db

DATABASE_URL="mysql://root:7777@localhost:3307/sifga_db"

JWT_SECRET=sifga_secret_key
```

---

# Prisma ORM

Generar Cliente Prisma

```bash
npx prisma generate
```

Verificar conexión

```bash
npx prisma db pull
```

Abrir Prisma Studio

```bash
npx prisma studio
```

---

# Ejecución Backend

```bash
cd backend

pnpm run dev
```

Servidor:

```text
http://localhost:3000
```

---

# Ejecución Frontend

```bash
cd frontend

pnpm run dev
```

Aplicación:

```text
http://localhost:5173
```

---

# Pruebas API con Postman

La colección oficial se encuentra en:

```text
postman/sifga-api-postman.json
```

Pasos:

1. Abrir Postman
2. Importar colección
3. Configurar Base URL
4. Ejecutar endpoints
5. Validar respuestas

Módulos probados:

- Auth
- Usuarios
- Clientes
- Lecturas
- Facturas
- Pagos

---

# Integración Académica con Supabase

Supabase fue implementado como requisito académico.

Funcionalidades:

- Proyecto creado en Supabase
- Configuración de API Keys
- Variables de entorno
- Sincronización demostrativa con MySQL

Importante:

```text
La base de datos principal del sistema es MySQL.
Supabase NO reemplaza la arquitectura principal.
```

---

# Control de Versiones

Repositorio GitHub:

```text
https://github.com/TU-USUARIO/sifga-2.0
```

Comandos básicos:

```bash
git add .
git commit -m "Actualización"
git push origin main
```

---

# Despliegue

## Frontend

Plataforma:

```text
Vercel
```

Deploy automático:

```text
Push → GitHub → Vercel
```

---

# Calidad del Proyecto

## Pruebas

- 59 pruebas unitarias
- Cobertura aproximada 86%

## Seguridad

- JWT
- Bcrypt
- Middleware de autorización
- Control por roles

---

# Automatización

Durante el proceso de integración modular y configuración de infraestructura se utilizó OpenCode como herramienta de asistencia para automatizar tareas de desarrollo, organización de componentes y generación de estructuras base, manteniendo supervisión técnica durante todo el proceso de implementación.

---

# Autor

Ivan Rodriguez Ulloa

Proyecto académico y tecnológico desarrollado para el Sistema Integrado de Facturación y Gestión de Agua (SIFGA 2.0).

---

# Licencia

Uso académico y educativo.
