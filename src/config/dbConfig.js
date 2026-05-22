const { Pool } = require("pg");

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
};

let pool = null;

const conectarBD = async () => {
    pool = new Pool(dbConfig);
    await pool.connect();
    console.log("Conexion exitosa a PostgreSQL");
};

const obtenerPool = () => {
    if (!pool) throw new Error("BD no conectada. Ejecuta conectarBD primero.");
    return pool;
};

module.exports = { conectarBD, obtenerPool };
