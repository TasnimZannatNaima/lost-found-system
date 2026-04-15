const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const User = require('../models/User');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const { sendEmail, emailTemplates } = require('../config/email');

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'lost-found-system',
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
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
                if (process.env.CLOUDINARY_CLOUD_NAME) {
                    const result = await uploadToCloudinary(req.file.buffer);
                    imageUrl = result.secure_url;
                } else {
                    const mimeType = req.file.mimetype;
                    const base64Data = req.file.buffer.toString('base64');
                    imageUrl = `data:${mimeType};base64,${base64Data}`;
                }
            } catch (uploadError) {
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
                } else {
                    const mimeType = req.file.mimetype;
                    const base64Data = req.file.buffer.toString('base64');
                    imageUrl = `data:${mimeType};base64,${base64Data}`;
                }
            } catch (uploadError) {
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
        res.status(500).json({ error: error.message });
    }
});

// Get Lost Items (with search)
router.get('/lost', async (req, res) => {
    try {
        const { role, search, location } = req.query;
        let query = { category: 'lost' };
        
        if (role !== 'admin') {
            query.status = 'approved';
        }
        
        // Search functionality
        if (search) {
            query.$or = [
                { item_name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Location filter
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        
        const items = await Item.find(query)
            .populate('user_id', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Found Items (with search)
router.get('/found', async (req, res) => {
    try {
        const { role, search, location } = req.query;
        let query = { category: 'found' };
        
        if (role !== 'admin') {
            query.status = 'approved';
        }
        
        // Search functionality
        if (search) {
            query.$or = [
                { item_name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Location filter
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        
        const items = await Item.find(query)
            .populate('user_id', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Advanced search endpoint
router.get('/search', async (req, res) => {
    try {
        const { q, category, location, dateFrom, dateTo, role } = req.query;
        let query = {};
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (role !== 'admin') {
            query.status = 'approved';
        }
        
        // Text search
        if (q) {
            query.$or = [
                { item_name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }
        
        // Location filter
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        
        // Date range filter
        if (dateFrom || dateTo) {
            query.date = {};
            if (dateFrom) query.date.$gte = new Date(dateFrom);
            if (dateTo) query.date.$lte = new Date(dateTo);
        }
        
        const items = await Item.find(query)
            .populate('user_id', 'name email phone')
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