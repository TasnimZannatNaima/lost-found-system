const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../config/email');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        const user = new User({ 
            name, 
            email, 
            password, 
            phone: phone || '',
            role: 'user' 
        });
        await user.save();
        
        // Send welcome email
        await sendEmail(
            email,
            'Welcome to Lost & Found System!',
            emailTemplates.welcome(name)
        );
        
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };
        
        res.status(201).json(userResponse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };
        
        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;