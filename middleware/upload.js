const multer = require('multer');
const path = require('path');

// Memory storage for both Cloudinary and Base64
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP)'));
    }
};

const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024  // 10MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;