const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verificarToken } = require("../middleware/authMiddleware");
const { validarDatos } = require("../middleware/validatorMiddleware");
const upload = require("../middleware/uploadMiddleware");
const v = require("../validations/authValidations");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y gestión de perfil
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registro de donante
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:         { type: string, example: "María González" }
 *               email:        { type: string, example: "maria@gmail.com" }
 *               password:     { type: string, example: "miPassword123" }
 *               phone_number: { type: string, example: "+506 8888-1234" }
 *     responses:
 *       201: { description: Usuario creado }
 *       409: { description: El correo ya está registrado }
 */
router.post(
    "/register",
    validarDatos({ body: v.registerSchema }),
    authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: "maria@gmail.com" }
 *               password: { type: string, example: "miPassword123" }
 *     responses:
 *       200: { description: Sesión iniciada, retorna accessToken }
 *       401: { description: Credenciales incorrectas }
 */
router.post(
    "/login",
    validarDatos({ body: v.loginSchema }),
    authController.login
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar access token usando el refresh token (cookie)
 *     tags: [Auth]
 *     responses:
 *       200: { description: Nuevo accessToken }
 *       401: { description: Refresh token inválido o expirado }
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Sesión cerrada }
 */
router.post("/logout", verificarToken, authController.logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar código de recuperación de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "maria@gmail.com" }
 *     responses:
 *       200: { description: Respuesta genérica (no revela si el email existe) }
 */
router.post(
    "/forgot-password",
    validarDatos({ body: v.forgotPasswordSchema }),
    authController.forgotPassword
);

/**
 * @swagger
 * /api/auth/verify-reset-code:
 *   post:
 *     summary: Verificar código de recuperación y obtener reset_token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, example: "maria@gmail.com" }
 *               code:  { type: string, example: "483921" }
 *     responses:
 *       200: { description: Código válido, retorna resetToken }
 *       400: { description: Código inválido o expirado }
 */
router.post(
    "/verify-reset-code",
    validarDatos({ body: v.verifyResetCodeSchema }),
    authController.verifyResetCode
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Cambiar contraseña con reset_token
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-reset-token
 *         required: true
 *         schema: { type: string }
 *         description: Reset token obtenido de /verify-reset-code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_password]
 *             properties:
 *               new_password: { type: string, example: "nuevaPassword123" }
 *     responses:
 *       200: { description: Contraseña actualizada }
 *       400: { description: Token inválido o expirado }
 */
router.post(
    "/reset-password",
    validarDatos({ body: v.resetPasswordSchema }),
    authController.resetPassword
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Ver perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Datos del perfil }
 *       401: { description: No autenticado }
 */
router.get("/profile", verificarToken, authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Actualizar perfil (nombre, teléfono, foto)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:          { type: string }
 *               phone_number:  { type: string }
 *               profile_photo: { type: string, format: binary }
 *     responses:
 *       200: { description: Perfil actualizado }
 *       400: { description: Datos inválidos }
 */
router.put(
    "/profile",
    verificarToken,
    upload.single("profile_photo"),
    validarDatos({ body: v.updateProfileSchema }),
    authController.updateProfile
);

module.exports = router;
