const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper: Upload to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'lost-found-system', resource_type: 'auto' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// Helper: Convert to Base64
const convertToBase64 = (file) => {
    const mimeType = file.mimetype || 'image/jpeg';
    const base64Data = file.buffer.toString('base64');
    return `data:${mimeType};base64,${base64Data}`;
};

// Post Lost Item
router.post('/lost', upload.single('image'), async (req, res) => {
    try {
        const { item_name, description, location, date, user_id } = req.body;
        
        let imageUrl = null;
        
        if (req.file) {
            try {
                // Try Cloudinary first
                if (process.env.CLOUDINARY_CLOUD_NAME) {
                    const result = await uploadToCloudinary(req.file.buffer);
                    imageUrl = result.secure_url;
                    console.log('✅ Image uploaded to Cloudinary');
                } else {
                    // Fallback to Base64
                    imageUrl = convertToBase64(req.file);
                    console.log('✅ Image saved as Base64 (Cloudinary not configured)');
                }
            } catch (uploadError) {
                // Cloudinary failed, use Base64
                console.log('⚠️ Cloudinary failed, using Base64 fallback');
                imageUrl = convertToBase64(req.file);
            }
        }
        
        const item = new Item({
            item_name,
            description,
            location,
            date: date || new Date(),
            category: 'lost',
            image: imageUrl,
            user_id,
            status: 'pending'
        });
        
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        console.error('Error posting lost item:', error);
        res.status(500).json({ error: error.message });
    }
});

// Post Found Item
router.post('/found', upload.single('image'), async (req, res) => {
    try {
        const { item_name, description, location, date, user_id } = req.body;
        
        let imageUrl = null;
        
        if (req.file) {
            try {
                if (process.env.CLOUDINARY_CLOUD_NAME) {
                    const result = await uploadToCloudinary(req.file.buffer);
                    imageUrl = result.secure_url;
                    console.log('✅ Image uploaded to Cloudinary');
                } else {
                    imageUrl = convertToBase64(req.file);
                    console.log('✅ Image saved as Base64');
                }
            } catch (uploadError) {
                console.log('⚠️ Cloudinary failed, using Base64 fallback');
                imageUrl = convertToBase64(req.file);
            }
        }
        
        const item = new Item({
            item_name,
            description,
            location,
            date: date || new Date(),
            category: 'found',
            image: imageUrl,
            user_id,
            status: 'pending'
        });
        
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        console.error('Error posting found item:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Lost Items
router.get('/lost', async (req, res) => {
    try {
        const { role } = req.query;
        let query = { category: 'lost' };
        
        if (role !== 'admin') {
            query.status = 'approved';
        }
        
        const items = await Item.find(query)
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Found Items
router.get('/found', async (req, res) => {
    try {
        const { role } = req.query;
        let query = { category: 'found' };
        
        if (role !== 'admin') {
            query.status = 'approved';
        }
        
        const items = await Item.find(query)
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get User's Items
router.get('/user/:userId', async (req, res) => {
    try {
        const items = await Item.find({ user_id: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search items
router.get('/search', async (req, res) => {
    try {
        const { q, category, location, dateFrom, role } = req.query;
        let query = {};
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (role !== 'admin') {
            query.status = 'approved';
        }
        
        if (q) {
            query.$or = [
                { item_name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }
        
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        
        if (dateFrom) {
            query.date = { $gte: new Date(dateFrom) };
        }
        
        const items = await Item.find(query)
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 });
        
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Stats
router.get('/stats/data', async (req, res) => {
    try {
        const lostCount = await Item.countDocuments({ category: 'lost', status: 'approved' });
        const foundCount = await Item.countDocuments({ category: 'found', status: 'approved' });
        const claimedCount = await Item.countDocuments({ status: 'claimed' });
        
        res.json({ lostCount, foundCount, claimedCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;