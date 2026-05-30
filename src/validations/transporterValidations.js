const Joi = require("joi");

const getTransporterDeliveriesQuerySchema = Joi.object({
	status_id: Joi.number().integer().positive().empty("").optional(),
	date_from: Joi.string().isoDate().empty("").optional(),
	date_to: Joi.string().isoDate().empty("").optional(),
	search: Joi.string().trim().empty("").optional(),
	order: Joi.string().valid("ASC", "DESC").empty("").default("DESC"),
	limit: Joi.number().integer().min(1).max(100).empty("").default(20),
	offset: Joi.number().integer().min(0).empty("").default(0),
});

const deliveryIdSchema = Joi.object({
	id: Joi.number().integer().positive().required().messages({
		"number.base": "El ID debe ser un número.",
		"number.positive": "El ID debe ser un número positivo.",
		"any.required": "El ID es obligatorio.",
	}),
});

module.exports = {
	getTransporterDeliveriesQuerySchema,
	deliveryIdSchema,
};
