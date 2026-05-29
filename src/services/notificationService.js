const notificationModel = require("../models/notificationModel");
const { handleDbError } = require("../errors/dbErrorHandler");
const AppError = require("../errors/AppError");

const getNotifications = async (userId, isRead = null, limit = 20, offset = 0) => {
	try {
		// Validar límites
		if (limit > 100) limit = 100;
		if (limit < 1) limit = 20;
		if (offset < 0) offset = 0;

		const notifications = await notificationModel.getNotifications(userId, isRead, limit, offset);

		if (notifications.length === 0) {
			return {
				notifications: [],
				pagination: {
					total_count: 0,
					unread_count: 0,
					limit,
					offset,
				},
			};
		}

		const firstRow = notifications[0];
		return {
			notifications,
			pagination: {
				total_count: Number(firstRow.total_count),
				unread_count: Number(firstRow.unread_count),
				limit,
				offset,
			},
		};
	} catch (error) {
		throw handleDbError(error);
	}
};

const markNotificationRead = async (notificationId, userId) => {
	try {
		const result = await notificationModel.markNotificationRead(notificationId, userId);

		if (!result) {
			throw new AppError(
				"Notificación no encontrada o no tienes permisos para modificarla.",
				404
			);
		}

		return result;
	} catch (error) {
		throw handleDbError(error);
	}
};

const markAllNotificationsRead = async (userId) => {
	try {
		const result = await notificationModel.markAllNotificationsRead(userId);

		return {
			message: `${result.updated_count} notificación(es) marcada(s) como leída(s).`,
			updated_count: result.updated_count,
		};
	} catch (error) {
		throw handleDbError(error);
	}
};

module.exports = {
	getNotifications,
	markNotificationRead,
	markAllNotificationsRead,
};
