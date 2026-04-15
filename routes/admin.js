const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { sendEmail, emailTemplates } = require('../config/email');

// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

// Update Item Status
router.put('/item/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('user_id', 'name email');
        
        // Send email notification to item owner
        if (item && item.user_id && item.user_id.email) {
            if (status === 'approved') {
                await sendEmail(
                    item.user_id.email,
                    'Your item has been approved!',
                    emailTemplates.itemApproved(item.user_id.name, item.item_name, item._id)
                );
            } else if (status === 'rejected') {
                await sendEmail(
                    item.user_id.email,
                    'Update about your item',
                    emailTemplates.itemRejected(item.user_id.name, item.item_name)
                );
            }
        }
        
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Item
router.delete('/item/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id).populate('user_id', 'name email');
        
        if (item && item.image && item.image.includes('cloudinary.com')) {
            try {
                const publicId = item.image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`lost-found-system/${publicId}`);
            } catch (cloudinaryError) {
                console.warn('Could not delete from Cloudinary:', cloudinaryError.message);
            }
        }
        
        await Item.findByIdAndDelete(req.params.id);
        
        // Send rejection email if item was pending
        if (item && item.status === 'pending' && item.user_id && item.user_id.email) {
            await sendEmail(
                item.user_id.email,
                'Update about your item',
                emailTemplates.itemRejected(item.user_id.name, item.item_name)
            );
        }
        
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
            
            // Get item owner info
            const item = await Item.findById(claim.item_id).populate('user_id', 'name email');
            
            // Send email to claimant
            if (claim.claimant_id && claim.claimant_id.email) {
                await sendEmail(
                    claim.claimant_id.email,
                    'Your claim has been approved!',
                    emailTemplates.claimStatusUpdate(claim.claimant_id.name, claim.item_id.item_name, 'approved')
                );
            }
            
            // Send email to item owner
            if (item && item.user_id && item.user_id.email) {
                await sendEmail(
                    item.user_id.email,
                    'Someone claimed your item',
                    emailTemplates.itemClaimed(item.user_id.name, claim.item_id.item_name, claim.claimant_id.name)
                );
            }
        } else if (status === 'rejected') {
            if (claim.claimant_id && claim.claimant_id.email) {
                await sendEmail(
                    claim.claimant_id.email,
                    'Update about your claim',
                    emailTemplates.claimStatusUpdate(claim.claimant_id.name, claim.item_id.item_name, 'rejected')
                );
            }
        }
        
        res.json(claim);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;