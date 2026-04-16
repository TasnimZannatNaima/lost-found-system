const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { sendEmail, emailTemplates } = require('../config/email');

// Get Pending Items
router.get('/pending', async (req, res) => {
    try {
        const items = await Item.find({ status: 'pending' })
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Item Status (Approve/Reject)
router.put('/item/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('user_id', 'name email');
        
        // Send email notification
        if (item && item.user_id && item.user_id.email) {
            if (status === 'approved') {
                await sendEmail(
                    item.user_id.email,
                    '✅ Your item has been approved!',
                    emailTemplates.itemApproved(item.user_id.name, item.item_name)
                );
                console.log('📧 Approval email sent to:', item.user_id.email);
            } else if (status === 'rejected') {
                await sendEmail(
                    item.user_id.email,
                    'Update about your item',
                    emailTemplates.itemRejected(item.user_id.name, item.item_name)
                );
                console.log('📧 Rejection email sent to:', item.user_id.email);
            }
        }
        
        res.json(item);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete Item
router.delete('/item/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        
        // Delete from Cloudinary if it's a Cloudinary URL
        if (item && item.image && item.image.includes('cloudinary.com')) {
            try {
                const publicId = item.image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`lost-found-system/${publicId}`);
                console.log('🗑️ Image deleted from Cloudinary');
            } catch (err) {
                console.warn('⚠️ Could not delete from Cloudinary:', err.message);
            }
        }
        
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Claims
router.get('/claims', async (req, res) => {
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
router.put('/claim/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const claim = await Claim.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('item_id').populate('claimant_id', 'name email');
        
        if (status === 'approved') {
            await Item.findByIdAndUpdate(claim.item_id, { status: 'claimed' });
        }
        
        if (claim && claim.claimant_id && claim.claimant_id.email) {
            await sendEmail(
                claim.claimant_id.email,
                `Claim ${status}`,
                emailTemplates.claimStatusUpdate(claim.claimant_id.name, claim.item_id.item_name, status)
            );
        }
        
        res.json(claim);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;