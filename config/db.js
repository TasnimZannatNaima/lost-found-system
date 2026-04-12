const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect("mongodb+srv://naima:amiright@lostfound.kotrcun.mongodb.net/lostfound?appName=lostfound");
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Create default admin if not exists
        const User = require('../models/User');
        const adminExists = await User.findOne({ email: 'admin@lostfound.com' });
        if (!adminExists) {
            await User.create({
                name: 'System Admin',
                email: 'admin@lostfound.com',
                password: 'admin123',
                role: 'admin'
            });
            console.log('Default admin created: admin@lostfound.com / admin123');
        }
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

connectDB();