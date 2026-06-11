const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function syncUsuarios() {
  console.log("Sincronizando usuarios...");

  const usuarios = await prisma.usuarios.findMany();

  const { error } = await supabase.from("usuarios").upsert(
    usuarios.map((usuario) => ({
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      usuario: usuario.usuario,
      id_rol: usuario.id_rol,
      estado: usuario.estado,
      created_at: usuario.created_at,
    })),
    {
      onConflict: "id_usuario",
    },
  );

  if (error) {
    console.error(error);
  }

  console.log(`Usuarios sincronizados: ${usuarios.length}`);
}

async function syncClientes() {
  console.log("Sincronizando clientes...");

  const clientes = await prisma.clientes.findMany();

  const { error } = await supabase.from("clientes").upsert(
    clientes.map((cliente) => ({
      id_cliente: cliente.id_cliente,
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      cedula: cliente.cedula,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      correo: cliente.correo,
      numero_contador: cliente.numero_contador,
      deuda_actual: Number(cliente.deuda_actual),
      estado: cliente.estado,
      fecha_ingreso: cliente.fecha_ingreso,
      created_at: cliente.created_at,
    })),
    {
      onConflict: "id_cliente",
    },
  );

  if (error) {
    console.error(error);
  }

  console.log(`Clientes sincronizados: ${clientes.length}`);
}

async function syncFacturas() {
  console.log("Sincronizando facturas...");

  const facturas = await prisma.facturas.findMany();

  const { error } = await supabase.from("facturas").upsert(
    facturas.map((factura) => ({
      id_factura: factura.id_factura,
      codigo_factura: factura.codigo_factura,
      id_cliente: factura.id_cliente,
      periodo: factura.periodo,
      total_pagar: Number(factura.total_pagar),
      fecha_emision: factura.fecha_emision,
      fecha_vencimiento: factura.fecha_vencimiento,
      created_at: factura.created_at,
    })),
    {
      onConflict: "id_factura",
    },
  );

  if (error) {
    console.error(error);
  }

  console.log(`Facturas sincronizadas: ${facturas.length}`);
}

async function syncPagos() {
  console.log("Sincronizando pagos...");

  const pagos = await prisma.pagos.findMany();

  const { error } = await supabase.from("pagos").upsert(
    pagos.map((pago) => ({
      id_pago: pago.id_pago,
      id_factura: pago.id_factura,
      id_cliente: pago.id_cliente,
      valor: Number(pago.valor),
      fecha_pago: pago.fecha_pago,
      created_at: pago.created_at,
    })),
    {
      onConflict: "id_pago",
    },
  );

  if (error) {
    console.error(error);
  }

  console.log(`Pagos sincronizados: ${pagos.length}`);
}

async function main() {
  await syncUsuarios();

  await syncClientes();

  await syncFacturas();

  await syncPagos();

  console.log("SIFGA → Supabase sincronizado correctamente");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
