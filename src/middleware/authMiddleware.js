const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ status: "error", message: "Usuario no autenticado" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch {
        return res.status(401).json({ status: "error", message: "Token invalido o expirado" });
    }
};

module.exports = { verificarToken };
