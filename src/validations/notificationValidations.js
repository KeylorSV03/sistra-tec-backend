const Joi = require("joi");

const getNotificationsSchema = Joi.object({
	is_read: Joi.string().valid("true", "false").optional().messages({
		"any.only": "El parámetro is_read debe ser 'true' o 'false'.",
	}),
	limit: Joi.string().pattern(/^\d+$/).optional().messages({
		"string.pattern.base": "El límite debe ser un número entero positivo.",
	}),
	offset: Joi.string().pattern(/^\d+$/).optional().messages({
		"string.pattern.base": "El offset debe ser un número entero no negativo.",
	}),
});

const markNotificationReadSchema = Joi.object({
	id: Joi.string().pattern(/^\d+$/).required().messages({
		"string.pattern.base": "El ID debe ser un número entero positivo.",
		"any.required": "El ID es obligatorio.",
	}),
});

module.exports = {
	getNotificationsSchema,
	markNotificationReadSchema,
};
