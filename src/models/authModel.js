const { obtenerPool } = require("../config/dbConfig");

const createUser = async (name, email, passwordHash, rolId, phoneNumber = null) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM create_user($1, $2, $3, $4, $5)",
        [name, email, passwordHash, rolId, phoneNumber]
    );
    return result.rows[0];
};

const getUserByEmail = async (email) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM get_user_by_email($1)",
        [email]
    );
    return result.rows[0] ?? null;
};

const getUserById = async (userId) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM get_user_by_id($1)",
        [userId]
    );
    return result.rows[0];
};

const updateUser = async (userId, name = null, phoneNumber = null, profilePhotoUrl = null) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM update_user($1, $2, $3, $4)",
        [userId, name, phoneNumber, profilePhotoUrl]
    );
    return result.rows[0];
};

const updateUserPassword = async (userId, passwordHash) => {
    const pool = obtenerPool();
    await pool.query(
        "SELECT update_user_password($1, $2)",
        [userId, passwordHash]
    );
};

const createResetCode = async (userId, code) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM create_reset_code($1, $2)",
        [userId, code]
    );
    return result.rows[0];
};

const getResetCode = async (userId, code) => {
    const pool = obtenerPool();
    const result = await pool.query(
        "SELECT * FROM get_reset_code($1, $2)",
        [userId, code]
    );
    return result.rows[0] ?? null;
};

const useResetCode = async (userId, code) => {
    const pool = obtenerPool();
    await pool.query(
        "SELECT use_reset_code($1, $2)",
        [userId, code]
    );
};

module.exports = {
    createUser,
    getUserByEmail,
    getUserById,
    updateUser,
    updateUserPassword,
    createResetCode,
    getResetCode,
    useResetCode,
};
