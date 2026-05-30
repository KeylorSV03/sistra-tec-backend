const express = require("express");
const router = express.Router();
const transporterController = require("../controllers/transporterController");
const { verificarToken, verificarRol } = require("../middleware/authMiddleware");
const { validarDatos } = require("../middleware/validatorMiddleware");
const v = require("../validations/transporterValidations");

/**
 * @swagger
 * tags:
 *   name: Transporter
 *   description: Gestión de entregas del transportista
 */

/**
 * @swagger
 * /api/transporter/deliveries:
 *   get:
 *     summary: Listar mis asignaciones de entrega
 *     tags: [Transporter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status_id
 *         schema: { type: integer }
 *         description: Filtrar por estado de entrega
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *         description: Fecha desde (ISO 8601)
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *         description: Fecha hasta (ISO 8601)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Buscar por nombre de bien o dirección
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *         description: Ordenar por fecha
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *         description: Registros por página
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *         description: Desplazamiento para paginación
 *     responses:
 *       200:
 *         description: Lista de entregas asignadas al transportista
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "ok" }
 *                 deliveries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       deliveryId: { type: integer }
 *                       deliveryType: { type: string, enum: [pickup, dropoff] }
 *                       donationId: { type: integer }
 *                       itemName: { type: string }
 *                       statusName: { type: string }
 *                       donorName: { type: string }
 *                       assignedAt: { type: string, format: date-time }
 *                 totalCount: { type: integer }
 *       401: { description: No autenticado }
 *       403: { description: Rol no autorizado }
 */
router.get(
	"/deliveries",
	verificarToken,
	verificarRol("Transportista"),
	validarDatos({ query: v.getTransporterDeliveriesQuerySchema }),
	transporterController.getTransporterDeliveries
);

/**
 * @swagger
 * /api/transporter/deliveries/{id}:
 *   get:
 *     summary: Detalle de una asignación de entrega
 *     tags: [Transporter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la donación
 *     responses:
 *       200:
 *         description: Detalle completo de la entrega
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "ok" }
 *                 delivery:
 *                   type: object
 *                   properties:
 *                     deliveryId: { type: integer }
 *                     deliveryType: { type: string }
 *                     donationId: { type: integer }
 *                     itemName: { type: string }
 *                     quantity: { type: number }
 *                     unit: { type: string }
 *                     statusName: { type: string }
 *                     donorName: { type: string }
 *                     donorPhone: { type: string }
 *                     collectionAddress: { type: string }
 *                     destination: { type: string }
 *       401: { description: No autenticado }
 *       403: { description: Rol no autorizado }
 *       404: { description: Entrega no encontrada }
 */
router.get(
	"/deliveries/:id",
	verificarToken,
	verificarRol("Transportista"),
	validarDatos({ params: v.deliveryIdSchema }),
	transporterController.getTransporterDeliveryDetail
);

/**
 * @swagger
 * /api/transporter/deliveries/{id}/pickup:
 *   patch:
 *     summary: Confirmar recogida de bien
 *     tags: [Transporter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la donación
 *     responses:
 *       200:
 *         description: Recogida confirmada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "ok" }
 *                 message: { type: string, example: "Recogida confirmada correctamente." }
 *                 delivery: { type: object }
 *       401: { description: No autenticado }
 *       403: { description: Sin permiso o entrega no asignada a ti }
 *       404: { description: Entrega no encontrada }
 */
router.patch(
	"/deliveries/:id/pickup",
	verificarToken,
	verificarRol("Transportista"),
	validarDatos({ params: v.deliveryIdSchema }),
	transporterController.confirmPickup
);

/**
 * @swagger
 * /api/transporter/deliveries/{id}/deliver:
 *   patch:
 *     summary: Confirmar entrega de bien
 *     tags: [Transporter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la donación
 *     responses:
 *       200:
 *         description: Entrega confirmada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "ok" }
 *                 message: { type: string, example: "Entrega confirmada correctamente." }
 *                 delivery: { type: object }
 *       401: { description: No autenticado }
 *       403: { description: Sin permiso o entrega no asignada a ti }
 *       404: { description: Entrega no encontrada }
 */
router.patch(
	"/deliveries/:id/deliver",
	verificarToken,
	verificarRol("Transportista"),
	validarDatos({ params: v.deliveryIdSchema }),
	transporterController.confirmDelivery
);

module.exports = router;
