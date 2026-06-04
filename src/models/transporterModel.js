const { obtenerPool } = require("../config/dbConfig");

const getTransporterDeliveries = async (transporterId, statusId, dateFrom, dateTo, search, order, limit, offset) => {
	const pool = obtenerPool();
	const result = await pool.query(
		"SELECT * FROM get_transporter_deliveries($1, $2, $3, $4, $5, $6, $7, $8)",
		[transporterId, statusId ?? null, dateFrom ?? null, dateTo ?? null, search ?? null, order ?? "DESC", limit ?? 20, offset ?? 0]
	);
	return result.rows;
};

const getTransporterDeliveryDetail = async (donationId, transporterId = null) => {
	const pool = obtenerPool();
	const result = await pool.query(
		`
		SELECT
			dv.id AS delivery_id,
			dv.delivery_type,
			dv.collection_address,
			dv.destination,
			dv.assigned_at,
			dv.shipped_at,
			dv.delivered_at,
			d.id AS donation_id,
			d.item_name,
			d.description,
			d.quantity,
			d.unit,
			d.image_url,
			d.status_id,
			ds.name AS status_name,
			donor.name AS donor_name,
			donor.email AS donor_email,
			donor.phone_number AS donor_phone,
			driver.id AS driver_id,
			driver.name AS driver_name,
			driver.email AS driver_email
		FROM "delivery" dv
		JOIN "donation" d ON d.id = dv.donation_id
		JOIN "donation_status" ds ON ds.id = d.status_id
		JOIN "user" donor ON donor.id = d.giving_id
		JOIN "user" driver ON driver.id = dv.donation_driver_id
		WHERE d.id = $1
		  AND ($2::integer IS NULL OR dv.donation_driver_id = $2)
		ORDER BY dv.assigned_at DESC
		LIMIT 1
		`,
		[donationId, transporterId]
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
