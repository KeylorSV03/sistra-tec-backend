require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const path = require("path");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const logoPath = path.join(__dirname, "../src/assets/logo.png");

cloudinary.uploader.upload(logoPath, {
    folder: "sistratec/assets",
    public_id: "logo",
    overwrite: true,
})
.then((result) => {
    console.log("\n✅ Logo subido correctamente.");
    console.log("URL:", result.secure_url);
    console.log("\nAgregá esta línea al .env:");
    console.log(`LOGO_URL=${result.secure_url}`);
})
.catch((err) => {
    console.error("❌ Error al subir el logo:", err.message);
});
