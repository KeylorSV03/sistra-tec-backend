require("dotenv").config();
const app = require("./app");
const { conectarBD } = require("./config/dbConfig");
const { loadCatalogs } = require("./config/catalogs");

const PORT = process.env.PORT || 3000;

conectarBD()
    .then(() => loadCatalogs())
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor iniciado en puerto ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Error al iniciar el servidor:", err);
        process.exit(1);
    });
