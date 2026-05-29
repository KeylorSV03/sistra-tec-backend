const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const authModel = require("../models/authModel");
const { ROLES } = require("../config/catalogs");
const { hashPassword, comparePassword } = require("../utils/hashUtil");
const { uploadImage, extractPublicId } = require("../utils/cloudinaryUtil");
const { sendEmail } = require("../utils/mailerUtil");
const welcomeEmail = require("../templates/welcomeEmail");
const { dispatchNotification } = require("../utils/notificationUtil");
const { handleDbError } = require("../errors/dbErrorHandler");
const AppError = require("../errors/AppError");

// ─── Helpers JWT ──────────────────────────────────────────────────────────────

const generateAccessToken = (user) =>
    jwt.sign(
        { userId: user.id, rolName: user.rol_name, rolId: user.rol_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES }
    );

const generateRefreshToken = (userId) =>
    jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );

const generateResetToken = (userId, code) =>
    jwt.sign(
        { userId, code, type: "reset" },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
    );

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias en ms
};

// ─── Servicio ─────────────────────────────────────────────────────────────────

const register = async ({ name, email, password, phone_number }) => {
    try {
        const passwordHash = await hashPassword(password);
        const rolId = ROLES["Donante"];
        const user = await authModel.createUser(name, email, passwordHash, rolId, phone_number ?? null);

        dispatchNotification(user.id, "BIENVENIDA", { user_name: user.name });

        sendEmail({
            to: user.email,
            subject: "¡Bienvenido a SISTRA-TEC!",
            html: welcomeEmail.html(user.name),
            attachments: welcomeEmail.attachments(),
        }).catch(() => {});

        return formatUser(user);
    } catch (error) {
        throw handleDbError(error);
    }
};

const login = async ({ email, password }, res) => {
    const user = await authModel.getUserByEmail(email);

    if (!user) throw new AppError("Credenciales incorrectas.", 401);

    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) throw new AppError("Credenciales incorrectas.", 401);

    if (!user.is_active)
        throw new AppError("Cuenta desactivada. Contactá al administrador.", 403);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);

    return { accessToken, user: formatUser(user) };
};

const refresh = async (refreshToken, res) => {
    if (!refreshToken) throw new AppError("No autenticado.", 401);

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
        throw new AppError("Token de sesión inválido o expirado.", 401);
    }

    let user;
    try {
        user = await authModel.getUserById(decoded.userId);
    } catch (error) {
        throw handleDbError(error);
    }

    if (!user.is_active)
        throw new AppError("Cuenta desactivada. Contactá al administrador.", 403);

    const accessToken = generateAccessToken(user);
    res.cookie("refresh_token", generateRefreshToken(user.id), REFRESH_COOKIE_OPTIONS);

    return { accessToken };
};

const logout = (res) => {
    res.clearCookie("refresh_token", { httpOnly: true, sameSite: "strict" });
};

const forgotPassword = async ({ email }) => {
    const user = await authModel.getUserByEmail(email);

    // No revelar si el email existe — siempre responder OK
    if (!user) return;

    const code = crypto.randomInt(100000, 999999).toString();

    try {
        await authModel.createResetCode(user.id, code);
    } catch (error) {
        throw handleDbError(error);
    }

    await sendEmail({
        to: email,
        subject: "Código de recuperación — SISTRA-TEC",
        html: resetCodeEmailHtml(user.name, code),
    });
};

const verifyResetCode = async ({ email, code }) => {
    const INVALID_MSG = "Código inválido o expirado.";

    const user = await authModel.getUserByEmail(email);
    if (!user) throw new AppError(INVALID_MSG, 400);

    const record = await authModel.getResetCode(user.id, code);
    if (!record || !record.is_valid) throw new AppError(INVALID_MSG, 400);

    const resetToken = generateResetToken(user.id, code);
    return { resetToken };
};

const resetPassword = async ({ new_password }, resetToken) => {
    if (!resetToken) throw new AppError("Token de recuperación requerido.", 400);

    let decoded;
    try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.type !== "reset") throw new Error();
    } catch {
        throw new AppError("Token de recuperación inválido o expirado.", 400);
    }

    const passwordHash = await hashPassword(new_password);

    try {
        await authModel.updateUserPassword(decoded.userId, passwordHash);
        await authModel.useResetCode(decoded.userId, decoded.code);
    } catch (error) {
        throw handleDbError(error);
    }
};

const getProfile = async (userId) => {
    try {
        const user = await authModel.getUserById(userId);
        return formatUser(user);
    } catch (error) {
        throw handleDbError(error);
    }
};

const updateProfile = async (userId, { name, phone_number }, file) => {
    try {
        let photoUrl = null;

        if (file) {
            const currentUser = await authModel.getUserById(userId);
            const oldPublicId = extractPublicId(currentUser.profile_photo_url);
            const uploaded = await uploadImage(file.buffer, "sistratec/profiles");
            if (oldPublicId) {
                const { deleteImage } = require("../utils/cloudinaryUtil");
                await deleteImage(oldPublicId).catch(() => {});
            }
            photoUrl = uploaded.url;
        }

        const updated = await authModel.updateUser(
            userId,
            name ?? null,
            phone_number ?? null,
            photoUrl
        );

        return formatUser(updated);
    } catch (error) {
        if (error.isOperational) throw error;
        throw handleDbError(error);
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phone_number,
    profilePhotoUrl: user.profile_photo_url,
    rolId: user.rol_id,
    rolName: user.rol_name,
    isActive: user.is_active,
});

const resetCodeEmailHtml = (name, code) => `
<!DOCTYPE html>
<html lang="es">
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 32px;">
    <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Recuperación de contraseña</h2>
        <p style="color: #475569;">Hola <strong>${name}</strong>,</p>
        <p style="color: #475569;">Tu código de recuperación es:</p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center;
                    font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #1e293b;">
            ${code}
        </div>
        <p style="color: #64748b; font-size: 14px; margin-top: 16px;">
            Este código expira en <strong>15 minutos</strong>.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            Si no solicitaste este código, ignorá este correo.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">SISTRA-TEC — Sistema de Trazabilidad de Donaciones</p>
    </div>
</body>
</html>`;

module.exports = {
    register,
    login,
    refresh,
    logout,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    getProfile,
    updateProfile,
    REFRESH_COOKIE_OPTIONS,
};
