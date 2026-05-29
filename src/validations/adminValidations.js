const Joi = require("joi");

const createTransporterSchema = Joi.object({
    name: Joi.string().trim().min(2).max(128).required().messages({
        "string.min": "El nombre debe tener al menos 2 caracteres.",
        "any.required": "El nombre es obligatorio.",
    }),
    email: Joi.string().trim().email().max(256).required().messages({
        "string.email": "El correo electrónico no es válido.",
        "any.required": "El correo electrónico es obligatorio.",
    }),
    password: Joi.string().min(8).max(128).required().messages({
        "string.min": "La contraseña debe tener al menos 8 caracteres.",
        "any.required": "La contraseña es obligatoria.",
    }),
    phone_number: Joi.string().trim().max(16).optional().allow("", null),
});

const getTransportersQuerySchema = Joi.object({
    search: Joi.string().trim().empty("").optional(),
    limit:  Joi.number().integer().min(1).max(100).empty("").default(20),
    offset: Joi.number().integer().min(0).empty("").default(0),
});

const transporterIdSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        "number.base":     "El ID debe ser un número.",
        "number.positive": "El ID debe ser positivo.",
        "any.required":    "El ID es obligatorio.",
    }),
});

const updateTransporterStatusSchema = Joi.object({
    is_active: Joi.boolean().required().messages({
        "boolean.base": "El estado debe ser true o false.",
        "any.required": "El estado es obligatorio.",
    }),
});

const createDeliverySchema = Joi.object({
    donation_id:        Joi.number().integer().positive().required().messages({
        "any.required": "El ID de la donación es obligatorio.",
    }),
    transporter_id:     Joi.number().integer().positive().required().messages({
        "any.required": "El ID del transportista es obligatorio.",
    }),
    collection_address: Joi.string().trim().min(5).required().messages({
        "string.min":   "La dirección de recolección debe tener al menos 5 caracteres.",
        "any.required": "La dirección de recolección es obligatoria.",
    }),
    destination:        Joi.string().trim().min(5).required().messages({
        "string.min":   "El destino debe tener al menos 5 caracteres.",
        "any.required": "El destino es obligatorio.",
    }),
    delivery_type:      Joi.string().valid("pickup", "dropoff").required().messages({
        "any.only":     "El tipo de entrega debe ser 'pickup' o 'dropoff'.",
        "any.required": "El tipo de entrega es obligatorio.",
    }),
});

const getDeliveriesQuerySchema = Joi.object({
    status_id:      Joi.number().integer().positive().empty("").optional(),
    transporter_id: Joi.number().integer().positive().empty("").optional(),
    date_from:      Joi.string().isoDate().empty("").optional(),
    date_to:        Joi.string().isoDate().empty("").optional(),
    search:         Joi.string().trim().empty("").optional(),
    order:          Joi.string().valid("ASC", "DESC").empty("").default("DESC"),
    limit:          Joi.number().integer().min(1).max(100).empty("").default(20),
    offset:         Joi.number().integer().min(0).empty("").default(0),
});

module.exports = {
    createTransporterSchema,
    getTransportersQuerySchema,
    transporterIdSchema,
    updateTransporterStatusSchema,
    createDeliverySchema,
    getDeliveriesQuerySchema,
};
