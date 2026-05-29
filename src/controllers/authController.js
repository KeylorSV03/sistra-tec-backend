const authService = require("../services/authService");

const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        return res.status(201).json({
            status: "ok",
            message: "Cuenta creada correctamente.",
            user,
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { accessToken, user } = await authService.login(req.body, res);
        return res.status(200).json({
            status: "ok",
            message: "Sesión iniciada correctamente.",
            accessToken,
            user,
        });
    } catch (error) {
        next(error);
    }
};

const refresh = async (req, res, next) => {
    try {
        const { accessToken } = await authService.refresh(req.cookies.refresh_token, res);
        return res.status(200).json({ status: "ok", accessToken });
    } catch (error) {
        next(error);
    }
};

const logout = (req, res, next) => {
    try {
        authService.logout(res);
        return res.status(200).json({ status: "ok", message: "Sesión cerrada correctamente." });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.body);
        return res.status(200).json({
            status: "ok",
            message: "Si el correo está registrado, recibirás un código de recuperación.",
        });
    } catch (error) {
        next(error);
    }
};

const verifyResetCode = async (req, res, next) => {
    try {
        const { resetToken } = await authService.verifyResetCode(req.body);
        return res.status(200).json({ status: "ok", resetToken });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const resetToken = req.headers["x-reset-token"] || null;
        await authService.resetPassword(req.body, resetToken);
        return res.status(200).json({
            status: "ok",
            message: "Contraseña actualizada correctamente.",
        });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const user = await authService.getProfile(req.user.userId);
        return res.status(200).json({ status: "ok", user });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const user = await authService.updateProfile(req.user.userId, req.body, req.file ?? null);
        return res.status(200).json({
            status: "ok",
            message: "Perfil actualizado correctamente.",
            user,
        });
    } catch (error) {
        next(error);
    }
};

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
};
