const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const Item = require('../models/Item');
const { sendEmail, emailTemplates } = require('../config/email');

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
        
        // Get populated data for email
        const populatedClaim = await Claim.findById(claim._id)
            .populate('item_id')
            .populate('claimant_id', 'name email');
        
        // Send confirmation email to claimant
        if (populatedClaim.claimant_id && populatedClaim.claimant_id.email) {
            await sendEmail(
                populatedClaim.claimant_id.email,
                'Claim Submitted Successfully',
                emailTemplates.claimSubmitted(
                    populatedClaim.claimant_id.name,
                    populatedClaim.item_id.item_name
                )
            );
        }
        
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