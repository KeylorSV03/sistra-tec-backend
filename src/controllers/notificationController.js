const notificationService = require("../services/notificationService");

const getNotifications = async (req, res, next) => {
	try {
		const { is_read, limit, offset } = req.query;
		const userId = req.user.userId;

		const data = await notificationService.getNotifications(
			userId,
			is_read !== undefined ? is_read === "true" : null,
			limit ? parseInt(limit) : 20,
			offset ? parseInt(offset) : 0
		);

		return res.status(200).json({
			status: "ok",
			data,
		});
	} catch (error) {
		next(error);
	}
};

const markNotificationRead = async (req, res, next) => {
	try {
		const { id } = req.params;
		const userId = req.user.userId;

		await notificationService.markNotificationRead(parseInt(id), userId);

		return res.status(200).json({
			status: "ok",
			message: "Notificación marcada como leída.",
		});
	} catch (error) {
		next(error);
	}
};

const markAllNotificationsRead = async (req, res, next) => {
	try {
		const userId = req.user.userId;

		const result = await notificationService.markAllNotificationsRead(userId);

		return res.status(200).json({
			status: "ok",
			message: result.message,
			updated_count: result.updated_count,
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	getNotifications,
	markNotificationRead,
	markAllNotificationsRead,
};
