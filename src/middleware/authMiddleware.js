const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        return res.status(401).json({ status: "error", message: "No autenticado." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, rolName, rolId }
        next();
    } catch {
        return res.status(401).json({ status: "error", message: "Token inválido o expirado." });
    }
};

const verificarRol = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.rolName)) {
        return res.status(403).json({ status: "error", message: "Acceso denegado." });
    }
    next();
};

module.exports = { verificarToken, verificarRol };
