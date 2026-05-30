const { obtenerPool } = require("../config/dbConfig");

const getTransporterDeliveries = async (transporterId, statusId, dateFrom, dateTo, search, order, limit, offset) => {
	const pool = obtenerPool();
	const result = await pool.query(
		"SELECT * FROM get_transporter_deliveries($1, $2, $3, $4, $5, $6, $7, $8)",
		[transporterId, statusId ?? null, dateFrom ?? null, dateTo ?? null, search ?? null, order ?? "DESC", limit ?? 20, offset ?? 0]
	);
	return result.rows;
};

const getTransporterDeliveryDetail = async (donationId) => {
	const pool = obtenerPool();
	const result = await pool.query(
		"SELECT * FROM get_donation_by_id($1)",
		[donationId]
	);
	return result.rows[0];
};

const updateDonationStatus = async (donationId, statusId, rolName) => {
	const pool = obtenerPool();
	const result = await pool.query(
		"SELECT * FROM update_donation_status($1, $2, $3)",
		[donationId, statusId, rolName]
	);
	return result.rows[0];
};

module.exports = { getTransporterDeliveries, getTransporterDeliveryDetail, updateDonationStatus };
