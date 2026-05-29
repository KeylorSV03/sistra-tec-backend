const { obtenerPool } = require("../config/dbConfig");

const getNotifications = async (userId, isRead = null, limit = 20, offset = 0) => {
	const pool = obtenerPool();
	const result = await pool.query(
		"SELECT * FROM get_notifications($1, $2, $3, $4)",
		[userId, isRead, limit, offset]
	);
	return result.rows;
};

const markNotificationRead = async (notificationId, userId) => {
	const pool = obtenerPool();
	const result = await pool.query(
		"SELECT * FROM mark_notification_read($1, $2)",
		[notificationId, userId]
	);
	return result.rows[0];
};

const markAllNotificationsRead = async (userId) => {
	const pool = obtenerPool();
	const result = await pool.query(
		"SELECT * FROM mark_all_notifications_read($1)",
		[userId]
	);
	return result.rows[0];
};

module.exports = {
	getNotifications,
	markNotificationRead,
	markAllNotificationsRead,
};
