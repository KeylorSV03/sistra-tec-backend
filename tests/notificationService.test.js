const notificationService = require("../src/services/notificationService");
const notificationModel = require("../src/models/notificationModel");
const { handleDbError } = require("../src/errors/dbErrorHandler");
const AppError = require("../src/errors/AppError");

jest.mock("../src/models/notificationModel");
jest.mock("../src/errors/dbErrorHandler");

describe("Notification Service", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getNotifications", () => {
		it("should return notifications with pagination metadata", async () => {
			const mockNotifications = [
				{
					id: 1,
					user_id: 1,
					title: "Test Notification",
					is_read: false,
					total_count: 5,
					unread_count: 3,
				},
			];

			notificationModel.getNotifications.mockResolvedValue(mockNotifications);

			const result = await notificationService.getNotifications(1, null, 20, 0);

			expect(result).toEqual({
				notifications: mockNotifications,
				pagination: {
					total_count: 5,
					unread_count: 3,
					limit: 20,
					offset: 0,
				},
			});
			expect(notificationModel.getNotifications).toHaveBeenCalledWith(1, null, 20, 0);
		});

		it("should filter by is_read true", async () => {
			const mockNotifications = [
				{
					id: 1,
					is_read: true,
					total_count: 2,
					unread_count: 0,
				},
			];

			notificationModel.getNotifications.mockResolvedValue(mockNotifications);

			const result = await notificationService.getNotifications(1, true, 20, 0);

			expect(notificationModel.getNotifications).toHaveBeenCalledWith(1, true, 20, 0);
			expect(result.pagination.unread_count).toBe(0);
		});

		it("should filter by is_read false", async () => {
			const mockNotifications = [
				{
					id: 1,
					is_read: false,
					total_count: 3,
					unread_count: 3,
				},
			];

			notificationModel.getNotifications.mockResolvedValue(mockNotifications);

			const result = await notificationService.getNotifications(1, false, 20, 0);

			expect(notificationModel.getNotifications).toHaveBeenCalledWith(1, false, 20, 0);
			expect(result.pagination.unread_count).toBe(3);
		});

		it("should enforce limit cap of 100", async () => {
			notificationModel.getNotifications.mockResolvedValue([
				{ total_count: 0, unread_count: 0 },
			]);

			await notificationService.getNotifications(1, null, 150, 0);

			expect(notificationModel.getNotifications).toHaveBeenCalledWith(1, null, 100, 0);
		});

		it("should use default limit of 20", async () => {
			notificationModel.getNotifications.mockResolvedValue([
				{ total_count: 0, unread_count: 0 },
			]);

			await notificationService.getNotifications(1, null, 0, 0);

			expect(notificationModel.getNotifications).toHaveBeenCalledWith(1, null, 20, 0);
		});

		it("should reset negative offset to 0", async () => {
			notificationModel.getNotifications.mockResolvedValue([
				{ total_count: 0, unread_count: 0 },
			]);

			await notificationService.getNotifications(1, null, 20, -5);

			expect(notificationModel.getNotifications).toHaveBeenCalledWith(1, null, 20, 0);
		});

		it("should return empty notifications when no results", async () => {
			notificationModel.getNotifications.mockResolvedValue([]);

			const result = await notificationService.getNotifications(1);

			expect(result).toEqual({
				notifications: [],
				pagination: {
					total_count: 0,
					unread_count: 0,
					limit: 20,
					offset: 0,
				},
			});
		});

		it("should handle database errors", async () => {
			const mockError = new Error("USER_NOT_FOUND: Usuario no encontrado");
			notificationModel.getNotifications.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(new AppError("Usuario no encontrado", 404));

			try {
				await notificationService.getNotifications(999);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Usuario no encontrado");
				expect(handleDbError).toHaveBeenCalledWith(mockError);
			}
		});
	});

	describe("markNotificationRead", () => {
		it("should mark notification as read", async () => {
			const mockResult = { id: 1, is_read: true };
			notificationModel.markNotificationRead.mockResolvedValue(mockResult);

			const result = await notificationService.markNotificationRead(1, 1);

			expect(result).toEqual(mockResult);
			expect(notificationModel.markNotificationRead).toHaveBeenCalledWith(1, 1);
		});

		it("should throw error when notification not found", async () => {
			notificationModel.markNotificationRead.mockResolvedValue(null);
			handleDbError.mockImplementation((error) => error);

			try {
				await notificationService.markNotificationRead(999, 1);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toContain("encontrada");
				expect(error.statusCode).toBe(404);
			}
		});

		it("should handle database errors", async () => {
			const mockError = new Error("NOTIFICATION_NOT_FOUND: Notificación no encontrada");
			notificationModel.markNotificationRead.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(
				new AppError("Notificación no encontrada", 404)
			);

			try {
				await notificationService.markNotificationRead(999, 1);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
			}
		});
	});

	describe("markAllNotificationsRead", () => {
		it("should mark all notifications as read and return count", async () => {
			const mockResult = { updated_count: 5 };
			notificationModel.markAllNotificationsRead.mockResolvedValue(mockResult);

			const result = await notificationService.markAllNotificationsRead(1);

			expect(result).toEqual({
				message: "5 notificación(es) marcada(s) como leída(s).",
				updated_count: 5,
			});
			expect(notificationModel.markAllNotificationsRead).toHaveBeenCalledWith(1);
		});

		it("should handle case when all notifications are already read", async () => {
			const mockResult = { updated_count: 0 };
			notificationModel.markAllNotificationsRead.mockResolvedValue(mockResult);

			const result = await notificationService.markAllNotificationsRead(1);

			expect(result.updated_count).toBe(0);
			expect(result.message).toContain("0");
		});

		it("should handle database errors", async () => {
			const mockError = new Error("USER_NOT_FOUND: Usuario no encontrado");
			notificationModel.markAllNotificationsRead.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(new AppError("Usuario no encontrado", 404));

			try {
				await notificationService.markAllNotificationsRead(999);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
			}
		});
	});

	describe("Edge cases and error handling", () => {
		it("should handle very large limit values", async () => {
			notificationModel.getNotifications.mockResolvedValue([
				{ total_count: 0, unread_count: 0 },
			]);

			await notificationService.getNotifications(1, null, 999999, 0);

			expect(notificationModel.getNotifications).toHaveBeenCalledWith(1, null, 100, 0);
		});

		it("should handle null is_read parameter", async () => {
			notificationModel.getNotifications.mockResolvedValue([
				{ total_count: 5, unread_count: 2 },
			]);

			await notificationService.getNotifications(1, null, 20, 0);

			expect(notificationModel.getNotifications).toHaveBeenCalledWith(1, null, 20, 0);
		});

		it("should convert string number IDs correctly", async () => {
			const mockResult = { id: 1, is_read: true };
			notificationModel.markNotificationRead.mockResolvedValue(mockResult);

			await notificationService.markNotificationRead("1", "1");

			expect(notificationModel.markNotificationRead).toHaveBeenCalledWith("1", "1");
		});
	});
});
