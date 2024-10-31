const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

//model
const Media = require('../models/media');

//util
const cloudinary = require("../utils/cloudinary");
const uploader = require("../utils/multer");

const route = express.Router();

// Middleware for token authentication
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ status: 'error', msg: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ status: 'error', msg: 'Invalid token' });
        req.userId = decoded._id; // attach user ID to request object
        next();
    });
};

// Endpoint to upload a new file
route.post('/admin/upload', authenticateToken, uploader.single("file"), async (req, res) => {
    const { fileType, title, description } = req.body;

    try {
        let fileUrl, fileId;

        if (req.file) {
            const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
                resource_type: 'video',
                folder: 'file_Upload'
            });

            fileUrl = secure_url.replace('/upload/', '/upload/fl_attachment/');
            fileId = public_id;
        }

        const media = new Media({ title, description, fileType, fileUrl, fileId });
        await media.save();

        return res.status(201).json({ status: 'ok', msg: 'File uploaded successfully', media });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Failed to upload file', error: error.message });
    }
});

// Endpoint to delete a file
route.delete('/admin/delete', authenticateToken, async (req, res) => {
    const {fileId} = req.body;

    try {
        const result = await cloudinary.uploader.destroy(fileId);
        
        if (result.result === 'ok') {
            await Media.deleteOne({ fileId });
            return res.status(200).json({ status: 'ok', msg: 'File deleted successfully' });
        } else {
            return res.status(400).json({ status: 'error', msg: 'Failed to delete file from Cloudinary' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Failed to delete file', error: error.message });
    }
});

// Endpoint to edit file details
route.put('/admin/edit', authenticateToken, async (req, res) => {
    // const fileId = req.params.id;
    const { title, description, fileId } = req.body;

    try {
        const media = await Media.findOne({ fileId });
        
        if (!media) return res.status(404).json({ status: 'error', msg: 'File not found' });

        media.title = title;
        media.description = description;
        await media.save();

        return res.status(200).json({ status: 'ok', msg: 'File details updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Failed to update file details', error: error.message });
    }
});

// Endpoint to list all available videos
route.get('/media/videos', authenticateToken, async (req, res) => {
    try {
        const videos = await Media.find({ fileType: 'video' });
        res.status(200).json({ status: 'ok', videos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Failed to retrieve videos', error: error.message });
    }
});

// Endpoint to list all available audios
route.get('/media/audios', authenticateToken, async (req, res) => {
    try {
        const audios = await Media.find({ fileType: 'audio' });
        res.status(200).json({ status: 'ok', audios });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Failed to retrieve audios', error: error.message });
    }
});

// Endpoint to download a specific media file
route.post('/media/download', authenticateToken, async (req, res) => {
    const { fileId } = req.body;

    try {
        // Find the media document by fileId
        const media = await Media.findOne({ fileId });
        
        if (!media) return res.status(404).json({ status: 'error', msg: 'File not found' });

        // Provide a direct download link to the file
        res.status(200).json({ status: 'ok', downloadUrl: media.fileUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Failed to retrieve download link', error: error.message });
    }
});


// Endpoint to fetch the latest videos/audios
route.get('/media/latest', authenticateToken, async (req, res) => {
    try {
        const latestMedia = await Media.find()
            .sort({ createdAt: -1 }) 
            .limit(10); // Fetch the latest 10 media items (adjust as needed)

        res.status(200).json({ status: 'ok', latestMedia });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Failed to retrieve latest media', error: error.message });
    }
});

// Endpoint to retrieve detailed info about a specific media item
route.post('/media/details', authenticateToken, async (req, res) => {
    const { fileId } = req.body;

    try {
        const media = await Media.findOne({ fileId });
        
        if (!media) return res.status(404).json({ status: 'error', msg: 'File not found' });

        // Return detailed media information
        res.status(200).json({ status: 'ok', media });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Failed to retrieve media details', error: error.message });
    }
});



module.exports = route;
