const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Rutas
// app.use("/api", ejemploRoutes);

// Manejo de errores (siempre al final)
app.use(errorHandler);

module.exports = app;
