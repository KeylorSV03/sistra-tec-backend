const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verificarToken, verificarRol } = require("../middleware/authMiddleware");
const { validarDatos } = require("../middleware/validatorMiddleware");
const v = require("../validations/adminValidations");

const soloAdmin = [verificarToken, verificarRol("Admin")];

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Gestión de transportistas y entregas (solo Admin)
 */

// ─── Transportistas ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/transporters:
 *   post:
 *     summary: Crear cuenta de transportista
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:         { type: string, example: "Luis Mora" }
 *               email:        { type: string, example: "luis@trans.cr" }
 *               password:     { type: string, example: "password123" }
 *               phone_number: { type: string, example: "+506 8888-1234" }
 *     responses:
 *       201: { description: Transportista creado }
 *       409: { description: El correo ya está registrado }
 */
router.post(
    "/transporters",
    soloAdmin,
    validarDatos({ body: v.createTransporterSchema }),
    adminController.createTransporter
);

/**
 * @swagger
 * /api/admin/transporters:
 *   get:
 *     summary: Listar transportistas
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: search, schema: { type: string }, description: "Buscar por nombre o correo" }
 *       - { in: query, name: limit,  schema: { type: integer, default: 20 } }
 *       - { in: query, name: offset, schema: { type: integer, default: 0  } }
 *     responses:
 *       200: { description: Lista de transportistas + totalCount }
 */
router.get(
    "/transporters",
    soloAdmin,
    validarDatos({ query: v.getTransportersQuerySchema }),
    adminController.getTransporters
);

/**
 * @swagger
 * /api/admin/transporters/{id}/status:
 *   patch:
 *     summary: Activar o desactivar un transportista
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_active]
 *             properties:
 *               is_active: { type: boolean, example: false }
 *     responses:
 *       200: { description: Estado actualizado }
 *       409: { description: Tiene entregas activas, no se puede desactivar }
 *       404: { description: Transportista no encontrado }
 */
router.patch(
    "/transporters/:id/status",
    soloAdmin,
    validarDatos({ params: v.transporterIdSchema, body: v.updateTransporterStatusSchema }),
    adminController.updateTransporterStatus
);

/**
 * @swagger
 * /api/admin/transporters/{id}/deliveries:
 *   get:
 *     summary: Ver asignaciones de un transportista específico
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path,  name: id,        required: true, schema: { type: integer } }
 *       - { in: query, name: status_id,  schema: { type: integer } }
 *       - { in: query, name: date_from,  schema: { type: string, format: date } }
 *       - { in: query, name: date_to,    schema: { type: string, format: date } }
 *       - { in: query, name: search,     schema: { type: string } }
 *       - { in: query, name: order,      schema: { type: string, enum: [ASC, DESC], default: DESC } }
 *       - { in: query, name: limit,      schema: { type: integer, default: 20 } }
 *       - { in: query, name: offset,     schema: { type: integer, default: 0  } }
 *     responses:
 *       200: { description: Lista de asignaciones del transportista }
 */
router.get(
    "/transporters/:id/deliveries",
    soloAdmin,
    validarDatos({ params: v.transporterIdSchema, query: v.getDeliveriesQuerySchema }),
    adminController.getTransporterDeliveries
);

// ─── Entregas ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/deliveries:
 *   post:
 *     summary: Asignar entrega a un transportista
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [donation_id, transporter_id, collection_address, destination, delivery_type]
 *             properties:
 *               donation_id:        { type: integer, example: 1 }
 *               transporter_id:     { type: integer, example: 3 }
 *               collection_address: { type: string,  example: "Av. Central, San José" }
 *               destination:        { type: string,  example: "Albergue Norte, Alajuela" }
 *               delivery_type:      { type: string,  enum: [pickup, dropoff] }
 *     responses:
 *       201: { description: Entrega asignada }
 *       404: { description: Donación o transportista no encontrado }
 *       409: { description: Transportista no disponible }
 */
router.post(
    "/deliveries",
    soloAdmin,
    validarDatos({ body: v.createDeliverySchema }),
    adminController.createDelivery
);

/**
 * @swagger
 * /api/admin/deliveries:
 *   get:
 *     summary: Listar todas las entregas con filtros
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: status_id,      schema: { type: integer } }
 *       - { in: query, name: transporter_id, schema: { type: integer } }
 *       - { in: query, name: date_from,      schema: { type: string, format: date } }
 *       - { in: query, name: date_to,        schema: { type: string, format: date } }
 *       - { in: query, name: search,         schema: { type: string } }
 *       - { in: query, name: order,          schema: { type: string, enum: [ASC, DESC], default: DESC } }
 *       - { in: query, name: limit,          schema: { type: integer, default: 20 } }
 *       - { in: query, name: offset,         schema: { type: integer, default: 0  } }
 *     responses:
 *       200: { description: Lista de entregas + totalCount }
 */
router.get(
    "/deliveries",
    soloAdmin,
    validarDatos({ query: v.getDeliveriesQuerySchema }),
    adminController.getDeliveries
);

module.exports = router;
