require("dotenv").config();
const app = require("./app");
const { conectarBD } = require("./config/dbConfig");

const PORT = process.env.PORT || 3000;

conectarBD()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor iniciado en puerto ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Error conectando a la BD:", err);
        process.exit(1);
    });
