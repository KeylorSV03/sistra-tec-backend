const jwt = require("jsonwebtoken");
const crypto = require("crypto");

jest.mock("../src/models/authModel");
jest.mock("../src/utils/hashUtil");
jest.mock("../src/utils/mailerUtil");
jest.mock("../src/utils/notificationUtil");
jest.mock("../src/errors/dbErrorHandler");
jest.mock("../src/utils/cloudinaryUtil");
jest.mock("../src/templates/welcomeEmail");
jest.mock("../src/config/catalogs", () => ({
	ROLES: {
		Admin: 1,
		Transportista: 2,
		Donante: 3,
	},
}));
jest.mock("jsonwebtoken");
jest.mock("crypto");

const authService = require("../src/services/authService");
const authModel = require("../src/models/authModel");
const { hashPassword, comparePassword } = require("../src/utils/hashUtil");
const { sendEmail } = require("../src/utils/mailerUtil");
const { dispatchNotification } = require("../src/utils/notificationUtil");
const { handleDbError } = require("../src/errors/dbErrorHandler");
const { uploadImage, extractPublicId, deleteImage } = require("../src/utils/cloudinaryUtil");
const welcomeEmail = require("../src/templates/welcomeEmail");
const AppError = require("../src/errors/AppError");

// Mock environment variables
process.env.JWT_SECRET = "test_jwt_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
process.env.JWT_ACCESS_EXPIRES = "15m";
process.env.JWT_REFRESH_EXPIRES = "7d";
process.env.NODE_ENV = "development";

