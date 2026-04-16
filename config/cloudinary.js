const cloudinary = require('cloudinary').v2;

// Check if Cloudinary is configured
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('☁️ Cloudinary configured successfully');
} else {
    console.log('⚠️ Cloudinary not configured - will use Base64 fallback');
}

module.exports = cloudinary;