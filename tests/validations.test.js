const {
	registerSchema,
	loginSchema,
	forgotPasswordSchema,
	verifyResetCodeSchema,
	resetPasswordSchema,
	updateProfileSchema,
} = require("../src/validations/authValidations");

const {
	createTransporterSchema,
	getTransportersQuerySchema,
	transporterIdSchema,
	updateTransporterStatusSchema,
	createDeliverySchema,
	getDeliveriesQuerySchema,
} = require("../src/validations/adminValidations");

const {
	createDonationSchema,
	getDonationsQuerySchema,
	donationIdSchema,
	updateStatusSchema,
} = require("../src/validations/donationValidations");

const {
	getTransporterDeliveriesQuerySchema,
	deliveryIdSchema,
} = require("../src/validations/transporterValidations");

const {
	getNotificationsSchema,
	markNotificationReadSchema,
} = require("../src/validations/notificationValidations");

describe("Validations", () => {
	describe("Auth Validations", () => {
		it("should validate register schema with valid data", () => {
			const data = {
				name: "John Doe",
				email: "john@example.com",
				password: "password123",
				phone_number: "87654321",
			};

			const { error, value } = registerSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});

		it("should reject register with invalid email", () => {
			const data = {
				name: "John Doe",
				email: "invalid-email",
				password: "password123",
			};

			const { error } = registerSchema.validate(data);

			expect(error).toBeDefined();
			expect(error.details[0].message).toContain("no es válido");
		});

		it("should reject register with short password", () => {
			const data = {
				name: "John Doe",
				email: "john@example.com",
				password: "short",
			};

			const { error } = registerSchema.validate(data);

			expect(error).toBeDefined();
			expect(error.details[0].message).toContain("al menos 8");
		});

		it("should reject register with short name", () => {
			const data = {
				name: "J",
				email: "john@example.com",
				password: "password123",
			};

			const { error } = registerSchema.validate(data);

			expect(error).toBeDefined();
			expect(error.details[0].message).toContain("al menos 2");
		});

		it("should validate login schema with valid data", () => {
			const data = {
				email: "john@example.com",
				password: "password123",
			};

			const { error, value } = loginSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});

		it("should reject login with missing email", () => {
			const data = {
				password: "password123",
			};

			const { error } = loginSchema.validate(data);

			expect(error).toBeDefined();
		});

		it("should validate forgot password schema", () => {
			const data = {
				email: "john@example.com",
			};

			const { error, value } = forgotPasswordSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});

		it("should validate verify reset code schema with valid code", () => {
			const data = {
				email: "john@example.com",
				code: "123456",
			};

			const { error, value } = verifyResetCodeSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});

		it("should reject verify reset code with invalid code format", () => {
			const data = {
				email: "john@example.com",
				code: "12345",
			};

			const { error } = verifyResetCodeSchema.validate(data);

			expect(error).toBeDefined();
			expect(error.details[0].message).toContain("6 dígitos");
		});

		it("should validate reset password schema", () => {
			const data = {
				new_password: "newpassword123",
			};

			const { error, value } = resetPasswordSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});

		it("should validate update profile schema", () => {
			const data = {
				name: "Jane Doe",
				phone_number: "98765432",
			};

			const { error, value } = updateProfileSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});

		it("should allow partial update profile data", () => {
			const data = {
				name: "Jane Doe",
			};

			const { error, value } = updateProfileSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});
	});

	describe("Admin Validations", () => {
		it("should validate create transporter schema", () => {
			const data = {
				name: "Carlos",
				email: "carlos@example.com",
				password: "password123",
				phone_number: "87654321",
			};

			const { error, value } = createTransporterSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});

		it("should reject create transporter with invalid email", () => {
			const data = {
				name: "Carlos",
				email: "invalid",
				password: "password123",
			};

			const { error } = createTransporterSchema.validate(data);

			expect(error).toBeDefined();
		});

		it("should validate get transporters query schema", () => {
			const data = {
				search: "Carlos",
				limit: 50,
				offset: 0,
			};

			const { error } = getTransportersQuerySchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should validate update transporter status schema", () => {
			const data = {
				is_active: true,
			};

			const { error, value } = updateTransporterStatusSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});

		it("should reject update transporter status with non-boolean", () => {
			const data = {
				is_active: "invalid",
			};

			const { error } = updateTransporterStatusSchema.validate(data);

			expect(error).toBeDefined();
		});

		it("should validate create delivery schema", () => {
			const data = {
				donation_id: 10,
				transporter_id: 5,
				collection_address: "Calle Principal 123",
				destination: "Centro de Acopio",
				delivery_type: "pickup",
			};

			const { error, value } = createDeliverySchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});

		it("should reject create delivery with invalid delivery_type", () => {
			const data = {
				donation_id: 10,
				transporter_id: 5,
				collection_address: "Calle",
				destination: "Centro",
				delivery_type: "invalid",
			};

			const { error } = createDeliverySchema.validate(data);

			expect(error).toBeDefined();
			expect(error.details[0].message).toContain("pickup");
		});

		it("should validate get deliveries query schema", () => {
			const data = {
				status_id: 2,
				transporter_id: 5,
				date_from: "2026-01-01",
				date_to: "2026-12-31",
				search: "Arroz",
				order: "ASC",
				limit: 50,
				offset: 0,
			};

			const { error } = getDeliveriesQuerySchema.validate(data);

			expect(error).toBeUndefined();
		});
	});

	describe("Donation Validations", () => {
		it("should validate create donation schema", () => {
			const data = {
				item_name: "Arroz",
				description: "Arroz integral",
				quantity: 10,
				unit: "kg",
			};

			const { error, value } = createDonationSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});

		it("should allow create donation without description", () => {
			const data = {
				item_name: "Frijoles",
				quantity: 5,
				unit: "kg",
			};

			const { error, value } = createDonationSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value.description).toBeUndefined();
		});

		it("should reject create donation with invalid quantity", () => {
			const data = {
				item_name: "Arroz",
				quantity: "invalid",
				unit: "kg",
			};

			const { error } = createDonationSchema.validate(data);

			expect(error).toBeDefined();
		});

		it("should validate get donations schema", () => {
			const data = {
				status_id: "1",
				date_from: "2026-01-01",
				date_to: "2026-12-31",
				search: "Arroz",
				order: "ASC",
				limit: "50",
				offset: "0",
			};

			const { error } = getDonationsQuerySchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should validate update donation status schema", () => {
			const data = {
				status_id: 2,
			};

			const { error, value } = updateStatusSchema.validate(data);

			expect(error).toBeUndefined();
			expect(value).toEqual(data);
		});
	});

	describe("Transporter Validations", () => {
		it("should validate get transporter deliveries query schema", () => {
			const data = {
				status_id: 2,
				date_from: "2026-01-01",
				date_to: "2026-12-31",
				search: "Arroz",
				order: "DESC",
				limit: 20,
				offset: 0,
			};

			const { error } = getTransporterDeliveriesQuerySchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should validate delivery id schema", () => {
			const data = {
				id: 1,
			};

			const { error } = deliveryIdSchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should reject invalid delivery id", () => {
			const data = {
				id: "invalid",
			};

			const { error } = deliveryIdSchema.validate(data);

			expect(error).toBeDefined();
			expect(error.details[0].message).toContain("número");
		});

		it("should reject negative delivery id", () => {
			const data = {
				id: -1,
			};

			const { error } = deliveryIdSchema.validate(data);

			expect(error).toBeDefined();
			expect(error.details[0].message).toContain("positivo");
		});

		it("should allow all optional fields in get deliveries query", () => {
			const data = {};

			const { error } = getTransporterDeliveriesQuerySchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should reject invalid order value", () => {
			const data = {
				order: "INVALID",
			};

			const { error } = getTransporterDeliveriesQuerySchema.validate(data);

			expect(error).toBeDefined();
		});

		it("should default order to DESC", () => {
			const data = {};

			const { value } = getTransporterDeliveriesQuerySchema.validate(data);

			expect(value.order).toBe("DESC");
		});

		it("should default limit to 20", () => {
			const data = {};

			const { value } = getTransporterDeliveriesQuerySchema.validate(data);

			expect(value.limit).toBe(20);
		});

		it("should default offset to 0", () => {
			const data = {};

			const { value } = getTransporterDeliveriesQuerySchema.validate(data);

			expect(value.offset).toBe(0);
		});
	});

	describe("Notification Validations", () => {
		it("should validate get notifications schema with is_read true", () => {
			const data = {
				is_read: "true",
				limit: "20",
				offset: "0",
			};

			const { error } = getNotificationsSchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should validate get notifications schema with is_read false", () => {
			const data = {
				is_read: "false",
			};

			const { error } = getNotificationsSchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should allow partial query parameters", () => {
			const data = {
				limit: "50",
			};

			const { error } = getNotificationsSchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should reject invalid is_read value", () => {
			const data = {
				is_read: "maybe",
			};

			const { error } = getNotificationsSchema.validate(data);

			expect(error).toBeDefined();
		});

		it("should validate mark notification read schema", () => {
			const data = {
				id: "1",
			};

			const { error } = markNotificationReadSchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should reject invalid id format in mark notification", () => {
			const data = {
				id: "invalid",
			};

			const { error } = markNotificationReadSchema.validate(data);

			expect(error).toBeDefined();
			expect(error.details[0].message).toContain("número");
		});

		it("should allow empty optional fields", () => {
			const data = {};

			const { error } = getNotificationsSchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should reject non-numeric limit", () => {
			const data = {
				limit: "abc",
			};

			const { error } = getNotificationsSchema.validate(data);

			expect(error).toBeDefined();
		});
	});

	describe("Validation Edge Cases", () => {
		it("should trim whitespace in register name", () => {
			const data = {
				name: "  John Doe  ",
				email: "john@example.com",
				password: "password123",
			};

			const { value } = registerSchema.validate(data);

			expect(value.name).toBe("John Doe");
		});

		it("should accept empty string for optional phone_number", () => {
			const data = {
				name: "John Doe",
				email: "john@example.com",
				password: "password123",
				phone_number: "",
			};

			const { error } = registerSchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should accept null for optional phone_number", () => {
			const data = {
				name: "John Doe",
				email: "john@example.com",
				password: "password123",
				phone_number: null,
			};

			const { error } = registerSchema.validate(data);

			expect(error).toBeUndefined();
		});

		it("should reject name exceeding max length", () => {
			const data = {
				name: "A".repeat(129),
				email: "john@example.com",
				password: "password123",
			};

			const { error } = registerSchema.validate(data);

			expect(error).toBeDefined();
			expect(error.details[0].message).toContain("no puede superar");
		});

		it("should reject email exceeding max length", () => {
			const data = {
				name: "John Doe",
				email: "a".repeat(250) + "@example.com",
				password: "password123",
			};

			const { error } = registerSchema.validate(data);

			expect(error).toBeDefined();
		});

		it("should reject password exceeding max length", () => {
			const data = {
				name: "John Doe",
				email: "john@example.com",
				password: "a".repeat(129),
			};

			const { error } = registerSchema.validate(data);

			expect(error).toBeDefined();
		});
	});
});
