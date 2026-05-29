const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "SISTRA-TEC API",
            version: "1.0.0",
            description: "API del Sistema de Trazabilidad de Donaciones — SISTRA-TEC",
        },
        servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
