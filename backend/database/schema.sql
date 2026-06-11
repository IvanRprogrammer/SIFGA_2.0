-- =============================================================
-- SIFGA - Sistema Integrado de Facturación y Gestión de Agua
-- Database Schema for MySQL 8
-- Version: 2.0 (Full Stack Migration)
-- =============================================================

CREATE DATABASE IF NOT EXISTS sifga_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sifga_db;

-- =============================================================
-- 1. CATÁLOGOS BASE
-- =============================================================

-- 1.1 Roles del sistema
CREATE TABLE roles (
  id_rol     TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(100),
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 1.2 Estratos socioeconómicos (Colombia)
CREATE TABLE estratos (
  id_estrato     TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero         TINYINT UNSIGNED NOT NULL UNIQUE,
  nombre         VARCHAR(30) NOT NULL,
  porcentaje_subsidio DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Positivo = subsidio, Negativo = contribución'
) ENGINE=InnoDB;

-- 1.3 Municipios / Ciudades
CREATE TABLE municipios (
  id_municipio SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  region       VARCHAR(100),
  activo       BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- 1.4 Medios de pago
CREATE TABLE medios_pago (
  id_medio_pago TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(50) NOT NULL UNIQUE,
  activo        BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- 1.5 Estados de factura
CREATE TABLE estados_factura (
  id_estado_factura TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 1.6 Estados de propuesta
CREATE TABLE estados_propuesta (
  id_estado_propuesta TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 1.7 Tipos de permiso (vendedor sobre cliente)
CREATE TABLE tipos_permiso (
  id_tipo_permiso TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- =============================================================
-- 2. TABLAS PRINCIPALES
-- =============================================================

-- 2.1 Usuarios del sistema
CREATE TABLE usuarios (
  id_usuario       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(100) NOT NULL,
  apellido         VARCHAR(100),
  correo           VARCHAR(150) NOT NULL UNIQUE,
  usuario          VARCHAR(50) NOT NULL UNIQUE,
  contrasena       VARCHAR(255) NOT NULL,
  id_rol           TINYINT UNSIGNED NOT NULL,
  id_cliente       INT UNSIGNED DEFAULT NULL COMMENT 'Solo si el rol es cliente',
  estado           BOOLEAN NOT NULL DEFAULT TRUE,
  reset_token      VARCHAR(255) DEFAULT NULL,
  reset_expires    DATETIME DEFAULT NULL,
  ultimo_acceso    DATETIME DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
) ENGINE=InnoDB;

CREATE INDEX idx_usuarios_correo ON usuarios(correo);
CREATE INDEX idx_usuarios_rol ON usuarios(id_rol);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

-- 2.2 Clientes
CREATE TABLE clientes (
  id_cliente      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombres         VARCHAR(100) NOT NULL,
  apellidos       VARCHAR(100) NOT NULL,
  cedula          VARCHAR(20) NOT NULL UNIQUE,
  direccion       VARCHAR(255),
  telefono        VARCHAR(20),
  correo          VARCHAR(150),
  numero_contador VARCHAR(50) NOT NULL UNIQUE,
  id_municipio    SMALLINT UNSIGNED,
  id_estrato      TINYINT UNSIGNED,
  deuda_actual    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  estado          ENUM('activo','suspendido','inactivo') NOT NULL DEFAULT 'activo',
  fecha_ingreso   DATE NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio),
  FOREIGN KEY (id_estrato) REFERENCES estratos(id_estrato)
) ENGINE=InnoDB;

CREATE INDEX idx_clientes_cedula ON clientes(cedula);
CREATE INDEX idx_clientes_contador ON clientes(numero_contador);
CREATE INDEX idx_clientes_estado ON clientes(estado);

-- 2.3 Propuestas de clientes (registro por vendedor, aprobación por admin)
CREATE TABLE propuestas_clientes (
  id_propuesta     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_vendedor      INT UNSIGNED NOT NULL,
  id_estado        TINYINT UNSIGNED NOT NULL,
  nombres          VARCHAR(100) NOT NULL,
  apellidos        VARCHAR(100) NOT NULL,
  cedula           VARCHAR(20) NOT NULL,
  direccion        VARCHAR(255),
  telefono         VARCHAR(20),
  correo           VARCHAR(150),
  numero_contador  VARCHAR(50) NOT NULL,
  id_municipio     SMALLINT UNSIGNED,
  id_estrato       TINYINT UNSIGNED,
  observaciones    TEXT,
  fecha_gestion    DATETIME DEFAULT NULL,
  id_admin_gestion INT UNSIGNED DEFAULT NULL,
  contrasena_asignada VARCHAR(255) DEFAULT NULL COMMENT 'Contraseña temporal si se aprueba',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_vendedor) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_estado) REFERENCES estados_propuesta(id_estado_propuesta),
  FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio),
  FOREIGN KEY (id_estrato) REFERENCES estratos(id_estrato),
  FOREIGN KEY (id_admin_gestion) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE INDEX idx_propuestas_estado ON propuestas_clientes(id_estado);
CREATE INDEX idx_propuestas_vendedor ON propuestas_clientes(id_vendedor);

-- 2.4 Lecturas de contadores
CREATE TABLE lecturas (
  id_lectura      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_cliente      INT UNSIGNED NOT NULL,
  id_usuario      INT UNSIGNED NOT NULL COMMENT 'Vendedor que registró',
  fecha_lectura   DATE NOT NULL,
  lectura_anterior DECIMAL(10,2) NOT NULL,
  lectura_actual  DECIMAL(10,2) NOT NULL,
  consumo_m3      DECIMAL(10,2) GENERATED ALWAYS AS (lectura_actual - lectura_anterior) STORED,
  observaciones   TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE INDEX idx_lecturas_cliente ON lecturas(id_cliente);
CREATE INDEX idx_lecturas_fecha ON lecturas(fecha_lectura);

-- 2.5 Facturas
CREATE TABLE facturas (
  id_factura        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo_factura    VARCHAR(30) NOT NULL UNIQUE COMMENT 'Formato: FAC-YYYY-NNNNNN',
  id_cliente        INT UNSIGNED NOT NULL,
  id_lectura        INT UNSIGNED DEFAULT NULL,
  periodo           VARCHAR(50) NOT NULL COMMENT 'Ej: 2026-05-01 / 2026-05-31',
  fecha_emision     DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  id_estado         TINYINT UNSIGNED NOT NULL,

  -- Cálculos
  lectura_anterior  DECIMAL(10,2) NOT NULL,
  lectura_actual    DECIMAL(10,2) NOT NULL,
  consumo_m3        DECIMAL(10,2) NOT NULL,
  tarifa_agua       DECIMAL(10,2) NOT NULL COMMENT 'COP por m3 aplicado',
  valor_agua        DECIMAL(12,2) NOT NULL,
  valor_alcantarillado DECIMAL(12,2) NOT NULL,
  valor_aseo        DECIMAL(12,2) NOT NULL,
  subtotal          DECIMAL(12,2) NOT NULL,
  porcentaje_subsidio DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  descuento_subsidio  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  contribucion      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  cargo_fijo        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  mora_anterior     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_pagar       DECIMAL(12,2) NOT NULL,

  -- Auditoría
  id_usuario_creacion INT UNSIGNED NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
  FOREIGN KEY (id_lectura) REFERENCES lecturas(id_lectura),
  FOREIGN KEY (id_estado) REFERENCES estados_factura(id_estado_factura),
  FOREIGN KEY (id_usuario_creacion) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE INDEX idx_facturas_cliente ON facturas(id_cliente);
CREATE INDEX idx_facturas_estado ON facturas(id_estado);
CREATE INDEX idx_facturas_codigo ON facturas(codigo_factura);
CREATE INDEX idx_facturas_fecha_vencimiento ON facturas(fecha_vencimiento);

-- 2.6 Pagos / Recaudos
CREATE TABLE pagos (
  id_pago         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_factura      INT UNSIGNED NOT NULL,
  id_cliente      INT UNSIGNED NOT NULL,
  id_usuario      INT UNSIGNED DEFAULT NULL COMMENT 'Quien registra (null si es autoservicio)',
  id_medio_pago   TINYINT UNSIGNED NOT NULL,
  valor           DECIMAL(12,2) NOT NULL,
  referencia      VARCHAR(100) DEFAULT NULL,
  fecha_pago      DATE NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_factura) REFERENCES facturas(id_factura),
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_medio_pago) REFERENCES medios_pago(id_medio_pago)
) ENGINE=InnoDB;

CREATE INDEX idx_pagos_factura ON pagos(id_factura);
CREATE INDEX idx_pagos_cliente ON pagos(id_cliente);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);

-- =============================================================
-- 3. TABLAS DE SOPORTE
-- =============================================================

-- 3.1 Configuración general del sistema (tarifas globales)
CREATE TABLE configuracion (
  id_config         TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tarifa_agua_m3    DECIMAL(10,2) NOT NULL DEFAULT 2800.00,
  tarifa_alcantarillado_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 45.00,
  tarifa_aseo_porcentaje           DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  plazo_pago_dias   SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  interes_mora_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 2.00,
  cargo_fijo         DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3.2 Tarifas especiales por cliente
CREATE TABLE tarifas_especiales (
  id_tarifa_especial INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_cliente         INT UNSIGNED NOT NULL UNIQUE,
  tarifa_agua_m3     DECIMAL(10,2) DEFAULT NULL,
  plazo_pago_dias    SMALLINT UNSIGNED DEFAULT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
) ENGINE=InnoDB;

-- 3.3 Permisos de vendedores sobre clientes
CREATE TABLE permisos_vendedores (
  id_permiso        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_vendedor       INT UNSIGNED NOT NULL,
  id_cliente        INT UNSIGNED NOT NULL,
  id_tipo_permiso   TINYINT UNSIGNED NOT NULL,
  fecha_expiracion  DATE DEFAULT NULL,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_vendedor) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
  FOREIGN KEY (id_tipo_permiso) REFERENCES tipos_permiso(id_tipo_permiso),
  UNIQUE KEY uq_vendedor_cliente_tipo (id_vendedor, id_cliente, id_tipo_permiso)
) ENGINE=InnoDB;

-- 3.4 Auditoría
CREATE TABLE auditoria (
  id_auditoria  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario    INT UNSIGNED DEFAULT NULL,
  accion        VARCHAR(100) NOT NULL,
  modulo        VARCHAR(50) NOT NULL,
  detalle       JSON DEFAULT NULL,
  ip_address    VARCHAR(45) DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE INDEX idx_auditoria_usuario ON auditoria(id_usuario);
CREATE INDEX idx_auditoria_modulo ON auditoria(modulo);
CREATE INDEX idx_auditoria_fecha ON auditoria(created_at);

-- 3.5 Consecutivos de facturación (control de numeración)
CREATE TABLE consecutivos_factura (
  id_consecutivo TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  anio           SMALLINT UNSIGNED NOT NULL,
  ultimo_numero  INT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_anio (anio)
) ENGINE=InnoDB;

-- =============================================================
-- 4. VISTAS
-- =============================================================

-- 4.1 Resumen de clientes por municipio
CREATE OR REPLACE VIEW vw_resumen_clientes_municipio AS
SELECT
  m.nombre AS municipio,
  m.region,
  COUNT(c.id_cliente) AS total_clientes,
  SUM(CASE WHEN c.estado = 'activo' THEN 1 ELSE 0 END) AS activos,
  SUM(c.deuda_actual) AS deuda_total
FROM municipios m
LEFT JOIN clientes c ON c.id_municipio = m.id_municipio
GROUP BY m.id_municipio, m.nombre, m.region;

-- 4.2 Resumen de recaudos por municipio
CREATE OR REPLACE VIEW vw_resumen_recaudos_municipio AS
SELECT
  m.nombre AS municipio,
  COUNT(p.id_pago) AS total_pagos,
  SUM(p.valor) AS total_recaudado
FROM pagos p
JOIN facturas f ON f.id_factura = p.id_factura
JOIN clientes c ON c.id_cliente = f.id_cliente
JOIN municipios m ON m.id_municipio = c.id_municipio
GROUP BY m.nombre;

-- 4.3 Historial de consumo por cliente
CREATE OR REPLACE VIEW vw_historial_consumo AS
SELECT
  c.id_cliente,
  c.nombres,
  c.apellidos,
  c.cedula,
  c.numero_contador,
  l.id_lectura,
  l.fecha_lectura,
  l.lectura_anterior,
  l.lectura_actual,
  l.consumo_m3,
  l.created_at AS fecha_registro
FROM clientes c
JOIN lecturas l ON l.id_cliente = c.id_cliente
ORDER BY c.id_cliente, l.fecha_lectura DESC;

-- =============================================================
-- 5. DATOS INICIALES
-- =============================================================

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
  ('administrador', 'Control total del sistema'),
  ('vendedor', 'Registro de clientes, lecturas y facturación'),
  ('cliente', 'Consulta y pago de facturas');

-- Estados de factura
INSERT INTO estados_factura (nombre) VALUES
  ('Pendiente'),
  ('Pagada'),
  ('Mora'),
  ('Anulada');

-- Estados de propuesta
INSERT INTO estados_propuesta (nombre) VALUES
  ('Pendiente'),
  ('Aprobada'),
  ('Rechazada');

-- Tipos de permiso
INSERT INTO tipos_permiso (nombre) VALUES
  ('ver'),
  ('modificar');

-- Medios de pago
INSERT INTO medios_pago (nombre) VALUES
  ('Efectivo'),
  ('Tarjeta débito'),
  ('Tarjeta crédito'),
  ('Transferencia bancaria'),
  ('PSE');

-- Estratos
INSERT INTO estratos (numero, nombre, porcentaje_subsidio) VALUES
  (1, 'Bajo-bajo', 70.00),
  (2, 'Bajo', 50.00),
  (3, 'Medio-bajo', 15.00),
  (4, 'Medio', 0.00),
  (5, 'Medio-alto', -20.00),
  (6, 'Alto', -30.00);

-- Municipios
INSERT INTO municipios (nombre, region) VALUES
  ('Bogotá', 'Cundinamarca'),
  ('Medellín', 'Antioquia'),
  ('Cali', 'Valle del Cauca'),
  ('Barranquilla', 'Atlántico'),
  ('Cartagena', 'Bolívar'),
  ('Cúcuta', 'Norte de Santander'),
  ('Bucaramanga', 'Santander');

-- Configuración inicial
INSERT INTO configuracion (tarifa_agua_m3, tarifa_alcantarillado_porcentaje, tarifa_aseo_porcentaje, plazo_pago_dias, interes_mora_porcentaje, cargo_fijo)
VALUES (2800.00, 45.00, 30.00, 30, 2.00, 5000.00);

-- Usuario administrador por defecto (contraseña: admin123)
INSERT INTO usuarios (nombre, apellido, correo, usuario, contrasena, id_rol)
VALUES ('Admin', 'Principal', 'admin@sifga.com', 'admin',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

-- Consecutivo de facturación año actual
INSERT INTO consecutivos_factura (anio, ultimo_numero)
VALUES (YEAR(CURRENT_DATE), 0);
