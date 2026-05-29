const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { verificarToken } = require("../middleware/authMiddleware");
const { validarDatos } = require("../middleware/validatorMiddleware");
const v = require("../validations/notificationValidations");

/**
 * @swagger
 * tags:
 *   name: Notificaciones
 *   description: Gestión de notificaciones del usuario
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Obtener mis notificaciones
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_read
 *         schema: { type: boolean }
 *         description: Filtrar por estado de lectura (true/false). Si no se especifica, retorna todas
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
 *         description: Lista de notificaciones del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "ok" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           user_id: { type: integer }
 *                           template_id: { type: integer }
 *                           event_type: { type: string, example: "DONACION_CREADA" }
 *                           donation_id: { type: integer, nullable: true }
 *                           title: { type: string }
 *                           body: { type: string }
 *                           is_read: { type: boolean }
 *                           created_at: { type: string, format: date-time }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_count: { type: integer }
 *                         unread_count: { type: integer }
 *                         limit: { type: integer }
 *                         offset: { type: integer }
 *       401: { description: No autenticado }
 */
router.get("/", verificarToken, validarDatos({ query: v.getNotificationsSchema }), notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Marcar todas las notificaciones como leídas
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las notificaciones marcadas como leídas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "ok" }
 *                 message: { type: string, example: "5 notificación(es) marcada(s) como leída(s)." }
 *                 updated_count: { type: integer }
 *       401: { description: No autenticado }
 */
router.patch("/read-all", verificarToken, notificationController.markAllNotificationsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Marcar una notificación como leída
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "ok" }
 *                 message: { type: string, example: "Notificación marcada como leída." }
 *       404: { description: Notificación no encontrada }
 *       401: { description: No autenticado }
 */
router.patch("/:id/read", verificarToken, validarDatos({ params: v.markNotificationReadSchema }), notificationController.markNotificationRead);

module.exports = router;
