const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const upload = require('../middleware/upload');

// Post Lost Item
router.post('/lost', upload.single('image'), async (req, res) => {
    try {
        const { item_name, description, location, date, user_id } = req.body;
        
        const item = new Item({
            item_name,
            description,
            location,
            date: date || new Date(),
            category: 'lost',
            image: req.file ? `/uploads/${req.file.filename}` : null,
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
        
        const item = new Item({
            item_name,
            description,
            location,
            date: date || new Date(),
            category: 'found',
            image: req.file ? `/uploads/${req.file.filename}` : null,
            user_id,
            status: 'pending'
        });
        
        await item.save();
        res.status(201).json(item);
    } catch (error) {
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