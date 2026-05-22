const errorHandler = (err, req, res, next) => {
    console.error(err);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Error inesperado";
    const errorCode = err.errorCode || null;

    res.status(statusCode).json({ status: "error", message, errorCode });
};

module.exports = { errorHandler };
