const { obtenerPool } = require("../config/dbConfig");

const getAdmins = async () => {
    const pool = obtenerPool();
    const result = await pool.query("SELECT * FROM get_admins()");
    return result.rows;
};

module.exports = { getAdmins };
