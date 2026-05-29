const { obtenerPool } = require("../config/dbConfig");

const createTransporter = async (name, email, passwordHash, phoneNumber = null) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM create_transporter($1, $2, $3, $4)",
        [name, email, passwordHash, phoneNumber]
    );
    return result.rows[0];
};

const getTransporters = async (search, limit, offset) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM get_transporters($1, $2, $3)",
        [search, limit, offset]
    );
    return result.rows;
};

const updateTransporterStatus = async (transporterId, isActive) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM update_transporter_status($1, $2)",
        [transporterId, isActive]
    );
    return result.rows[0];
};

const createDelivery = async (donationId, transporterId, assignedBy, collectionAddress, destination, deliveryType) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM create_delivery($1, $2, $3, $4, $5, $6)",
        [donationId, transporterId, assignedBy, collectionAddress, destination, deliveryType]
    );
    return result.rows[0];
};

const getDeliveries = async (statusId, transporterId, dateFrom, dateTo, search, order, limit, offset) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM get_deliveries($1, $2, $3, $4, $5, $6, $7, $8)",
        [statusId, transporterId, dateFrom, dateTo, search, order, limit, offset]
    );
    return result.rows;
};

const getTransporterDeliveries = async (transporterId, statusId, dateFrom, dateTo, search, order, limit, offset) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM get_transporter_deliveries($1, $2, $3, $4, $5, $6, $7, $8)",
        [transporterId, statusId, dateFrom, dateTo, search, order, limit, offset]
    );
    return result.rows;
};

module.exports = {
    createTransporter,
    getTransporters,
    updateTransporterStatus,
    createDelivery,
    getDeliveries,
    getTransporterDeliveries,
};
