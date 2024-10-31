const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const route = express.Router();
require ('dotenv').config()


//util
const cloudinary = require("../utils/cloudinary")
const uploader = require("../utils/multer");

// Middleware to verify token and get user from token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ status: 'error', msg: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ status: 'error', msg: 'Invalid token' });
        req.userId = decoded._id; // attach user ID to request object
        next();
    });
};

// End point to Retrieve user profile details
route.get('/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password -notifications');
        if (!user) return res.status(404).json({ status: 'error', msg: 'User not found' });

        res.status(200).json({ status: 'success', msg: 'Profile retrieved', profile: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Error retrieving profile' });
    }
});

// Endpoint to Update user profile information
route.put('/user/profile',  uploader.single("file"), authenticateToken, async (req, res) => {
    const { username, email } = req.body;
    
    try {

        let profilePic, profilePic_id;
        // check if file was sent in and upload to cloudinary
        if(req.file) {
          console.log("present")
            // folder is used to specify the folder name you want the file to be saved in
            const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {folder: 'Profile_pics'}, (error, result) => {             
              if (error) {
                console.error("upload failed", error);
              } else {
                console.error("file uploaded successfully", result);
              }
            });
            profilePic = secure_url;
            profilePic_id = public_id;
        }        

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ status: 'error', msg: 'User not found' });

        // Update fields only if they are provided
        if (username) user.username = username;
        if (email) user.email = email;
        user.profilePic = profilePic;
        user.profilePic_id = profilePic_id

        await user.save();
        res.status(200).json({ status: 'success', msg: 'Profile updated successfully', profile: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Error updating profile' });
    }
});

// Endpoint to Fetch notifications for updates
route.get('/user/notifications', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('notifications');
        if (!user) return res.status(404).json({ status: 'error', msg: 'User not found' });

        res.status(200).json({ status: 'success', msg: 'Notifications retrieved', notifications: user.notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Error retrieving notifications' });
    }
});

// Endpoint to Mark notifications as read
route.put('/user/notifications/mark-read', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ status: 'error', msg: 'User not found' });

        // Mark all notifications as read
        user.notifications.forEach(notification => {
            notification.read = true;
        });

        await user.save();
        res.status(200).json({ status: 'success', msg: 'Notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Error marking notifications as read' });
    }
});

module.exports = route;
