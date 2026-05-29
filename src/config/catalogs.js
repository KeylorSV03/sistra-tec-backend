const { obtenerPool } = require("./dbConfig");

const ROLES = {};
const STATUSES = {};

const loadCatalogs = async () => {
    const pool = obtenerPool();

    const [roles, statuses] = await Promise.all([
        pool.query("SELECT * FROM get_roles()"),
        pool.query("SELECT * FROM get_donation_statuses()"),
    ]);

    roles.rows.forEach((r) => (ROLES[r.name] = r.id));
    statuses.rows.forEach((s) => (STATUSES[s.name] = s.id));

    console.log("Catálogos cargados correctamente");
};

module.exports = { ROLES, STATUSES, loadCatalogs };
