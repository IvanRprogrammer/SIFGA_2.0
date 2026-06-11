const { Router } = require("express");
const router = Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const clienteRoutes = require("./clienteRoutes");
const lecturaRoutes = require("./lecturaRoutes");
const facturaRoutes = require("./facturaRoutes");
const pagoRoutes = require("./pagoRoutes");
const configRoutes = require("./configRoutes");
const reporteRoutes = require("./reporteRoutes");

/**
 * Ruta principal de la API
 */
router.get("/", (req, res) => {
  res.json({
    sistema: "SIFGA API",
    version: "2.0.0",
    estado: "Operativo",
    endpoints: [
      "/api/auth",
      "/api/users",
      "/api/clientes",
      "/api/lecturas",
      "/api/facturas",
      "/api/pagos",
      "/api/config",
      "/api/reportes",
    ],
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/clientes", clienteRoutes);
router.use("/lecturas", lecturaRoutes);
router.use("/facturas", facturaRoutes);
router.use("/pagos", pagoRoutes);
router.use("/config", configRoutes);
router.use("/reportes", reporteRoutes);

module.exports = router;
