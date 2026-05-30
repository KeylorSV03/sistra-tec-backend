const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Documentacion API
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
const authRoutes         = require("./routes/authRoutes");
const donationRoutes     = require("./routes/donationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/auth",          authRoutes);
app.use("/api/donations",     donationRoutes);
app.use("/api/notifications", notificationRoutes);
const adminRoutes        = require("./routes/adminRoutes");
const transporterRoutes  = require("./routes/transporterRoutes");
app.use("/api/admin",         adminRoutes);
app.use("/api/transporter",   transporterRoutes);

// Manejo de errores (siempre al final)
app.use(errorHandler);

module.exports = app;
