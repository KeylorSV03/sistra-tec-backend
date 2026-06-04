const adminService = require("../services/adminService");

const createTransporter = async (req, res, next) => {
    try {
        const transporter = await adminService.createTransporter(req.user.userId, req.body);
        return res.status(201).json({
            status: "ok",
            message: "Transportista creado correctamente.",
            transporter,
        });
    } catch (error) {
        next(error);
    }
};

const getTransporters = async (req, res, next) => {
    try {
        const { transporters, totalCount } = await adminService.getTransporters(req.query);
        return res.status(200).json({ status: "ok", transporters, totalCount });
    } catch (error) {
        next(error);
    }
};

const updateTransporterStatus = async (req, res, next) => {
    try {
        const transporter = await adminService.updateTransporterStatus(
            Number(req.params.id), req.body.is_active
        );
        return res.status(200).json({
            status: "ok",
            message: `Transportista ${req.body.is_active ? "activado" : "desactivado"} correctamente.`,
            transporter,
        });
    } catch (error) {
        next(error);
    }
};

const createDelivery = async (req, res, next) => {
    try {
        const delivery = await adminService.createDelivery(req.user.userId, req.body);
        return res.status(201).json({
            status: "ok",
            message: "Entrega asignada correctamente.",
            delivery,
        });
    } catch (error) {
        next(error);
    }
};

const getDeliveries = async (req, res, next) => {
    try {
        const { deliveries, totalCount } = await adminService.getDeliveries(req.query);
        return res.status(200).json({ status: "ok", deliveries, totalCount });
    } catch (error) {
        next(error);
    }
};

const getTransporterDeliveries = async (req, res, next) => {
    try {
        const { deliveries, totalCount } = await adminService.getTransporterDeliveries(
            Number(req.params.id), req.query
        );
        return res.status(200).json({ status: "ok", deliveries, totalCount });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTransporter,
    getTransporters,
    updateTransporterStatus,
    createDelivery,
    getDeliveries,
    getTransporterDeliveries,
};
