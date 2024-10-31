const express = require('express');
const bcrypt = require('bcryptjs'); // for hashing passwords
const jwt = require('jsonwebtoken'); // for generating JSON Web Tokens

require('dotenv').config();

const User = require('../models/user');
const route = express.Router();

// Endpoint for user registration
route.post('/register', async (req, res) => {
    const { password, username, email } = req.body;

    // console.log( `${password} and ${username} and ${email}`)

    if (!password || !username || !email) {
        return res.status(400).json({ status: "error", msg: "All fields must be filled" });
    }

    try {
        const existingUser = await User.findOne({ email }).lean();
        if (existingUser) {
            return res.status(400).json({ status: 'error', msg: `User with this email: ${email} already exists` });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
       
        await user.save();

        return res.status(201).json({ status: 'ok', msg: 'Registration successful', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", msg: "An error occurred during registration" });
    }
});

// Endpoint for user login
route.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: 'error', msg: 'All fields must be filled' });
    }

    try {
        const user = await User.findOne({ email }).lean();
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ status: 'error', msg: 'Email or password is incorrect' });
        }
        
        const token = jwt.sign(
            { _id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            status: 'success',
            msg: 'Login successful',
            data: { user, token }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", msg: "An error occurred during login" });
    }
});

// Endpoint to logout
route.post('/logout', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(400).json({ status: 'error', msg: 'No token provided, authorization denied' });
    }

    // For stateless JWT logout, simply instruct client to discard the token
    res.status(200).json({ status: 'success', msg: 'Successfully logged out' });
});

// Endpoint to verify token
route.get('/verify', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ status: 'error', msg: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ status: 'error', msg: 'Invalid token' });
        res.status(200).json({ status: 'success', msg: 'Token is valid', userId: decoded._id });
    });
});

// Endpoint to reset password
route.put('/reset_password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(401).json({ status: 'error', msg: 'Unauthorized' });
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ status: 'error', msg: 'Old and new passwords are required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);

        if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(400).json({ status: 'error', msg: 'Old password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ status: 'success', msg: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Error resetting password' });
    }
});

module.exports = route;