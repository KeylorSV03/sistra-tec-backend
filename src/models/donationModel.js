const { obtenerPool } = require("../config/dbConfig");

const createDonation = async (givingId, itemName, description, quantity, unit, imageUrl) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM create_donation($1, $2, $3, $4, $5, $6)",
        [givingId, itemName, description, quantity, unit, imageUrl]
    );
    return result.rows[0];
};

const getDonations = async (userId, statusId, dateFrom, dateTo, search, order, limit, offset) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM get_donations($1, $2, $3, $4, $5, $6, $7, $8)",
        [userId, statusId ?? null, dateFrom ?? null, dateTo ?? null, search ?? null, order ?? "DESC", limit ?? 20, offset ?? 0]
    );
    return result.rows;
};

const getDonationById = async (donationId) => {
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

module.exports = { createDonation, getDonations, getDonationById, updateDonationStatus };
