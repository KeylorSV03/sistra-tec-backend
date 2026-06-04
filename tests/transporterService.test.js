const transporterService = require("../src/services/transporterService");
const transporterModel = require("../src/models/transporterModel");
const { handleDbError } = require("../src/errors/dbErrorHandler");
const { dispatchNotification } = require("../src/utils/notificationUtil");
const AppError = require("../src/errors/AppError");

jest.mock("../src/models/transporterModel");
jest.mock("../src/errors/dbErrorHandler");
jest.mock("../src/utils/notificationUtil");

describe("Transporter Service", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getTransporterDeliveries", () => {
		it("should return deliveries with pagination metadata", async () => {
			const mockDeliveries = [
				{
					delivery_id: 1,
					donation_id: 10,
					item_name: "Arroz",
					status_id: 2,
					status_name: "Recibido",
					total_count: 5,
					unread_count: 2,
				},
			];

			transporterModel.getTransporterDeliveries.mockResolvedValue(mockDeliveries);

			const result = await transporterService.getTransporterDeliveries(1, {});

			expect(result).toEqual({
				deliveries: expect.any(Array),
				totalCount: 5,
			});
			expect(transporterModel.getTransporterDeliveries).toHaveBeenCalled();
		});

		it("should filter by status_id", async () => {
			const mockDeliveries = [
				{ delivery_id: 1, status_id: 2, total_count: 1, unread_count: 0 },
			];

			transporterModel.getTransporterDeliveries.mockResolvedValue(mockDeliveries);

			await transporterService.getTransporterDeliveries(1, { status_id: "2" });

			expect(transporterModel.getTransporterDeliveries).toHaveBeenCalledWith(
				1,
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
			const mockDeliveries = [
				{ delivery_id: 1, total_count: 2, unread_count: 1 },
			];

			transporterModel.getTransporterDeliveries.mockResolvedValue(mockDeliveries);

			await transporterService.getTransporterDeliveries(1, {
				date_from: "2026-01-01",
				date_to: "2026-12-31",
			});

			expect(transporterModel.getTransporterDeliveries).toHaveBeenCalledWith(
				1,
				null,
				"2026-01-01",
				"2026-12-31",
				null,
				"DESC",
				20,
				0
			);
		});

		it("should handle search parameter", async () => {
			const mockDeliveries = [
				{ delivery_id: 1, total_count: 1, unread_count: 0 },
			];

			transporterModel.getTransporterDeliveries.mockResolvedValue(mockDeliveries);

			await transporterService.getTransporterDeliveries(1, { search: "Calle Principal" });

			expect(transporterModel.getTransporterDeliveries).toHaveBeenCalledWith(
				1,
				null,
				null,
				null,
				"Calle Principal",
				"DESC",
				20,
				0
			);
		});

		it("should enforce limit cap of 100", async () => {
			transporterModel.getTransporterDeliveries.mockResolvedValue([
				{ total_count: 0, unread_count: 0 },
			]);

			await transporterService.getTransporterDeliveries(1, { limit: "150" });

			expect(transporterModel.getTransporterDeliveries).toHaveBeenCalledWith(
				1,
				null,
				null,
				null,
				null,
				"DESC",
				100,
				0
			);
		});

		it("should use default pagination values", async () => {
			transporterModel.getTransporterDeliveries.mockResolvedValue([
				{ total_count: 0, unread_count: 0 },
			]);

			await transporterService.getTransporterDeliveries(1, {});

			expect(transporterModel.getTransporterDeliveries).toHaveBeenCalledWith(
				1,
				null,
				null,
				null,
				null,
				"DESC",
				20,
				0
			);
		});

		it("should return empty deliveries when no results", async () => {
			transporterModel.getTransporterDeliveries.mockResolvedValue([]);

			const result = await transporterService.getTransporterDeliveries(1, {});

			expect(result).toEqual({
				deliveries: [],
				totalCount: 0,
			});
		});

		it("should handle database errors", async () => {
			const mockError = new Error("DB_ERROR");
			transporterModel.getTransporterDeliveries.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(new AppError("Error en BD", 500));

			try {
				await transporterService.getTransporterDeliveries(1, {});
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Error en BD");
				expect(handleDbError).toHaveBeenCalledWith(mockError);
			}
		});
	});

	describe("getTransporterDeliveryDetail", () => {
		it("should return delivery detail", async () => {
			const mockDelivery = {
				delivery_id: 1,
				donation_id: 10,
				item_name: "Arroz",
				donor_phone: "87654321",
			};

			transporterModel.getTransporterDeliveryDetail.mockResolvedValue(mockDelivery);

			const result = await transporterService.getTransporterDeliveryDetail(10);

			expect(result).toHaveProperty("deliveryId", 1);
			expect(result).toHaveProperty("donorPhone", "87654321");
		});

		it("should throw error when delivery not found", async () => {
			transporterModel.getTransporterDeliveryDetail.mockResolvedValue(null);

			try {
				await transporterService.getTransporterDeliveryDetail(999);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Entrega no encontrada.");
				expect(error.statusCode).toBe(404);
			}
		});

		it("should handle database errors", async () => {
			const mockError = new Error("DB_ERROR");
			transporterModel.getTransporterDeliveryDetail.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(new AppError("Error en BD", 500));

			try {
				await transporterService.getTransporterDeliveryDetail(10);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Error en BD");
			}
		});
	});

	describe("confirmPickup", () => {
		it("should confirm pickup and dispatch notification", async () => {
			const mockDelivery = {
				delivery_id: 1,
				donation_id: 10,
				item_name: "Arroz",
				driver_id: 5,
			};
			const mockUpdated = {
				delivery_id: 1,
				donation_id: 10,
				item_name: "Arroz",
				status_id: 2,
				status_name: "Recibido",
				driver_id: 5,
			};

			transporterModel.getTransporterDeliveryDetail.mockResolvedValue(mockDelivery);
			transporterModel.updateDonationStatus.mockResolvedValue(mockUpdated);

			const result = await transporterService.confirmPickup(10, 5);

			expect(result).toHaveProperty("statusName", "Recibido");
			expect(transporterModel.updateDonationStatus).toHaveBeenCalledWith(10, 2, "Transportista");
			expect(dispatchNotification).toHaveBeenCalledWith(
				5,
				"ENTREGA_RECOGIDA",
				{ item_name: "Arroz" },
				10
			);
		});

		it("should throw error when delivery not found", async () => {
			transporterModel.getTransporterDeliveryDetail.mockResolvedValue(null);

			try {
				await transporterService.confirmPickup(999, 5);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Entrega no encontrada.");
				expect(error.statusCode).toBe(404);
			}
		});

		it("should throw error when transportista is not assigned", async () => {
			const mockDelivery = {
				delivery_id: 1,
				donation_id: 10,
				driver_id: 999,
			};

			transporterModel.getTransporterDeliveryDetail.mockResolvedValue(mockDelivery);

			try {
				await transporterService.confirmPickup(10, 5);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("No tenés permiso para confirmar esta entrega.");
				expect(error.statusCode).toBe(403);
			}
		});

		it("should allow confirmation when driver_id is returned as a string", async () => {
			const mockDelivery = {
				delivery_id: 1,
				donation_id: 10,
				item_name: "Arroz",
				driver_id: "5",
			};
			const mockUpdated = {
				delivery_id: 1,
				donation_id: 10,
				item_name: "Arroz",
				status_id: 2,
				status_name: "Recibido",
				driver_id: "5",
			};

			transporterModel.getTransporterDeliveryDetail.mockResolvedValue(mockDelivery);
			transporterModel.updateDonationStatus.mockResolvedValue(mockUpdated);

			const result = await transporterService.confirmPickup(10, 5);

			expect(result).toHaveProperty("statusName", "Recibido");
			expect(transporterModel.updateDonationStatus).toHaveBeenCalledWith(10, 2, "Transportista");
		});

		it("should handle database errors", async () => {
			const mockDelivery = {
				delivery_id: 1,
				donation_id: 10,
				driver_id: 5,
			};
			const mockError = new Error("DB_ERROR");

			transporterModel.getTransporterDeliveryDetail.mockResolvedValue(mockDelivery);
			transporterModel.updateDonationStatus.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(new AppError("Error en BD", 500));

			try {
				await transporterService.confirmPickup(10, 5);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Error en BD");
			}
		});
	});

	describe("confirmDelivery", () => {
		it("should confirm delivery", async () => {
			const mockDelivery = {
				delivery_id: 1,
				donation_id: 10,
				item_name: "Arroz",
				driver_id: 5,
			};
			const mockUpdated = {
				delivery_id: 1,
				donation_id: 10,
				item_name: "Arroz",
				status_id: 5,
				status_name: "Entregado",
				driver_id: 5,
			};

			transporterModel.getTransporterDeliveryDetail.mockResolvedValue(mockDelivery);
			transporterModel.updateDonationStatus.mockResolvedValue(mockUpdated);

			const result = await transporterService.confirmDelivery(10, 5);

			expect(result).toHaveProperty("statusName", "Entregado");
			expect(transporterModel.updateDonationStatus).toHaveBeenCalledWith(10, 5, "Transportista");
		});

		it("should throw error when transportista is not assigned", async () => {
			const mockDelivery = {
				delivery_id: 1,
				donation_id: 10,
				driver_id: 999,
			};

			transporterModel.getTransporterDeliveryDetail.mockResolvedValue(mockDelivery);

			try {
				await transporterService.confirmDelivery(10, 5);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("No tenés permiso para confirmar esta entrega.");
				expect(error.statusCode).toBe(403);
			}
		});

		it("should handle database errors", async () => {
			const mockDelivery = {
				delivery_id: 1,
				donation_id: 10,
				driver_id: 5,
			};
			const mockError = new Error("DB_ERROR");

			transporterModel.getTransporterDeliveryDetail.mockResolvedValue(mockDelivery);
			transporterModel.updateDonationStatus.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(new AppError("Error en BD", 500));

			try {
				await transporterService.confirmDelivery(10, 5);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Error en BD");
			}
		});
	});

	describe("Edge cases", () => {
		it("should handle very large limit values", async () => {
			transporterModel.getTransporterDeliveries.mockResolvedValue([
				{ total_count: 0, unread_count: 0 },
			]);

			await transporterService.getTransporterDeliveries(1, { limit: "999999" });

			expect(transporterModel.getTransporterDeliveries).toHaveBeenCalledWith(
				1,
				null,
				null,
				null,
				null,
				"DESC",
				100,
				0
			);
		});

		it("should handle ASC order", async () => {
			transporterModel.getTransporterDeliveries.mockResolvedValue([
				{ total_count: 0, unread_count: 0 },
			]);

			await transporterService.getTransporterDeliveries(1, { order: "ASC" });

			expect(transporterModel.getTransporterDeliveries).toHaveBeenCalledWith(
				1,
				null,
				null,
				null,
				null,
				"ASC",
				20,
				0
			);
		});

		it("should handle invalid order - defaults to DESC", async () => {
			transporterModel.getTransporterDeliveries.mockResolvedValue([
				{ total_count: 0, unread_count: 0 },
			]);

			await transporterService.getTransporterDeliveries(1, { order: "INVALID" });

			expect(transporterModel.getTransporterDeliveries).toHaveBeenCalledWith(
				1,
				null,
				null,
				null,
				null,
				"DESC",
				20,
				0
			);
		});
	});
});
