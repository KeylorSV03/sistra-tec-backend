const authController = require("../src/controllers/authController");
const donationController = require("../src/controllers/donationController");
const adminController = require("../src/controllers/adminController");
const transporterController = require("../src/controllers/transporterController");
const notificationController = require("../src/controllers/notificationController");

const authService = require("../src/services/authService");
const donationService = require("../src/services/donationService");
const adminService = require("../src/services/adminService");
const transporterService = require("../src/services/transporterService");
const notificationService = require("../src/services/notificationService");

jest.mock("../src/services/authService");
jest.mock("../src/services/donationService");
jest.mock("../src/services/adminService");
jest.mock("../src/services/transporterService");
jest.mock("../src/services/notificationService");

describe("Controllers", () => {
	let mockReq, mockRes, mockNext;

	beforeEach(() => {
		mockReq = {
			body: {},
			params: {},
			query: {},
			cookies: {},
			headers: {},
			user: { userId: 1, rolName: "Donante" },
			file: null,
		};

		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			clearCookie: jest.fn().mockReturnThis(),
		};

		mockNext = jest.fn();
		jest.clearAllMocks();
	});

	describe("Auth Controller", () => {
		it("should register user successfully", async () => {
			mockReq.body = {
				name: "John Doe",
				email: "john@example.com",
				password: "password123",
			};

			const mockUser = { id: 1, name: "John Doe", email: "john@example.com" };
			authService.register.mockResolvedValue(mockUser);

			await authController.register(mockReq, mockRes, mockNext);

			expect(authService.register).toHaveBeenCalledWith(mockReq.body);
			expect(mockRes.status).toHaveBeenCalledWith(201);
			expect(mockRes.json).toHaveBeenCalledWith({
				status: "ok",
				message: "Cuenta creada correctamente.",
				user: mockUser,
			});
		});

		it("should handle register error", async () => {
			const error = new Error("Email already exists");
			authService.register.mockRejectedValue(error);

			await authController.register(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should login user successfully", async () => {
			mockReq.body = { email: "john@example.com", password: "password123" };

			const mockResponse = {
				accessToken: "token123",
				user: { id: 1, name: "John Doe" },
			};
			authService.login.mockResolvedValue(mockResponse);

			await authController.login(mockReq, mockRes, mockNext);

			expect(authService.login).toHaveBeenCalledWith(mockReq.body, mockRes);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				status: "ok",
				message: "Sesión iniciada correctamente.",
				accessToken: mockResponse.accessToken,
				user: mockResponse.user,
			});
		});

		it("should handle login error", async () => {
			const error = new Error("Invalid credentials");
			authService.login.mockRejectedValue(error);

			await authController.login(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should refresh token successfully", async () => {
			mockReq.cookies.refresh_token = "refresh123";
			authService.refresh.mockResolvedValue({ accessToken: "new_token" });

			await authController.refresh(mockReq, mockRes, mockNext);

			expect(authService.refresh).toHaveBeenCalledWith("refresh123", mockRes);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				status: "ok",
				accessToken: "new_token",
			});
		});

		it("should handle refresh error", async () => {
			const error = new Error("Invalid token");
			authService.refresh.mockRejectedValue(error);

			await authController.refresh(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should logout user successfully", async () => {
			authService.logout.mockReturnValue(undefined);

			authController.logout(mockReq, mockRes, mockNext);

			expect(authService.logout).toHaveBeenCalledWith(mockRes);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				status: "ok",
				message: "Sesión cerrada correctamente.",
			});
		});

		it("should handle logout error", () => {
			const error = new Error("Logout failed");
			authService.logout.mockImplementation(() => {
				throw error;
			});

			authController.logout(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should handle forgot password", async () => {
			mockReq.body = { email: "john@example.com" };
			authService.forgotPassword.mockResolvedValue(undefined);

			await authController.forgotPassword(mockReq, mockRes, mockNext);

			expect(authService.forgotPassword).toHaveBeenCalledWith(mockReq.body);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				status: "ok",
				message: "Si el correo está registrado, recibirás un código de recuperación.",
			});
		});

		it("should handle forgot password error", async () => {
			const error = new Error("Email service failed");
			authService.forgotPassword.mockRejectedValue(error);

			await authController.forgotPassword(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should verify reset code successfully", async () => {
			mockReq.body = { email: "john@example.com", code: "123456" };
			authService.verifyResetCode.mockResolvedValue({ resetToken: "reset123" });

			await authController.verifyResetCode(mockReq, mockRes, mockNext);

			expect(authService.verifyResetCode).toHaveBeenCalledWith(mockReq.body);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				status: "ok",
				resetToken: "reset123",
			});
		});

		it("should handle verify reset code error", async () => {
			const error = new Error("Invalid code");
			authService.verifyResetCode.mockRejectedValue(error);

			await authController.verifyResetCode(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should reset password successfully", async () => {
			mockReq.body = { new_password: "newpass123" };
			mockReq.headers["x-reset-token"] = "reset123";
			authService.resetPassword.mockResolvedValue(undefined);

			await authController.resetPassword(mockReq, mockRes, mockNext);

			expect(authService.resetPassword).toHaveBeenCalledWith(
				mockReq.body,
				"reset123"
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				status: "ok",
				message: "Contraseña actualizada correctamente.",
			});
		});

		it("should handle reset password without token", async () => {
			mockReq.body = { new_password: "newpass123" };
			authService.resetPassword.mockResolvedValue(undefined);

			await authController.resetPassword(mockReq, mockRes, mockNext);

			expect(authService.resetPassword).toHaveBeenCalledWith(mockReq.body, null);
		});

		it("should handle reset password error", async () => {
			const error = new Error("Reset failed");
			authService.resetPassword.mockRejectedValue(error);

			await authController.resetPassword(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should get profile successfully", async () => {
			mockReq.user.userId = 1;
			const mockUser = { id: 1, name: "John Doe" };
			authService.getProfile.mockResolvedValue(mockUser);

			await authController.getProfile(mockReq, mockRes, mockNext);

			expect(authService.getProfile).toHaveBeenCalledWith(1);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({ status: "ok", user: mockUser });
		});

		it("should handle get profile error", async () => {
			const error = new Error("User not found");
			authService.getProfile.mockRejectedValue(error);

			await authController.getProfile(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should update profile successfully", async () => {
			mockReq.user.userId = 1;
			mockReq.body = { name: "Jane Doe" };
			mockReq.file = null;

			const mockUser = { id: 1, name: "Jane Doe" };
			authService.updateProfile.mockResolvedValue(mockUser);

			await authController.updateProfile(mockReq, mockRes, mockNext);

			expect(authService.updateProfile).toHaveBeenCalledWith(1, mockReq.body, null);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				status: "ok",
				message: "Perfil actualizado correctamente.",
				user: mockUser,
			});
		});

		it("should update profile with file", async () => {
			mockReq.user.userId = 1;
			mockReq.body = { name: "Jane Doe" };
			mockReq.file = { buffer: Buffer.from("image") };

			const mockUser = { id: 1, name: "Jane Doe" };
			authService.updateProfile.mockResolvedValue(mockUser);

			await authController.updateProfile(mockReq, mockRes, mockNext);

			expect(authService.updateProfile).toHaveBeenCalledWith(
				1,
				mockReq.body,
				mockReq.file
			);
		});

		it("should handle update profile error", async () => {
			const error = new Error("Update failed");
			authService.updateProfile.mockRejectedValue(error);

			await authController.updateProfile(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});
	});

	describe("Donation Controller", () => {
		it("should create donation successfully", async () => {
			mockReq.user.userId = 1;
			mockReq.body = { item_name: "Arroz", quantity: 10, unit: "kg" };
			mockReq.file = { buffer: Buffer.from("image") };

			const mockDonation = { id: 1, item_name: "Arroz" };
			donationService.createDonation.mockResolvedValue(mockDonation);

			await donationController.createDonation(mockReq, mockRes, mockNext);

			expect(donationService.createDonation).toHaveBeenCalledWith(
				1,
				mockReq.body,
				mockReq.file
			);
			expect(mockRes.status).toHaveBeenCalledWith(201);
		});

		it("should handle create donation error", async () => {
			const error = new Error("Image required");
			donationService.createDonation.mockRejectedValue(error);

			await donationController.createDonation(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should get donations successfully", async () => {
			mockReq.user.userId = 1;
			mockReq.query = { status_id: "1" };

			const mockDonations = {
				donations: [{ id: 1, item_name: "Arroz" }],
				totalCount: 1,
			};
			donationService.getDonations.mockResolvedValue(mockDonations);

			await donationController.getDonations(mockReq, mockRes, mockNext);

			expect(donationService.getDonations).toHaveBeenCalledWith(1, mockReq.query);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle get donations error", async () => {
			const error = new Error("DB error");
			donationService.getDonations.mockRejectedValue(error);

			await donationController.getDonations(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should get donation by id successfully", async () => {
			mockReq.params.id = "1";
			const mockDonation = { id: 1, item_name: "Arroz" };
			donationService.getDonationById.mockResolvedValue(mockDonation);

			await donationController.getDonationById(mockReq, mockRes, mockNext);

			// Controller converts to Number
			expect(donationService.getDonationById).toHaveBeenCalledWith(1);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle get donation by id error", async () => {
			const error = new Error("Not found");
			donationService.getDonationById.mockRejectedValue(error);

			await donationController.getDonationById(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should update donation status successfully", async () => {
			mockReq.user.rolName = "Admin";
			mockReq.params.id = "1";
			mockReq.body = { status_id: 2 };

			const mockDonation = { id: 1, status_id: 2 };
			donationService.updateDonationStatus.mockResolvedValue(mockDonation);

			await donationController.updateDonationStatus(mockReq, mockRes, mockNext);

			// Controller converts id to Number
			expect(donationService.updateDonationStatus).toHaveBeenCalledWith(
				1,
				2,
				"Admin"
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle update donation status error", async () => {
			const error = new Error("Unauthorized");
			donationService.updateDonationStatus.mockRejectedValue(error);

			await donationController.updateDonationStatus(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});
	});

	describe("Admin Controller", () => {
		it("should create transporter successfully", async () => {
			mockReq.user.userId = 1;
			mockReq.body = {
				name: "Carlos",
				email: "carlos@example.com",
				password: "pass123",
			};

			const mockTransporter = { id: 5, name: "Carlos" };
			adminService.createTransporter.mockResolvedValue(mockTransporter);

			await adminController.createTransporter(mockReq, mockRes, mockNext);

			expect(adminService.createTransporter).toHaveBeenCalledWith(
				1,
				mockReq.body
			);
			expect(mockRes.status).toHaveBeenCalledWith(201);
		});

		it("should handle create transporter error", async () => {
			const error = new Error("Email exists");
			adminService.createTransporter.mockRejectedValue(error);

			await adminController.createTransporter(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should get transporters successfully", async () => {
			mockReq.query = { search: "Carlos" };

			const mockTransporters = {
				transporters: [{ id: 5, name: "Carlos" }],
				totalCount: 1,
			};
			adminService.getTransporters.mockResolvedValue(mockTransporters);

			await adminController.getTransporters(mockReq, mockRes, mockNext);

			expect(adminService.getTransporters).toHaveBeenCalledWith(mockReq.query);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle get transporters error", async () => {
			const error = new Error("DB error");
			adminService.getTransporters.mockRejectedValue(error);

			await adminController.getTransporters(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should update transporter status successfully", async () => {
			mockReq.params.id = "5";
			mockReq.body = { is_active: false };

			const mockTransporter = { id: 5, isActive: false };
			adminService.updateTransporterStatus.mockResolvedValue(mockTransporter);

			await adminController.updateTransporterStatus(mockReq, mockRes, mockNext);

			// Controller converts id to Number
			expect(adminService.updateTransporterStatus).toHaveBeenCalledWith(5, false);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				status: "ok",
				message: "Transportista desactivado correctamente.",
				transporter: mockTransporter,
			});
		});

		it("should update transporter status to active successfully", async () => {
			mockReq.params.id = "5";
			mockReq.body = { is_active: true };

			const mockTransporter = { id: 5, isActive: true };
			adminService.updateTransporterStatus.mockResolvedValue(mockTransporter);

			await adminController.updateTransporterStatus(mockReq, mockRes, mockNext);

			// Controller converts id to Number
			expect(adminService.updateTransporterStatus).toHaveBeenCalledWith(5, true);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				status: "ok",
				message: "Transportista activado correctamente.",
				transporter: mockTransporter,
			});
		});

		it("should handle update transporter status error", async () => {
			const error = new Error("Not found");
			adminService.updateTransporterStatus.mockRejectedValue(error);

			await adminController.updateTransporterStatus(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should create delivery successfully", async () => {
			mockReq.user.userId = 1;
			mockReq.body = {
				donation_id: 10,
				transporter_id: 5,
				collection_address: "Calle",
				destination: "Centro",
				delivery_type: "pickup",
			};

			const mockDelivery = { delivery_id: 1, donation_id: 10 };
			adminService.createDelivery.mockResolvedValue(mockDelivery);

			await adminController.createDelivery(mockReq, mockRes, mockNext);

			expect(adminService.createDelivery).toHaveBeenCalledWith(1, mockReq.body);
			expect(mockRes.status).toHaveBeenCalledWith(201);
		});

		it("should handle create delivery error", async () => {
			const error = new Error("Donation not found");
			adminService.createDelivery.mockRejectedValue(error);

			await adminController.createDelivery(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should get deliveries successfully", async () => {
			mockReq.query = { status_id: "1" };

			const mockDeliveries = {
				deliveries: [{ delivery_id: 1 }],
				totalCount: 1,
			};
			adminService.getDeliveries.mockResolvedValue(mockDeliveries);

			await adminController.getDeliveries(mockReq, mockRes, mockNext);

			expect(adminService.getDeliveries).toHaveBeenCalledWith(mockReq.query);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle get deliveries error", async () => {
			const error = new Error("DB error");
			adminService.getDeliveries.mockRejectedValue(error);

			await adminController.getDeliveries(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should get transporter deliveries successfully", async () => {
			mockReq.params.id = "5";
			mockReq.query = {};

			const mockDeliveries = {
				deliveries: [{ delivery_id: 1 }],
				totalCount: 1,
			};
			adminService.getTransporterDeliveries.mockResolvedValue(mockDeliveries);

			await adminController.getTransporterDeliveries(mockReq, mockRes, mockNext);

			// Controller converts id to Number
			expect(adminService.getTransporterDeliveries).toHaveBeenCalledWith(
				5,
				mockReq.query
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle get transporter deliveries error", async () => {
			const error = new Error("DB error");
			adminService.getTransporterDeliveries.mockRejectedValue(error);

			await adminController.getTransporterDeliveries(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});
	});

	describe("Transporter Controller", () => {
		it("should get deliveries successfully", async () => {
			mockReq.user.userId = 5;
			mockReq.query = {};

			const mockDeliveries = {
				deliveries: [{ delivery_id: 1 }],
				totalCount: 1,
			};
			transporterService.getTransporterDeliveries.mockResolvedValue(
				mockDeliveries
			);

			await transporterController.getTransporterDeliveries(mockReq, mockRes, mockNext);

			expect(transporterService.getTransporterDeliveries).toHaveBeenCalledWith(
				5,
				mockReq.query
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle get deliveries error", async () => {
			const error = new Error("DB error");
			transporterService.getTransporterDeliveries.mockRejectedValue(error);

			await transporterController.getTransporterDeliveries(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should get delivery detail successfully", async () => {
			mockReq.params.id = "1";
			const mockDelivery = { delivery_id: 1, item_name: "Arroz" };
			transporterService.getTransporterDeliveryDetail.mockResolvedValue(
				mockDelivery
			);

			await transporterController.getTransporterDeliveryDetail(mockReq, mockRes, mockNext);

			// Controller converts id to Number
			expect(transporterService.getTransporterDeliveryDetail).toHaveBeenCalledWith(
				1,
				mockReq.user.userId
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle get delivery detail error", async () => {
			const error = new Error("Not found");
			transporterService.getTransporterDeliveryDetail.mockRejectedValue(error);

			await transporterController.getTransporterDeliveryDetail(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should confirm pickup successfully", async () => {
			mockReq.user.userId = 5;
			mockReq.params.id = "1";

			const mockDelivery = { delivery_id: 1, status_name: "Recibido" };
			transporterService.confirmPickup.mockResolvedValue(mockDelivery);

			await transporterController.confirmPickup(mockReq, mockRes, mockNext);

			// Controller converts id to Number
			expect(transporterService.confirmPickup).toHaveBeenCalledWith(1, 5);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle confirm pickup error", async () => {
			const error = new Error("Unauthorized");
			transporterService.confirmPickup.mockRejectedValue(error);

			await transporterController.confirmPickup(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should confirm delivery successfully", async () => {
			mockReq.user.userId = 5;
			mockReq.params.id = "1";

			const mockDelivery = { delivery_id: 1, status_name: "Entregado" };
			transporterService.confirmDelivery.mockResolvedValue(mockDelivery);

			await transporterController.confirmDelivery(mockReq, mockRes, mockNext);

			// Controller converts id to Number
			expect(transporterService.confirmDelivery).toHaveBeenCalledWith(1, 5);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle confirm delivery error", async () => {
			const error = new Error("Unauthorized");
			transporterService.confirmDelivery.mockRejectedValue(error);

			await transporterController.confirmDelivery(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});
	});

	describe("Notification Controller", () => {
		it("should get notifications successfully", async () => {
			mockReq.user.userId = 1;
			mockReq.query = { is_read: "false", limit: "20", offset: "0" };

			const mockNotifications = {
				notifications: [{ id: 1, title: "Test" }],
				pagination: { total_count: 1 },
			};
			notificationService.getNotifications.mockResolvedValue(mockNotifications);

			await notificationController.getNotifications(mockReq, mockRes, mockNext);

			// Controller converts is_read to boolean and limit/offset to numbers
			expect(notificationService.getNotifications).toHaveBeenCalledWith(
				1,
				false,
				20,
				0
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should get notifications with null is_read", async () => {
			mockReq.user.userId = 1;
			mockReq.query = { limit: "20", offset: "0" };

			const mockNotifications = {
				notifications: [{ id: 1, title: "Test" }],
				pagination: { total_count: 1 },
			};
			notificationService.getNotifications.mockResolvedValue(mockNotifications);

			await notificationController.getNotifications(mockReq, mockRes, mockNext);

			// When is_read is undefined, it should be null
			expect(notificationService.getNotifications).toHaveBeenCalledWith(
				1,
				null,
				20,
				0
			);
		});

		it("should handle get notifications error", async () => {
			const error = new Error("DB error");
			notificationService.getNotifications.mockRejectedValue(error);

			await notificationController.getNotifications(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should mark notification as read successfully", async () => {
			mockReq.user.userId = 1;
			mockReq.params.id = "1";

			const mockNotification = { id: 1, is_read: true };
			notificationService.markNotificationRead.mockResolvedValue(
				mockNotification
			);

			await notificationController.markNotificationRead(mockReq, mockRes, mockNext);

			// Controller converts id to parseInt
			expect(notificationService.markNotificationRead).toHaveBeenCalledWith(
				1,
				1
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle mark as read error", async () => {
			const error = new Error("Not found");
			notificationService.markNotificationRead.mockRejectedValue(error);

			await notificationController.markNotificationRead(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it("should mark all notifications as read successfully", async () => {
			mockReq.user.userId = 1;

			const mockResult = { updated_count: 5, message: "5 marcadas" };
			notificationService.markAllNotificationsRead.mockResolvedValue(mockResult);

			await notificationController.markAllNotificationsRead(
				mockReq,
				mockRes,
				mockNext
			);

			expect(notificationService.markAllNotificationsRead).toHaveBeenCalledWith(1);
			expect(mockRes.status).toHaveBeenCalledWith(200);
		});

		it("should handle mark all as read error", async () => {
			const error = new Error("DB error");
			notificationService.markAllNotificationsRead.mockRejectedValue(error);

			await notificationController.markAllNotificationsRead(
				mockReq,
				mockRes,
				mockNext
			);

			expect(mockNext).toHaveBeenCalledWith(error);
		});
	});
});
