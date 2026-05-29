const express = require("express");
const router = express.Router();
const donationController = require("../controllers/donationController");
const { verificarToken, verificarRol } = require("../middleware/authMiddleware");
const { validarDatos } = require("../middleware/validatorMiddleware");
const upload = require("../middleware/uploadMiddleware");
const v = require("../validations/donationValidations");

/**
 * @swagger
 * tags:
 *   name: Donations
 *   description: Gestión de donaciones
 */

/**
 * @swagger
 * /api/donations:
 *   post:
 *     summary: Registrar una nueva donación
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [item_name, quantity, unit, image]
 *             properties:
 *               item_name:   { type: string, example: "Arroz" }
 *               description: { type: string, example: "Bolsas de arroz de 1kg selladas" }
 *               quantity:    { type: integer, example: 50 }
 *               unit:        { type: string, example: "kg" }
 *               image:       { type: string, format: binary }
 *     responses:
 *       201: { description: Donación registrada }
 *       400: { description: Datos inválidos o imagen faltante }
 *       403: { description: Solo donantes pueden crear donaciones }
 */
router.post(
    "/",
    verificarToken,
    verificarRol("Donante"),
    upload.single("image"),
    validarDatos({ body: v.createDonationSchema }),
    donationController.createDonation
);

/**
 * @swagger
 * /api/donations:
 *   get:
 *     summary: Listar donaciones con filtros
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: status_id,  schema: { type: integer },  description: "Filtrar por estado" }
 *       - { in: query, name: date_from,  schema: { type: string, format: date }, description: "Fecha desde (ISO 8601)" }
 *       - { in: query, name: date_to,    schema: { type: string, format: date }, description: "Fecha hasta (ISO 8601)" }
 *       - { in: query, name: search,     schema: { type: string },  description: "Buscar por nombre o ID" }
 *       - { in: query, name: order,      schema: { type: string, enum: [ASC, DESC], default: DESC } }
 *       - { in: query, name: limit,      schema: { type: integer, default: 20 } }
 *       - { in: query, name: offset,     schema: { type: integer, default: 0  } }
 *     responses:
 *       200: { description: Lista de donaciones + totalCount }
 *       403: { description: Transportistas deben usar /transporter/deliveries }
 */
router.get(
    "/",
    verificarToken,
    verificarRol("Admin", "Donante"),
    validarDatos({ query: v.getDonationsQuerySchema }),
    donationController.getDonations
);

/**
 * @swagger
 * /api/donations/{id}:
 *   get:
 *     summary: Detalle de una donación
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, description: "ID de la donación" }
 *     responses:
 *       200: { description: Detalle completo de la donación }
 *       404: { description: Donación no encontrada }
 */
router.get(
    "/:id",
    verificarToken,
    verificarRol("Admin", "Donante"),
    validarDatos({ params: v.donationIdSchema }),
    donationController.getDonationById
);

/**
 * @swagger
 * /api/donations/{id}/status:
 *   patch:
 *     summary: Cambiar el estado de una donación
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, description: "ID de la donación" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status_id]
 *             properties:
 *               status_id: { type: integer, example: 2, description: "ID del nuevo estado" }
 *     responses:
 *       200: { description: Estado actualizado }
 *       403: { description: Sin permiso para cambiar estado }
 *       404: { description: Donación no encontrada }
 */
router.patch(
    "/:id/status",
    verificarToken,
    verificarRol("Admin", "Transportista"),
    validarDatos({ params: v.donationIdSchema, body: v.updateStatusSchema }),
    donationController.updateDonationStatus
);

module.exports = router;
