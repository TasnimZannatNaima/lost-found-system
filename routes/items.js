const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'lost-found-system',
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// Post Lost Item
router.post('/lost', upload.single('image'), async (req, res) => {
    try {
        const { item_name, description, location, date, user_id } = req.body;
        
        let imageUrl = null;
        
        if (req.file) {
            try {
                // Try Cloudinary first if configured
                if (process.env.CLOUDINARY_CLOUD_NAME) {
                    const result = await uploadToCloudinary(req.file.buffer);
                    imageUrl = result.secure_url;
                    console.log('✅ Image uploaded to Cloudinary:', imageUrl);
                } else {
                    // Fallback to Base64 if Cloudinary not configured
                    const mimeType = req.file.mimetype;
                    const base64Data = req.file.buffer.toString('base64');
                    imageUrl = `data:${mimeType};base64,${base64Data}`;
                    console.log('⚠️ Cloudinary not configured, using Base64 fallback');
                }
            } catch (uploadError) {
                console.error('❌ Cloudinary upload failed, using Base64:', uploadError.message);
                // Fallback to Base64 if Cloudinary fails
                const mimeType = req.file.mimetype;
                const base64Data = req.file.buffer.toString('base64');
                imageUrl = `data:${mimeType};base64,${base64Data}`;
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
                // Try Cloudinary first if configured
                if (process.env.CLOUDINARY_CLOUD_NAME) {
                    const result = await uploadToCloudinary(req.file.buffer);
                    imageUrl = result.secure_url;
                    console.log('✅ Image uploaded to Cloudinary:', imageUrl);
                } else {
                    // Fallback to Base64 if Cloudinary not configured
                    const mimeType = req.file.mimetype;
                    const base64Data = req.file.buffer.toString('base64');
                    imageUrl = `data:${mimeType};base64,${base64Data}`;
                    console.log('⚠️ Cloudinary not configured, using Base64 fallback');
                }
            } catch (uploadError) {
                console.error('❌ Cloudinary upload failed, using Base64:', uploadError.message);
                // Fallback to Base64 if Cloudinary fails
                const mimeType = req.file.mimetype;
                const base64Data = req.file.buffer.toString('base64');
                imageUrl = `data:${mimeType};base64,${base64Data}`;
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

// Get Item by ID
router.get('/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('user_id', 'name email');
        res.json(item);
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