const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const Item = require('../models/Item');

// Submit Claim
router.post('/', async (req, res) => {
    try {
        const { item_id, claimant_id, proof_description } = req.body;
        
        const existingClaim = await Claim.findOne({ item_id, claimant_id });
        if (existingClaim) {
            return res.status(400).json({ error: 'You have already claimed this item' });
        }
        
        const claim = new Claim({
            item_id,
            claimant_id,
            proof_description,
            status: 'pending'
        });
        
        await claim.save();
        res.status(201).json(claim);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get User's Claims
router.get('/user/:userId', async (req, res) => {
    try {
        const claims = await Claim.find({ claimant_id: req.params.userId })
            .populate('item_id')
            .sort({ createdAt: -1 });
        res.json(claims);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;