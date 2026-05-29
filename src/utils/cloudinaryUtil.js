const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
                if (error) reject(error);
                else resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });
};

const deleteImage = async (publicId) => {
    await cloudinary.uploader.destroy(publicId);
};

const updateImage = async (oldPublicId, buffer, folder) => {
    if (oldPublicId) await deleteImage(oldPublicId);
    return uploadImage(buffer, folder);
};

// Extrae el public_id de una URL de Cloudinary
// Ej: https://res.cloudinary.com/cloud/image/upload/v123/sistratec/profiles/abc.jpg
//     → sistratec/profiles/abc
const extractPublicId = (url) => {
    if (!url) return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
    return match ? match[1] : null;
};

module.exports = { uploadImage, deleteImage, updateImage, extractPublicId };
