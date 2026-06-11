const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  await prisma.roles.upsert({ where: { nombre: 'administrador' }, update: {}, create: { id_rol: 1, nombre: 'administrador', descripcion: 'Control total del sistema' } });
  await prisma.roles.upsert({ where: { nombre: 'vendedor' }, update: {}, create: { id_rol: 2, nombre: 'vendedor', descripcion: 'Registro de clientes, lecturas y facturación' } });
  await prisma.roles.upsert({ where: { nombre: 'cliente' }, update: {}, create: { id_rol: 3, nombre: 'cliente', descripcion: 'Consulta y pago de facturas' } });

  // 2. Estados factura
  const estadosFactura = ['Pendiente', 'Pagada', 'Mora', 'Anulada'];
  for (let i = 0; i < estadosFactura.length; i++) {
    await prisma.estados_factura.upsert({ where: { nombre: estadosFactura[i] }, update: {}, create: { id_estado_factura: i + 1, nombre: estadosFactura[i] } });
  }

  // 3. Estados propuesta
  const estadosPropuesta = ['Pendiente', 'Aprobada', 'Rechazada'];
  for (let i = 0; i < estadosPropuesta.length; i++) {
    await prisma.estados_propuesta.upsert({ where: { nombre: estadosPropuesta[i] }, update: {}, create: { id_estado_propuesta: i + 1, nombre: estadosPropuesta[i] } });
  }

  // 4. Tipos permiso
  await prisma.tipos_permiso.upsert({ where: { nombre: 'ver' }, update: {}, create: { id_tipo_permiso: 1, nombre: 'ver' } });
  await prisma.tipos_permiso.upsert({ where: { nombre: 'modificar' }, update: {}, create: { id_tipo_permiso: 2, nombre: 'modificar' } });

  // 5. Medios de pago
  const medios = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Transferencia bancaria', 'PSE'];
  for (let i = 0; i < medios.length; i++) {
    await prisma.medios_pago.upsert({ where: { nombre: medios[i] }, update: {}, create: { id_medio_pago: i + 1, nombre: medios[i] } });
  }

  // 6. Estratos
  const estratos = [
    { numero: 1, nombre: 'Bajo-bajo', porcentaje_subsidio: 70.00 },
    { numero: 2, nombre: 'Bajo', porcentaje_subsidio: 50.00 },
    { numero: 3, nombre: 'Medio-bajo', porcentaje_subsidio: 15.00 },
    { numero: 4, nombre: 'Medio', porcentaje_subsidio: 0.00 },
    { numero: 5, nombre: 'Medio-alto', porcentaje_subsidio: -20.00 },
    { numero: 6, nombre: 'Alto', porcentaje_subsidio: -30.00 },
  ];
  for (const e of estratos) {
    await prisma.estratos.upsert({ where: { numero: e.numero }, update: {}, create: { ...e } });
  }

  // 7. Municipios
  const municipios = [
    { nombre: 'Bogotá', region: 'Cundinamarca' },
    { nombre: 'Medellín', region: 'Antioquia' },
    { nombre: 'Cali', region: 'Valle del Cauca' },
    { nombre: 'Barranquilla', region: 'Atlántico' },
    { nombre: 'Cartagena', region: 'Bolívar' },
    { nombre: 'Cúcuta', region: 'Norte de Santander' },
    { nombre: 'Bucaramanga', region: 'Santander' },
  ];
  for (const m of municipios) {
    const exists = await prisma.municipios.findFirst({ where: { nombre: m.nombre } });
    if (!exists) await prisma.municipios.create({ data: m });
  }

  // 8. Configuración
  const confExists = await prisma.configuracion.findFirst();
  if (!confExists) {
    await prisma.configuracion.create({
      data: {
        tarifa_agua_m3: 2800,
        tarifa_alcantarillado_porcentaje: 45.00,
        tarifa_aseo_porcentaje: 30.00,
        plazo_pago_dias: 30,
        interes_mora_porcentaje: 2.00,
        cargo_fijo: 5000,
      }
    });
  }

  // 9. Admin user
  const adminExists = await prisma.usuarios.findUnique({ where: { correo: 'admin@sifga.com' } });
  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    await prisma.usuarios.create({
      data: {
        nombre: 'Admin',
        apellido: 'Principal',
        correo: 'admin@sifga.com',
        usuario: 'admin',
        contrasena: hash,
        id_rol: 1,
        estado: true,
      }
    });
  }

  // 10. Vendor user
  const vendorExists = await prisma.usuarios.findUnique({ where: { correo: 'juan.perez@sifga.com' } });
  if (!vendorExists) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('vendor123', salt);
    await prisma.usuarios.create({
      data: {
        nombre: 'Juan',
        apellido: 'Perez',
        correo: 'juan.perez@sifga.com',
        usuario: 'juanperez',
        contrasena: hash,
        id_rol: 2,
        estado: true,
      }
    });
  }

  // 11. Consecutivo factura
  const year = new Date().getFullYear();
  const consExists = await prisma.consecutivos_factura.findUnique({ where: { anio: year } });
  if (!consExists) {
    await prisma.consecutivos_factura.create({ data: { anio: year, ultimo_numero: 0 } });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