describe("Auth Service", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("register", () => {
		it("should register a new user successfully", async () => {
			const input = {
				name: "John Doe",
				email: "john@example.com",
				password: "password123",
				phone_number: "87654321",
			};

			const mockHashedPassword = "hashed_password_123";
			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
				password: mockHashedPassword,
				phone_number: "87654321",
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: null,
				is_active: true,
			};

			hashPassword.mockResolvedValue(mockHashedPassword);
			authModel.createUser.mockResolvedValue(mockUser);
			welcomeEmail.html = jest.fn().mockReturnValue("<html></html>");
			sendEmail.mockResolvedValue(true);
			dispatchNotification.mockResolvedValue(true);

			const result = await authService.register(input);

			expect(result).toEqual({
				id: 1,
				name: "John Doe",
				email: "john@example.com",
				phoneNumber: "87654321",
				profilePhotoUrl: null,
				rolId: 3,
				rolName: "Donante",
				isActive: true,
			});
			expect(hashPassword).toHaveBeenCalledWith("password123");
			expect(authModel.createUser).toHaveBeenCalledWith(
				"John Doe",
				"john@example.com",
				mockHashedPassword,
				3,
				"87654321"
			);
			expect(dispatchNotification).toHaveBeenCalledWith(1, "BIENVENIDA", {
				user_name: "John Doe",
			});
			expect(sendEmail).toHaveBeenCalled();
		});

		it("should register user without phone_number", async () => {
			const input = {
				name: "Jane Doe",
				email: "jane@example.com",
				password: "password123",
			};

			const mockHashedPassword = "hashed_password_456";
			const mockUser = {
				id: 2,
				name: "Jane Doe",
				email: "jane@example.com",
				password: mockHashedPassword,
				phone_number: null,
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: null,
				is_active: true,
			};

			hashPassword.mockResolvedValue(mockHashedPassword);
			authModel.createUser.mockResolvedValue(mockUser);
			welcomeEmail.html = jest.fn().mockReturnValue("<html></html>");
			sendEmail.mockResolvedValue(true);
			dispatchNotification.mockResolvedValue(true);

			const result = await authService.register(input);

			expect(result.phoneNumber).toBeNull();
			expect(authModel.createUser).toHaveBeenCalledWith(
				"Jane Doe",
				"jane@example.com",
				mockHashedPassword,
				3,
				null
			);
		});

		it("should handle database errors on registration", async () => {
			const input = {
				name: "John Doe",
				email: "john@example.com",
				password: "password123",
				phone_number: "87654321",
			};

			const mockError = new Error("EMAIL_ALREADY_EXISTS: Email ya existe");
			const mockAppError = new AppError("El email ya está registrado.", 409);

			hashPassword.mockResolvedValue("hashed_password");
			authModel.createUser.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await authService.register(input);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("El email ya está registrado.");
				expect(error.statusCode).toBe(409);
			}
		});

		it("should send welcome email even if it fails silently", async () => {
			const input = {
				name: "Test User",
				email: "test@example.com",
				password: "password123",
			};

			const mockUser = {
				id: 3,
				name: "Test User",
				email: "test@example.com",
				password: "hashed",
				phone_number: null,
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: null,
				is_active: true,
			};

			hashPassword.mockResolvedValue("hashed");
			authModel.createUser.mockResolvedValue(mockUser);
			welcomeEmail.html = jest.fn().mockReturnValue("<html></html>");
			sendEmail.mockRejectedValue(new Error("Email service down"));

			const result = await authService.register(input);

			expect(result).toBeDefined();
			expect(result.id).toBe(3);
		});
	});

	describe("login", () => {
		it("should login user successfully", async () => {
			const input = {
				email: "john@example.com",
				password: "password123",
			};

			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
				password: "hashed_password",
				phone_number: "87654321",
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: null,
				is_active: true,
			};

			const mockRes = {
				cookie: jest.fn(),
			};

			authModel.getUserByEmail.mockResolvedValue(mockUser);
			comparePassword.mockResolvedValue(true);
			jwt.sign.mockReturnValueOnce("mock_access_token").mockReturnValueOnce("mock_refresh_token");

			const result = await authService.login(input, mockRes);

			expect(result).toEqual({
				accessToken: "mock_access_token",
				user: {
					id: 1,
					name: "John Doe",
					email: "john@example.com",
					phoneNumber: "87654321",
					profilePhotoUrl: null,
					rolId: 3,
					rolName: "Donante",
					isActive: true,
				},
			});
			expect(comparePassword).toHaveBeenCalledWith("password123", "hashed_password");
			expect(mockRes.cookie).toHaveBeenCalledWith(
				"refresh_token",
				"mock_refresh_token",
				expect.any(Object)
			);
		});

		it("should throw error for incorrect credentials", async () => {
			const input = {
				email: "john@example.com",
				password: "wrongpassword",
			};

			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
				password: "hashed_password",
				is_active: true,
			};

			const mockRes = { cookie: jest.fn() };

			authModel.getUserByEmail.mockResolvedValue(mockUser);
			comparePassword.mockResolvedValue(false);

			try {
				await authService.login(input, mockRes);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Credenciales incorrectas.");
				expect(error.statusCode).toBe(401);
			}
		});

		it("should throw error when user not found", async () => {
			const input = {
				email: "nonexistent@example.com",
				password: "password123",
			};

			const mockRes = { cookie: jest.fn() };

			authModel.getUserByEmail.mockResolvedValue(null);

			try {
				await authService.login(input, mockRes);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Credenciales incorrectas.");
				expect(error.statusCode).toBe(401);
			}
		});

		it("should throw error when account is inactive", async () => {
			const input = {
				email: "john@example.com",
				password: "password123",
			};

			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
				password: "hashed_password",
				is_active: false,
			};

			const mockRes = { cookie: jest.fn() };

			authModel.getUserByEmail.mockResolvedValue(mockUser);
			comparePassword.mockResolvedValue(true);

			try {
				await authService.login(input, mockRes);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Cuenta desactivada. Contactá al administrador.");
				expect(error.statusCode).toBe(403);
			}
		});
	});

	describe("refresh", () => {
		it("should refresh access token successfully", async () => {
			const mockRefreshToken = "mock_refresh_token";
			const mockDecoded = { userId: 1 };
			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
				rol_id: 3,
				rol_name: "Donante",
				is_active: true,
			};

			const mockRes = {
				cookie: jest.fn(),
			};

			jwt.verify.mockReturnValue(mockDecoded);
			authModel.getUserById.mockResolvedValue(mockUser);
			jwt.sign.mockReturnValueOnce("new_access_token").mockReturnValueOnce("new_refresh_token");

			const result = await authService.refresh(mockRefreshToken, mockRes);

			expect(result).toEqual({
				accessToken: "new_access_token",
			});
			expect(jwt.verify).toHaveBeenCalledWith(
				mockRefreshToken,
				process.env.JWT_REFRESH_SECRET
			);
			expect(mockRes.cookie).toHaveBeenCalledWith(
				"refresh_token",
				"new_refresh_token",
				expect.any(Object)
			);
		});

		it("should throw error when refresh token is missing", async () => {
			const mockRes = { cookie: jest.fn() };

			try {
				await authService.refresh(null, mockRes);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("No autenticado.");
				expect(error.statusCode).toBe(401);
			}
		});

		it("should throw error when refresh token is invalid", async () => {
			const mockRefreshToken = "invalid_token";
			const mockRes = { cookie: jest.fn() };

			jwt.verify.mockImplementation(() => {
				throw new Error("Invalid token");
			});

			try {
				await authService.refresh(mockRefreshToken, mockRes);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Token de sesión inválido o expirado.");
				expect(error.statusCode).toBe(401);
			}
		});

		it("should throw error when user is inactive after refresh", async () => {
			const mockRefreshToken = "mock_refresh_token";
			const mockDecoded = { userId: 1 };
			const mockUser = {
				id: 1,
				name: "John Doe",
				is_active: false,
			};

			const mockRes = { cookie: jest.fn() };

			jwt.verify.mockReturnValue(mockDecoded);
			authModel.getUserById.mockResolvedValue(mockUser);

			try {
				await authService.refresh(mockRefreshToken, mockRes);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Cuenta desactivada. Contactá al administrador.");
				expect(error.statusCode).toBe(403);
			}
		});

		it("should handle database errors on refresh", async () => {
			const mockRefreshToken = "mock_refresh_token";
			const mockDecoded = { userId: 1 };
			const mockError = new Error("USER_NOT_FOUND: Usuario no encontrado");
			const mockAppError = new AppError("Usuario no encontrado", 404);

			const mockRes = { cookie: jest.fn() };

			jwt.verify.mockReturnValue(mockDecoded);
			authModel.getUserById.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await authService.refresh(mockRefreshToken, mockRes);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("Usuario no encontrado");
			}
		});
	});

	describe("logout", () => {
		it("should clear refresh token cookie", () => {
			const mockRes = {
				clearCookie: jest.fn(),
			};

			authService.logout(mockRes);

			expect(mockRes.clearCookie).toHaveBeenCalledWith(
				"refresh_token",
				expect.any(Object)
			);
		});

		it("should clear cookie with correct options", () => {
			const mockRes = {
				clearCookie: jest.fn(),
			};

			authService.logout(mockRes);

			const callArgs = mockRes.clearCookie.mock.calls[0];
			expect(callArgs[0]).toBe("refresh_token");
			expect(callArgs[1].httpOnly).toBe(true);
		});
	});

	describe("forgotPassword", () => {
		it("should create reset code and send email", async () => {
			const input = { email: "john@example.com" };
			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
			};

			const mockCode = "123456";

			authModel.getUserByEmail.mockResolvedValue(mockUser);
			crypto.randomInt.mockReturnValue(Number(mockCode));
			authModel.createResetCode.mockResolvedValue({ id: 1 });
			sendEmail.mockResolvedValue(true);

			await authService.forgotPassword(input);

			expect(authModel.getUserByEmail).toHaveBeenCalledWith("john@example.com");
			expect(crypto.randomInt).toHaveBeenCalledWith(100000, 999999);
			expect(authModel.createResetCode).toHaveBeenCalledWith(1, "123456");
			expect(sendEmail).toHaveBeenCalled();
		});

		it("should not reveal if email exists", async () => {
			const input = { email: "nonexistent@example.com" };

			authModel.getUserByEmail.mockResolvedValue(null);

			const result = await authService.forgotPassword(input);

			expect(result).toBeUndefined();
			expect(authModel.createResetCode).not.toHaveBeenCalled();
			expect(sendEmail).not.toHaveBeenCalled();
		});

		it("should handle database errors when creating reset code", async () => {
			const input = { email: "john@example.com" };
			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
			};

			const mockError = new Error("DB_ERROR");
			const mockAppError = new AppError("Error en BD", 500);

			authModel.getUserByEmail.mockResolvedValue(mockUser);
			crypto.randomInt.mockReturnValue(123456);
			authModel.createResetCode.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await authService.forgotPassword(input);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("Error en BD");
			}
		});
	});

	describe("verifyResetCode", () => {
		it("should verify reset code and return reset token", async () => {
			const input = {
				email: "john@example.com",
				code: "123456",
			};

			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
			};

			const mockResetRecord = {
				id: 1,
				user_id: 1,
				code: "123456",
				is_valid: true,
			};

			authModel.getUserByEmail.mockResolvedValue(mockUser);
			authModel.getResetCode.mockResolvedValue(mockResetRecord);
			jwt.sign.mockReturnValue("mock_reset_token");

			const result = await authService.verifyResetCode(input);

			expect(result).toEqual({
				resetToken: "mock_reset_token",
			});
			expect(jwt.sign).toHaveBeenCalledWith(
				{ userId: 1, code: "123456", type: "reset" },
				process.env.JWT_SECRET,
				{ expiresIn: "10m" }
			);
		});

		it("should throw error when user not found", async () => {
			const input = {
				email: "nonexistent@example.com",
				code: "123456",
			};

			authModel.getUserByEmail.mockResolvedValue(null);

			try {
				await authService.verifyResetCode(input);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Código inválido o expirado.");
				expect(error.statusCode).toBe(400);
			}
		});

		it("should throw error when reset code not found", async () => {
			const input = {
				email: "john@example.com",
				code: "123456",
			};

			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
			};

			authModel.getUserByEmail.mockResolvedValue(mockUser);
			authModel.getResetCode.mockResolvedValue(null);

			try {
				await authService.verifyResetCode(input);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Código inválido o expirado.");
				expect(error.statusCode).toBe(400);
			}
		});

		it("should throw error when reset code is invalid", async () => {
			const input = {
				email: "john@example.com",
				code: "123456",
			};

			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
			};

			const mockResetRecord = {
				id: 1,
				user_id: 1,
				code: "123456",
				is_valid: false,
			};

			authModel.getUserByEmail.mockResolvedValue(mockUser);
			authModel.getResetCode.mockResolvedValue(mockResetRecord);

			try {
				await authService.verifyResetCode(input);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Código inválido o expirado.");
				expect(error.statusCode).toBe(400);
			}
		});
	});

	describe("resetPassword", () => {
		it("should reset password successfully", async () => {
			const input = { new_password: "newpassword123" };
			const mockResetToken = "mock_reset_token";
			const mockDecoded = { userId: 1, code: "123456", type: "reset" };
			const mockHashedPassword = "hashed_new_password";

			jwt.verify.mockReturnValue(mockDecoded);
			hashPassword.mockResolvedValue(mockHashedPassword);
			authModel.updateUserPassword.mockResolvedValue(true);
			authModel.useResetCode.mockResolvedValue(true);

			await authService.resetPassword(input, mockResetToken);

			expect(jwt.verify).toHaveBeenCalledWith(mockResetToken, process.env.JWT_SECRET);
			expect(hashPassword).toHaveBeenCalledWith("newpassword123");
			expect(authModel.updateUserPassword).toHaveBeenCalledWith(1, mockHashedPassword);
			expect(authModel.useResetCode).toHaveBeenCalledWith(1, "123456");
		});

		it("should throw error when reset token is missing", async () => {
			const input = { new_password: "newpassword123" };

			try {
				await authService.resetPassword(input, null);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Token de recuperación requerido.");
				expect(error.statusCode).toBe(400);
			}
		});

		it("should throw error when reset token is invalid", async () => {
			const input = { new_password: "newpassword123" };
			const mockResetToken = "invalid_token";

			jwt.verify.mockImplementation(() => {
				throw new Error("Invalid token");
			});

			try {
				await authService.resetPassword(input, mockResetToken);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Token de recuperación inválido o expirado.");
				expect(error.statusCode).toBe(400);
			}
		});

		it("should throw error when token type is not reset", async () => {
			const input = { new_password: "newpassword123" };
			const mockResetToken = "wrong_type_token";
			const mockDecoded = { userId: 1, code: "123456", type: "access" };

			jwt.verify.mockReturnValue(mockDecoded);

			try {
				await authService.resetPassword(input, mockResetToken);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Token de recuperación inválido o expirado.");
				expect(error.statusCode).toBe(400);
			}
		});

		it("should handle database errors on password reset", async () => {
			const input = { new_password: "newpassword123" };
			const mockResetToken = "mock_reset_token";
			const mockDecoded = { userId: 1, code: "123456", type: "reset" };
			const mockError = new Error("USER_NOT_FOUND");
			const mockAppError = new AppError("Usuario no encontrado", 404);

			jwt.verify.mockReturnValue(mockDecoded);
			hashPassword.mockResolvedValue("hashed_password");
			authModel.updateUserPassword.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await authService.resetPassword(input, mockResetToken);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("Usuario no encontrado");
			}
		});
	});

	describe("getProfile", () => {
		it("should get user profile successfully", async () => {
			const userId = 1;
			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
				phone_number: "87654321",
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: "https://example.com/photo.jpg",
				is_active: true,
			};

			authModel.getUserById.mockResolvedValue(mockUser);

			const result = await authService.getProfile(userId);

			expect(result).toEqual({
				id: 1,
				name: "John Doe",
				email: "john@example.com",
				phoneNumber: "87654321",
				rolId: 3,
				rolName: "Donante",
				profilePhotoUrl: "https://example.com/photo.jpg",
				isActive: true,
			});
			expect(authModel.getUserById).toHaveBeenCalledWith(userId);
		});

		it("should handle database errors on get profile", async () => {
			const userId = 999;
			const mockError = new Error("USER_NOT_FOUND: Usuario no encontrado");
			const mockAppError = new AppError("Usuario no encontrado", 404);

			authModel.getUserById.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await authService.getProfile(userId);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("Usuario no encontrado");
			}
		});
	});

	describe("updateProfile", () => {
		it("should update profile without photo", async () => {
			const userId = 1;
			const input = {
				name: "Jane Doe",
				phone_number: "98765432",
			};

			const mockUpdated = {
				id: 1,
				name: "Jane Doe",
				email: "john@example.com",
				phone_number: "98765432",
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: null,
				is_active: true,
			};

			authModel.updateUser.mockResolvedValue(mockUpdated);

			const result = await authService.updateProfile(userId, input, null);

			expect(result).toEqual({
				id: 1,
				name: "Jane Doe",
				email: "john@example.com",
				phoneNumber: "98765432",
				rolId: 3,
				rolName: "Donante",
				profilePhotoUrl: null,
				isActive: true,
			});
			expect(authModel.updateUser).toHaveBeenCalledWith(userId, "Jane Doe", "98765432", null);
		});

		it("should update profile with photo", async () => {
			const userId = 1;
			const input = {
				name: "Jane Doe",
				phone_number: "98765432",
			};
			const mockFile = {
				buffer: Buffer.from("image data"),
			};

			const mockCurrentUser = {
				id: 1,
				profile_photo_url: "https://example.com/old_photo.jpg",
			};

			const mockUploadedPhoto = {
				url: "https://example.com/new_photo.jpg",
			};

			const mockUpdated = {
				id: 1,
				name: "Jane Doe",
				email: "john@example.com",
				phone_number: "98765432",
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: "https://example.com/new_photo.jpg",
				is_active: true,
			};

			authModel.getUserById.mockResolvedValue(mockCurrentUser);
			extractPublicId.mockReturnValue("old_photo_id");
			uploadImage.mockResolvedValue(mockUploadedPhoto);
			deleteImage.mockResolvedValue(true);
			authModel.updateUser.mockResolvedValue(mockUpdated);

			const result = await authService.updateProfile(userId, input, mockFile);

			expect(result.profilePhotoUrl).toBe("https://example.com/new_photo.jpg");
			expect(uploadImage).toHaveBeenCalledWith(mockFile.buffer, "sistratec/profiles");
			expect(deleteImage).toHaveBeenCalledWith("old_photo_id");
			expect(authModel.updateUser).toHaveBeenCalledWith(
				userId,
				"Jane Doe",
				"98765432",
				"https://example.com/new_photo.jpg"
			);
		});

		it("should handle photo deletion failure gracefully", async () => {
			const userId = 1;
			const input = {
				name: "Jane Doe",
			};
			const mockFile = {
				buffer: Buffer.from("image data"),
			};

			const mockCurrentUser = {
				id: 1,
				profile_photo_url: "https://example.com/old_photo.jpg",
			};

			const mockUploadedPhoto = {
				url: "https://example.com/new_photo.jpg",
			};

			const mockUpdated = {
				id: 1,
				name: "Jane Doe",
				email: "john@example.com",
				phone_number: null,
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: "https://example.com/new_photo.jpg",
				is_active: true,
			};

			authModel.getUserById.mockResolvedValue(mockCurrentUser);
			extractPublicId.mockReturnValue("old_photo_id");
			uploadImage.mockResolvedValue(mockUploadedPhoto);
			deleteImage.mockRejectedValue(new Error("Cloudinary error"));
			authModel.updateUser.mockResolvedValue(mockUpdated);

			const result = await authService.updateProfile(userId, input, mockFile);

			expect(result.name).toBe("Jane Doe");
			expect(authModel.updateUser).toHaveBeenCalled();
		});

		it("should handle null old photo gracefully", async () => {
			const userId = 1;
			const input = {
				name: "Jane Doe",
			};
			const mockFile = {
				buffer: Buffer.from("image data"),
			};

			const mockCurrentUser = {
				id: 1,
				profile_photo_url: null,
			};

			const mockUploadedPhoto = {
				url: "https://example.com/new_photo.jpg",
			};

			const mockUpdated = {
				id: 1,
				name: "Jane Doe",
				email: "john@example.com",
				phone_number: null,
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: "https://example.com/new_photo.jpg",
				is_active: true,
			};

			authModel.getUserById.mockResolvedValue(mockCurrentUser);
			extractPublicId.mockReturnValue(null);
			uploadImage.mockResolvedValue(mockUploadedPhoto);
			authModel.updateUser.mockResolvedValue(mockUpdated);

			const result = await authService.updateProfile(userId, input, mockFile);

			expect(result.profilePhotoUrl).toBe("https://example.com/new_photo.jpg");
			expect(deleteImage).not.toHaveBeenCalled();
		});

		it("should handle database errors on update", async () => {
			const userId = 1;
			const input = {
				name: "Jane Doe",
			};

			const mockError = new Error("USER_NOT_FOUND: Usuario no encontrado");
			const mockAppError = new AppError("Usuario no encontrado", 404);

			authModel.updateUser.mockRejectedValue(mockError);
			handleDbError.mockReturnValue(mockAppError);

			try {
				await authService.updateProfile(userId, input, null);
				fail("Should have thrown error");
			} catch (error) {
				expect(handleDbError).toHaveBeenCalledWith(mockError);
				expect(error.message).toBe("Usuario no encontrado");
			}
		});

		it("should rethrow operational errors", async () => {
			const userId = 1;
			const input = {
				name: "Jane Doe",
			};

			const operationalError = new AppError("Custom error", 400);
			operationalError.isOperational = true;

			authModel.updateUser.mockRejectedValue(operationalError);

			try {
				await authService.updateProfile(userId, input, null);
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Custom error");
				expect(handleDbError).not.toHaveBeenCalled();
			}
		});

		it("should update only name", async () => {
			const userId = 1;
			const input = {
				name: "Jane Doe",
			};

			const mockUpdated = {
				id: 1,
				name: "Jane Doe",
				email: "john@example.com",
				phone_number: null,
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: null,
				is_active: true,
			};

			authModel.updateUser.mockResolvedValue(mockUpdated);

			const result = await authService.updateProfile(userId, input, null);

			expect(result.name).toBe("Jane Doe");
			expect(authModel.updateUser).toHaveBeenCalledWith(userId, "Jane Doe", null, null);
		});

		it("should update only phone number", async () => {
			const userId = 1;
			const input = {
				phone_number: "98765432",
			};

			const mockUpdated = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
				phone_number: "98765432",
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: null,
				is_active: true,
			};

			authModel.updateUser.mockResolvedValue(mockUpdated);

			const result = await authService.updateProfile(userId, input, null);

			expect(result.phoneNumber).toBe("98765432");
			expect(authModel.updateUser).toHaveBeenCalledWith(userId, null, "98765432", null);
		});
	});

	describe("Edge cases and token generation", () => {
		it("should generate tokens with correct payload", async () => {
			const input = {
				email: "john@example.com",
				password: "password123",
			};

			const mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
				password: "hashed_password",
				rol_id: 3,
				rol_name: "Donante",
				is_active: true,
			};

			const mockRes = {
				cookie: jest.fn(),
			};

			authModel.getUserByEmail.mockResolvedValue(mockUser);
			comparePassword.mockResolvedValue(true);
			jwt.sign.mockReturnValueOnce("mock_access").mockReturnValueOnce("mock_refresh");

			await authService.login(input, mockRes);

			const signCalls = jwt.sign.mock.calls;
			expect(signCalls[0][0]).toEqual({
				userId: 1,
				rolName: "Donante",
				rolId: 3,
			});
			expect(signCalls[0][1]).toBe(process.env.JWT_SECRET);
			expect(signCalls[0][2]).toEqual({ expiresIn: "15m" });

			expect(signCalls[1][0]).toEqual({ userId: 1 });
			expect(signCalls[1][1]).toBe(process.env.JWT_REFRESH_SECRET);
			expect(signCalls[1][2]).toEqual({ expiresIn: "7d" });
		});

		it("should handle empty input fields gracefully", async () => {
			const input = {
				name: "",
				email: "john@example.com",
				password: "password123",
			};

			const mockHashedPassword = "hashed_password";
			const mockUser = {
				id: 1,
				name: "",
				email: "john@example.com",
				password: mockHashedPassword,
				phone_number: null,
				rol_id: 3,
				rol_name: "Donante",
				profile_photo_url: null,
				is_active: true,
			};

			hashPassword.mockResolvedValue(mockHashedPassword);
			authModel.createUser.mockResolvedValue(mockUser);
			welcomeEmail.html = jest.fn().mockReturnValue("<html></html>");
			sendEmail.mockResolvedValue(true);
			dispatchNotification.mockResolvedValue(true);

			const result = await authService.register(input);

			expect(result.name).toBe("");
		});

		it("should set correct cookie httpOnly flag", () => {
			const mockRes = {
				clearCookie: jest.fn(),
			};

			authService.logout(mockRes);

			const callArgs = mockRes.clearCookie.mock.calls[0];
			const options = callArgs[1];
			expect(options.httpOnly).toBe(true);
		});
	});
});
