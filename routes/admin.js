const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const fs = require('fs');
const path = require('path');

// Middleware to check admin (simplified)
const isAdmin = (req, res, next) => {
    // In production, use proper auth middleware
    next();
};

// Get Pending Items
router.get('/pending', isAdmin, async (req, res) => {
    try {
        const items = await Item.find({ status: 'pending' })
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Item Status
router.put('/item/:id', isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Item
router.delete('/item/:id', isAdmin, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (item && item.image) {
            const imagePath = path.join(__dirname, '..', item.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Claims
router.get('/claims', isAdmin, async (req, res) => {
    try {
        const claims = await Claim.find()
            .populate('item_id')
            .populate('claimant_id', 'name email')
            .sort({ createdAt: -1 });
        res.json(claims);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Claim Status
router.put('/claim/:id', isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const claim = await Claim.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (status === 'approved') {
            await Item.findByIdAndUpdate(claim.item_id, { status: 'claimed' });
        }
        
        res.json(claim);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;