const transporterService = require("../services/transporterService");

const getTransporterDeliveries = async (req, res, next) => {
	try {
		const { deliveries, totalCount } = await transporterService.getTransporterDeliveries(
			req.user.userId,
			req.query
		);
		return res.status(200).json({ status: "ok", deliveries, totalCount });
	} catch (error) {
		next(error);
	}
};

const getTransporterDeliveryDetail = async (req, res, next) => {
	try {
		const delivery = await transporterService.getTransporterDeliveryDetail(Number(req.params.id));
		return res.status(200).json({ status: "ok", delivery });
	} catch (error) {
		next(error);
	}
};

const confirmPickup = async (req, res, next) => {
	try {
		const delivery = await transporterService.confirmPickup(Number(req.params.id), req.user.userId);
		return res.status(200).json({
			status: "ok",
			message: "Recogida confirmada correctamente.",
			delivery,
		});
	} catch (error) {
		next(error);
	}
};

const confirmDelivery = async (req, res, next) => {
	try {
		const delivery = await transporterService.confirmDelivery(Number(req.params.id), req.user.userId);
		return res.status(200).json({
			status: "ok",
			message: "Entrega confirmada correctamente.",
			delivery,
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	getTransporterDeliveries,
	getTransporterDeliveryDetail,
	confirmPickup,
	confirmDelivery,
};
