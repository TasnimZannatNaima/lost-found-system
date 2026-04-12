const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        const user = new User({ name, email, password, role: 'user' });
        await user.save();
        
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
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
            role: user.role
        };
        
        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user
router.get('/me/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;