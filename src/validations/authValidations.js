const Joi = require("joi");

const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(128).required().messages({
        "string.min": "El nombre debe tener al menos 2 caracteres.",
        "string.max": "El nombre no puede superar 128 caracteres.",
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

const loginSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        "string.email": "El correo electrónico no es válido.",
        "any.required": "El correo electrónico es obligatorio.",
    }),
    password: Joi.string().required().messages({
        "any.required": "La contraseña es obligatoria.",
    }),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        "string.email": "El correo electrónico no es válido.",
        "any.required": "El correo electrónico es obligatorio.",
    }),
});

const verifyResetCodeSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        "string.email": "El correo electrónico no es válido.",
        "any.required": "El correo electrónico es obligatorio.",
    }),
    code: Joi.string().pattern(/^\d{6}$/).required().messages({
        "string.pattern.base": "El código debe tener exactamente 6 dígitos.",
        "any.required": "El código es obligatorio.",
    }),
});

const resetPasswordSchema = Joi.object({
    new_password: Joi.string().min(8).max(128).required().messages({
        "string.min": "La contraseña debe tener al menos 8 caracteres.",
        "any.required": "La nueva contraseña es obligatoria.",
    }),
});

const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(2).max(128).optional().messages({
        "string.min": "El nombre debe tener al menos 2 caracteres.",
        "string.max": "El nombre no puede superar 128 caracteres.",
    }),
    phone_number: Joi.string().trim().max(16).optional().allow("", null),
});

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    verifyResetCodeSchema,
    resetPasswordSchema,
    updateProfileSchema,
};
