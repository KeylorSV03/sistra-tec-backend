const multer = require("multer");
const AppError = require("../errors/AppError");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return cb(new AppError("Solo se permiten imágenes JPG, PNG o WEBP.", 400));
        }
        cb(null, true);
    },
});

module.exports = upload;
