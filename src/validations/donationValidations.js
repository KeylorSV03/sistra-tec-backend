const Joi = require("joi");

const createDonationSchema = Joi.object({
    item_name: Joi.string().trim().min(2).max(128).required().messages({
        "string.min": "El nombre del bien debe tener al menos 2 caracteres.",
        "string.max": "El nombre del bien no puede superar 128 caracteres.",
        "any.required": "El nombre del bien es obligatorio.",
    }),
    description: Joi.string().trim().optional().allow("", null),
    quantity: Joi.number().integer().min(1).required().messages({
        "number.base": "La cantidad debe ser un número.",
        "number.integer": "La cantidad debe ser un número entero.",
        "number.min": "La cantidad debe ser al menos 1.",
        "any.required": "La cantidad es obligatoria.",
    }),
    unit: Joi.string().trim().max(32).required().messages({
        "string.max": "La unidad no puede superar 32 caracteres.",
        "any.required": "La unidad es obligatoria.",
    }),
});

const getDonationsQuerySchema = Joi.object({
    status_id: Joi.number().integer().positive().empty("").optional(),
    date_from: Joi.string().isoDate().empty("").optional(),
    date_to:   Joi.string().isoDate().empty("").optional(),
    search:    Joi.string().trim().empty("").optional(),
    order:     Joi.string().valid("ASC", "DESC").empty("").default("DESC"),
    limit:     Joi.number().integer().min(1).max(100).empty("").default(20),
    offset:    Joi.number().integer().min(0).empty("").default(0),
});

const donationIdSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        "number.base": "El ID debe ser un número.",
        "number.positive": "El ID debe ser un número positivo.",
        "any.required": "El ID es obligatorio.",
    }),
});

const updateStatusSchema = Joi.object({
    status_id: Joi.number().integer().positive().required().messages({
        "number.base": "El estado debe ser un número.",
        "any.required": "El estado es obligatorio.",
    }),
});

module.exports = {
    createDonationSchema,
    getDonationsQuerySchema,
    donationIdSchema,
    updateStatusSchema,
};
