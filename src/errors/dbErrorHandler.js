const AppError = require("./AppError");

const DB_ERROR_MAP = {
    EMAIL_ALREADY_EXISTS:       409,
    USER_NOT_FOUND:             404,
    DONATION_NOT_FOUND:         404,
    DELIVERY_NOT_FOUND:         404,
    NOTIFICATION_NOT_FOUND:     404,
    UNAUTHORIZED:               403,
    INVALID_ROL:                400,
    INVALID_ORDER:              400,
    INVALID_DELIVERY_TYPE:      400,
    HAS_ACTIVE_DELIVERIES:      409,
    TRANSPORTER_NOT_AVAILABLE:  409,
    RESET_CODE_NOT_FOUND:       400,
    ALREADY_PICKED_UP:          409,
    NOT_PICKED_UP:              400,
    ALREADY_DELIVERED:          409,
    TEMPLATE_NOT_FOUND:         500,
    EVENT_TYPE_NOT_FOUND:       500,
    STATUS_NOT_FOUND:           500,
    ROL_NOT_FOUND:              500,
};

const handleDbError = (error) => {
    const raw = error.message || "";
    const separatorIndex = raw.indexOf(": ");

    if (separatorIndex === -1) {
        return new AppError(raw || "Error interno del servidor.", 500);
    }

    const code = raw.substring(0, separatorIndex);
    const message = raw.substring(separatorIndex + 2);
    const statusCode = DB_ERROR_MAP[code] || 500;

    return new AppError(message, statusCode, code);
};

module.exports = { handleDbError };
