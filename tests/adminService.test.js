const adminService = require("../src/services/adminService");
const adminModel = require("../src/models/adminModel");
const donationModel = require("../src/models/donationModel");
const { hashPassword } = require("../src/utils/hashUtil");
const { toInt, toStr, toOrder } = require("../src/utils/queryUtil");
const { dispatchNotification } = require("../src/utils/notificationUtil");
const { sendEmail } = require("../src/utils/mailerUtil");
const { handleDbError } = require("../src/errors/dbErrorHandler");
const AppError = require("../src/errors/AppError");

jest.mock("../src/models/adminModel");
jest.mock("../src/models/donationModel");
jest.mock("../src/utils/hashUtil");
jest.mock("../src/utils/queryUtil");
jest.mock("../src/utils/notificationUtil");
jest.mock("../src/utils/mailerUtil");
jest.mock("../src/errors/dbErrorHandler");

describe("Admin Service", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("createTransporter", () => {
		it("should create transporter successfully", async () => {
			const adminId = 1;
			const input = {
				name: "Carlos Rodriguez",
				email: "carlos@example.com",
				password: "password123",
				phone_number: "87654321",
			};

			const mockHashedPassword = "hashed_password_123";
			const mockTransporter = {
				id: 5,
				name: "Carlos Rodriguez",
				email: "carlos@example.com",
				password: mockHashedPassword,
				phone_number: "87654321",
				profile_photo_url: null,
				is_active: true,
			};

			hashPassword.mockResolvedValue(mockHashedPassword);
			adminModel.createTransporter.mockResolvedValue(mockTransporter);
			dispatchNotification.mockResolvedValue(true);
			sendEmail.mockResolvedValue(true);

			const result = await adminService.createTransporter(adminId, input);

			expect(result).toEqual({
				id: 5,
				name: "Carlos Rodriguez",
				email: "carlos@example.com",
				phoneNumber: "87654321",
				profilePhotoUrl: null,
				isActive: true,
				activeAssignments: undefined,
			});
			expect(hashPassword).toHaveBeenCalledWith("password123");
			expect(adminModel.createTransporter).toHaveBeenCalledWith(
				"Carlos Rodriguez",
				"carlos@example.com",
				mockHashedPassword,
				"87654321"
			);
			expect(dispatchNotification).toHaveBeenCalledWith(
				5,
				"CUENTA_CREADA_TRANSPORTISTA",
				{ user_name: "Carlos Rodriguez", email: "carlos@example.com" }
			);
			expect(dispatchNotification).toHaveBeenCalledWith(
				adminId,
				"CUENTA_CREADA_TRANSPORTISTA_ADMIN",
				{ user_name: "Carlos Rodriguez", email: "carlos@example.com" }
			);
		});

		it("should create transporter without phone_number", async () => {
			const adminId = 1;
			const input = {
				name: "Jane Transporter",
				email: "jane@example.com",
				password: "password123",
			};

			const mockHashedPassword = "hashed_password_456";
			const mockTransporter = {
				id: 6,
				name: "Jane Transporter",
				email: "jane@example.com",
				password: mockHashedPassword,
				phone_number: null,
				profile_photo_url: null,
				is_active: true,
			};

			hashPassword.mockResolvedValue(mockHashedPassword);
			adminModel.createTransporter.mockResolvedValue(mockTransporter);
			dispatchNotification.mockResolvedValue(true);
			sendEmail.mockResolvedValue(true);

			const result = await adminService.createTransporter(adminId, input);

			expect(result.phoneNumber).toBeNull();
			expect(adminModel.createTransporter).toHaveBeenCalledWith(
				"Jane Transporter",
				"jane@example.com",
				mockHashedPassword,
				null
			);
		});

		it("should handle database errors on transporter creation", async () => {
			const adminId = 1;
			const input = {
				name: "Carlos Rodriguez",
				email: "carlos@example.com",
				password: "password123",
			};

			const mockError = new Error("EMAIL_ALREADY_EXISTS: Email ya existe");
			const mockAppError = new AppError("El email ya está registrado.", 409);

			hashPassword.mockResolvedValue("hashed_password");
			adminModel.createTransporter.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await adminService.createTransporter(adminId, input);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("El email ya está registrado.");
			}
		});

		it("should send transporter account email", async () => {
			const adminId = 1;
			const input = {
				name: "Carlos",
				email: "carlos@example.com",
				password: "myPassword123",
			};

			const mockTransporter = {
				id: 5,
				name: "Carlos",
				email: "carlos@example.com",
				password: "hashed",
				phone_number: null,
				profile_photo_url: null,
				is_active: true,
			};

			hashPassword.mockResolvedValue("hashed");
			adminModel.createTransporter.mockResolvedValue(mockTransporter);
			dispatchNotification.mockResolvedValue(true);
			sendEmail.mockResolvedValue(true);

			await adminService.createTransporter(adminId, input);

			expect(sendEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					to: "carlos@example.com",
					subject: expect.stringContaining("transportista"),
				})
			);
		});

		it("should dispatch notification to admin if adminId provided", async () => {
			const adminId = 1;
			const input = {
				name: "Carlos",
				email: "carlos@example.com",
				password: "password123",
			};

			const mockTransporter = {
				id: 5,
				name: "Carlos",
				email: "carlos@example.com",
				phone_number: null,
				profile_photo_url: null,
				is_active: true,
			};

			hashPassword.mockResolvedValue("hashed");
			adminModel.createTransporter.mockResolvedValue(mockTransporter);
			dispatchNotification.mockResolvedValue(true);
			sendEmail.mockResolvedValue(true);

			await adminService.createTransporter(adminId, input);

			const calls = dispatchNotification.mock.calls;
			expect(calls.length).toBe(2);
			expect(calls[1][0]).toBe(adminId);
		});

		it("should handle email send failure gracefully", async () => {
			const adminId = 1;
			const input = {
				name: "Carlos",
				email: "carlos@example.com",
				password: "password123",
			};

			const mockTransporter = {
				id: 5,
				name: "Carlos",
				email: "carlos@example.com",
				phone_number: null,
				profile_photo_url: null,
				is_active: true,
			};

			hashPassword.mockResolvedValue("hashed");
			adminModel.createTransporter.mockResolvedValue(mockTransporter);
			dispatchNotification.mockResolvedValue(true);
			sendEmail.mockRejectedValue(new Error("Email service down"));

			const result = await adminService.createTransporter(adminId, input);

			expect(result).toBeDefined();
			expect(result.id).toBe(5);
		});
	});

	describe("getTransporters", () => {
		beforeEach(() => {
			toInt.mockImplementation((val, defaultVal) => (val ? parseInt(val) : defaultVal));
			toStr.mockImplementation((val) => val ?? null);
		});

		it("should return transporters with pagination metadata", async () => {
			const query = {};

			const mockTransporters = [
				{
					id: 5,
					name: "Carlos",
					email: "carlos@example.com",
					phone_number: "87654321",
					profile_photo_url: null,
					is_active: true,
					active_assignments: 3,
					total_count: 5,
				},
			];

			adminModel.getTransporters.mockResolvedValue(mockTransporters);

			const result = await adminService.getTransporters(query);

			expect(result).toEqual({
				transporters: expect.any(Array),
				totalCount: 5,
			});
			expect(adminModel.getTransporters).toHaveBeenCalledWith(null, 20, 0);
		});

		it("should filter by search", async () => {
			const query = { search: "Carlos" };

			const mockTransporters = [{ total_count: 1, active_assignments: 2 }];

			adminModel.getTransporters.mockResolvedValue(mockTransporters);

			await adminService.getTransporters(query);

			expect(adminModel.getTransporters).toHaveBeenCalledWith("Carlos", 20, 0);
		});

		it("should use custom pagination", async () => {
			const query = { limit: "50", offset: "10" };

			adminModel.getTransporters.mockResolvedValue([{ total_count: 0 }]);

			await adminService.getTransporters(query);

			expect(adminModel.getTransporters).toHaveBeenCalledWith(null, 50, 10);
		});

		it("should return empty transporters when no results", async () => {
			const query = {};

			adminModel.getTransporters.mockResolvedValue([]);

			const result = await adminService.getTransporters(query);

			expect(result).toEqual({
				transporters: [],
				totalCount: 0,
			});
		});

		it("should handle database errors", async () => {
			const query = {};

			const mockError = new Error("DB_ERROR");
			const mockAppError = new AppError("Error en BD", 500);

			adminModel.getTransporters.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await adminService.getTransporters(query);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("Error en BD");
			}
		});

		it("should include active_assignments in transporter", async () => {
			const query = {};

			const mockTransporters = [
				{
					id: 5,
					name: "Carlos",
					email: "carlos@example.com",
					active_assignments: 5,
					total_count: 1,
				},
			];

			adminModel.getTransporters.mockResolvedValue(mockTransporters);

			const result = await adminService.getTransporters(query);

			expect(result.transporters[0].activeAssignments).toBe(5);
		});
	});

	describe("updateTransporterStatus", () => {
		it("should activate transporter", async () => {
			const transporterId = 5;
			const isActive = true;

			const mockTransporter = {
				id: 5,
				name: "Carlos",
				email: "carlos@example.com",
				phone_number: "87654321",
				profile_photo_url: null,
				is_active: true,
			};

			adminModel.updateTransporterStatus.mockResolvedValue(mockTransporter);

			const result = await adminService.updateTransporterStatus(transporterId, isActive);

			expect(result).toEqual({
				id: 5,
				name: "Carlos",
				email: "carlos@example.com",
				phoneNumber: "87654321",
				profilePhotoUrl: null,
				isActive: true,
				activeAssignments: undefined,
			});
			expect(adminModel.updateTransporterStatus).toHaveBeenCalledWith(5, true);
		});

		it("should deactivate transporter", async () => {
			const transporterId = 5;
			const isActive = false;

			const mockTransporter = {
				id: 5,
				name: "Carlos",
				email: "carlos@example.com",
				is_active: false,
			};

			adminModel.updateTransporterStatus.mockResolvedValue(mockTransporter);

			const result = await adminService.updateTransporterStatus(transporterId, isActive);

			expect(result.isActive).toBe(false);
			expect(adminModel.updateTransporterStatus).toHaveBeenCalledWith(5, false);
		});

		it("should handle database errors on status update", async () => {
			const transporterId = 999;
			const isActive = true;

			const mockError = new Error("TRANSPORTER_NOT_FOUND");
			const mockAppError = new AppError("Transportista no encontrado", 404);

			adminModel.updateTransporterStatus.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await adminService.updateTransporterStatus(transporterId, isActive);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("Transportista no encontrado");
			}
		});
	});

	describe("createDelivery", () => {
		it("should create delivery successfully", async () => {
			const adminId = 1;
			const input = {
				donation_id: 10,
				transporter_id: 5,
				collection_address: "Calle Principal 123",
				destination: "Centro de Acopio",
				delivery_type: "pickup",
			};

			const mockDonation = {
				id: 10,
				item_name: "Arroz",
				quantity: 10,
				unit: "kg",
			};

			const mockDelivery = {
				delivery_id: 1,
				donation_id: 10,
				delivery_type: "pickup",
				driver_id: 5,
				item_name: "Arroz",
				quantity: 10,
				unit: "kg",
				status_id: 1,
				status_name: "Pendiente",
				assigned_at: "2026-06-05",
				shipped_at: null,
				delivered_at: null,
			};

			donationModel.getDonationById.mockResolvedValue(mockDonation);
			adminModel.createDelivery.mockResolvedValue(mockDelivery);
			dispatchNotification.mockResolvedValue(true);

			const result = await adminService.createDelivery(adminId, input);

			expect(result).toHaveProperty("deliveryId", 1);
			expect(result).toHaveProperty("deliveryType", "pickup");
			expect(donationModel.getDonationById).toHaveBeenCalledWith(10);
			expect(adminModel.createDelivery).toHaveBeenCalledWith(
				10,
				5,
				adminId,
				"Calle Principal 123",
				"Centro de Acopio",
				"pickup"
			);
			expect(dispatchNotification).toHaveBeenCalledWith(
				5,
				"ENTREGA_ASIGNADA",
				{ item_name: "Arroz" },
				10
			);
		});

		it("should handle donation not found error", async () => {
			const adminId = 1;
			const input = {
				donation_id: 999,
				transporter_id: 5,
				collection_address: "Calle",
				destination: "Centro",
				delivery_type: "pickup",
			};

			const operationalError = new AppError("Donación no encontrada", 404);
			operationalError.isOperational = true;

			donationModel.getDonationById.mockRejectedValue(operationalError);

			try {
				await adminService.createDelivery(adminId, input);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Donación no encontrada");
				expect(handleDbError).not.toHaveBeenCalled();
			}
		});

		it("should handle database errors on delivery creation", async () => {
			const adminId = 1;
			const input = {
				donation_id: 10,
				transporter_id: 5,
				collection_address: "Calle",
				destination: "Centro",
				delivery_type: "pickup",
			};

			const mockDonation = { id: 10, item_name: "Arroz" };
			const mockError = new Error("DB_ERROR");
			const mockAppError = new AppError("Error en BD", 500);

			donationModel.getDonationById.mockResolvedValue(mockDonation);
			adminModel.createDelivery.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await adminService.createDelivery(adminId, input);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("Error en BD");
			}
		});

		it("should create dropoff delivery", async () => {
			const adminId = 1;
			const input = {
				donation_id: 10,
				transporter_id: 5,
				collection_address: "Centro de Acopio",
				destination: "Beneficiario - Calle 5",
				delivery_type: "dropoff",
			};

			const mockDonation = { id: 10, item_name: "Arroz" };
			const mockDelivery = {
				delivery_id: 2,
				delivery_type: "dropoff",
				donation_id: 10,
				driver_id: 5,
			};

			donationModel.getDonationById.mockResolvedValue(mockDonation);
			adminModel.createDelivery.mockResolvedValue(mockDelivery);
			dispatchNotification.mockResolvedValue(true);

			const result = await adminService.createDelivery(adminId, input);

			expect(result.deliveryType).toBe("dropoff");
			expect(adminModel.createDelivery).toHaveBeenCalledWith(
				10,
				5,
				adminId,
				"Centro de Acopio",
				"Beneficiario - Calle 5",
				"dropoff"
			);
		});
	});

	describe("getDeliveries", () => {
		beforeEach(() => {
			toInt.mockImplementation((val, defaultVal) => (val ? parseInt(val) : defaultVal));
			toStr.mockImplementation((val) => val ?? null);
			toOrder.mockImplementation((val) => val === "ASC" ? "ASC" : "DESC");
		});

		it("should return deliveries with pagination metadata", async () => {
			const query = {};

			const mockDeliveries = [
				{
					delivery_id: 1,
					donation_id: 10,
					item_name: "Arroz",
					status_name: "Pendiente",
					total_count: 5,
				},
			];

			adminModel.getDeliveries.mockResolvedValue(mockDeliveries);

			const result = await adminService.getDeliveries(query);

			expect(result).toEqual({
				deliveries: expect.any(Array),
				totalCount: 5,
			});
			expect(adminModel.getDeliveries).toHaveBeenCalledWith(
				null,
				null,
				null,
				null,
				null,
				"DESC",
				20,
				0
			);
		});

		it("should filter by status_id", async () => {
			const query = { status_id: "2" };

			adminModel.getDeliveries.mockResolvedValue([{ total_count: 1 }]);

			await adminService.getDeliveries(query);

			expect(adminModel.getDeliveries).toHaveBeenCalledWith(
				2,
				null,
				null,
				null,
				null,
				"DESC",
				20,
				0
			);
		});

		it("should filter by transporter_id", async () => {
			const query = { transporter_id: "5" };

			adminModel.getDeliveries.mockResolvedValue([{ total_count: 2 }]);

			await adminService.getDeliveries(query);

			expect(adminModel.getDeliveries).toHaveBeenCalledWith(
				null,
				5,
				null,
				null,
				null,
				"DESC",
				20,
				0
			);
		});

		it("should filter by date range", async () => {
			const query = {
				date_from: "2026-01-01",
				date_to: "2026-12-31",
			};

			adminModel.getDeliveries.mockResolvedValue([{ total_count: 3 }]);

			await adminService.getDeliveries(query);

			expect(adminModel.getDeliveries).toHaveBeenCalledWith(
				null,
				null,
				"2026-01-01",
				"2026-12-31",
				null,
				"DESC",
				20,
				0
			);
		});

		it("should handle all filters combined", async () => {
			const query = {
				status_id: "2",
				transporter_id: "5",
				date_from: "2026-01-01",
				date_to: "2026-12-31",
				search: "Arroz",
				order: "ASC",
				limit: "50",
				offset: "10",
			};

			adminModel.getDeliveries.mockResolvedValue([{ total_count: 1 }]);

			await adminService.getDeliveries(query);

			expect(adminModel.getDeliveries).toHaveBeenCalledWith(
				2,
				5,
				"2026-01-01",
				"2026-12-31",
				"Arroz",
				"ASC",
				50,
				10
			);
		});

		it("should return empty deliveries when no results", async () => {
			const query = {};

			adminModel.getDeliveries.mockResolvedValue([]);

			const result = await adminService.getDeliveries(query);

			expect(result).toEqual({
				deliveries: [],
				totalCount: 0,
			});
		});

		it("should handle database errors", async () => {
			const query = {};

			const mockError = new Error("DB_ERROR");
			const mockAppError = new AppError("Error en BD", 500);

			adminModel.getDeliveries.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await adminService.getDeliveries(query);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("Error en BD");
			}
		});
	});

	describe("getTransporterDeliveries", () => {
		beforeEach(() => {
			toInt.mockImplementation((val, defaultVal) => (val ? parseInt(val) : defaultVal));
			toStr.mockImplementation((val) => val ?? null);
			toOrder.mockImplementation((val) => val === "ASC" ? "ASC" : "DESC");
		});

		it("should return transporter deliveries", async () => {
			const transporterId = 5;
			const query = {};

			const mockDeliveries = [
				{
					delivery_id: 1,
					donation_id: 10,
					item_name: "Arroz",
					status_name: "Pendiente",
					total_count: 3,
				},
			];

			adminModel.getTransporterDeliveries.mockResolvedValue(mockDeliveries);

			const result = await adminService.getTransporterDeliveries(transporterId, query);

			expect(result).toEqual({
				deliveries: expect.any(Array),
				totalCount: 3,
			});
			expect(adminModel.getTransporterDeliveries).toHaveBeenCalledWith(
				5,
				null,
				null,
				null,
				null,
				"DESC",
				20,
				0
			);
		});

		it("should filter by status_id", async () => {
			const transporterId = 5;
			const query = { status_id: "2" };

			adminModel.getTransporterDeliveries.mockResolvedValue([{ total_count: 1 }]);

			await adminService.getTransporterDeliveries(transporterId, query);

			expect(adminModel.getTransporterDeliveries).toHaveBeenCalledWith(
				5,
				2,
				null,
				null,
				null,
				"DESC",
				20,
				0
			);
		});

		it("should filter by date range", async () => {
			const transporterId = 5;
			const query = {
				date_from: "2026-01-01",
				date_to: "2026-12-31",
			};

			adminModel.getTransporterDeliveries.mockResolvedValue([{ total_count: 2 }]);

			await adminService.getTransporterDeliveries(transporterId, query);

			expect(adminModel.getTransporterDeliveries).toHaveBeenCalledWith(
				5,
				null,
				"2026-01-01",
				"2026-12-31",
				null,
				"DESC",
				20,
				0
			);
		});

		it("should return empty deliveries when no results", async () => {
			const transporterId = 5;
			const query = {};

			adminModel.getTransporterDeliveries.mockResolvedValue([]);

			const result = await adminService.getTransporterDeliveries(transporterId, query);

			expect(result).toEqual({
				deliveries: [],
				totalCount: 0,
			});
		});

		it("should handle database errors", async () => {
			const transporterId = 5;
			const query = {};

			const mockError = new Error("DB_ERROR");
			const mockAppError = new AppError("Error en BD", 500);

			adminModel.getTransporterDeliveries.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await adminService.getTransporterDeliveries(transporterId, query);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("Error en BD");
			}
		});

		it("should handle all filters combined", async () => {
			const transporterId = 5;
			const query = {
				status_id: "3",
				date_from: "2026-01-01",
				date_to: "2026-06-30",
				search: "Arroz",
				order: "ASC",
				limit: "50",
				offset: "5",
			};

			adminModel.getTransporterDeliveries.mockResolvedValue([{ total_count: 1 }]);

			await adminService.getTransporterDeliveries(transporterId, query);

			expect(adminModel.getTransporterDeliveries).toHaveBeenCalledWith(
				5,
				3,
				"2026-01-01",
				"2026-06-30",
				"Arroz",
				"ASC",
				50,
				5
			);
		});
	});

	describe("Edge cases and formatting", () => {
		it("should format transporter with active_assignments undefined", async () => {
			const query = {};

			const mockTransporters = [
				{
					id: 5,
					name: "Carlos",
					email: "carlos@example.com",
					total_count: 1,
				},
			];

			toInt.mockImplementation((val, defaultVal) => defaultVal);
			toStr.mockImplementation(() => null);

			adminModel.getTransporters.mockResolvedValue(mockTransporters);

			const result = await adminService.getTransporters(query);

			expect(result.transporters[0].activeAssignments).toBeUndefined();
		});

		it("should handle large active_assignments count", async () => {
			const query = {};

			const mockTransporters = [
				{
					id: 5,
					name: "Carlos",
					active_assignments: 1000,
					total_count: 1,
				},
			];

			toInt.mockImplementation((val, defaultVal) => defaultVal);
			toStr.mockImplementation(() => null);

			adminModel.getTransporters.mockResolvedValue(mockTransporters);

			const result = await adminService.getTransporters(query);

			expect(result.transporters[0].activeAssignments).toBe(1000);
		});

		it("should format delivery with all fields", async () => {
			const adminId = 1;
			const input = {
				donation_id: 10,
				transporter_id: 5,
				collection_address: "Calle Principal",
				destination: "Centro",
				delivery_type: "pickup",
			};

			const mockDonation = { id: 10, item_name: "Arroz" };
			const mockDelivery = {
				delivery_id: 1,
				delivery_type: "pickup",
				assigned_at: "2026-06-05",
				shipped_at: "2026-06-06",
				delivered_at: "2026-06-07",
				donation_id: 10,
				item_name: "Arroz",
				quantity: 10,
				unit: "kg",
				status_id: 5,
				status_name: "Entregado",
				donor_name: "John Doe",
				donor_email: "john@example.com",
				driver_id: 5,
				driver_name: "Carlos",
				driver_email: "carlos@example.com",
				collection_address: "Calle Principal",
				destination: "Centro",
			};

			donationModel.getDonationById.mockResolvedValue(mockDonation);
			adminModel.createDelivery.mockResolvedValue(mockDelivery);
			dispatchNotification.mockResolvedValue(true);

			const result = await adminService.createDelivery(adminId, input);

			expect(result).toEqual({
				deliveryId: 1,
				deliveryType: "pickup",
				assignedAt: "2026-06-05",
				shippedAt: "2026-06-06",
				deliveredAt: "2026-06-07",
				donationId: 10,
				itemName: "Arroz",
				quantity: 10,
				unit: "kg",
				statusId: 5,
				statusName: "Entregado",
				donorName: "John Doe",
				donorEmail: "john@example.com",
				driverId: 5,
				driverName: "Carlos",
				driverEmail: "carlos@example.com",
				collectionAddress: "Calle Principal",
				destination: "Centro",
			});
		});
	});
});
