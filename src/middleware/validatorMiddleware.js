const AppError = require("../errors/AppError");

const validarDatos = (schemas) => {
    return (req, res, next) => {
        try {
            if (schemas.body) {
                const { error, value } = schemas.body.validate(req.body, {
                    abortEarly: false,
                    stripUnknown: true,
                });
                if (error) {
                    const mensaje = error.details.map((d) => d.message).join(", ");
                    throw new AppError(mensaje, 400);
                }
                req.body = value;
            }

            if (schemas.params) {
                const { error, value } = schemas.params.validate(req.params, {
                    abortEarly: false,
                });
                if (error) {
                    const mensaje = error.details.map((d) => d.message).join(", ");
                    throw new AppError(mensaje, 400);
                }
                req.params = value;
            }

            if (schemas.query) {
                const cleanQuery = Object.fromEntries(
                    Object.entries(req.query).filter(([, v]) => v !== "")
                );
                const { error, value } = schemas.query.validate(cleanQuery, {
                    abortEarly: false,
                });
                if (error) {
                    const mensaje = error.details.map((d) => d.message).join(", ");
                    throw new AppError(mensaje, 400);
                }
                req.query = value;
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

module.exports = { validarDatos };
