const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Model
const Media = require('../models/media');

// Utilities
const cloudinary = require("../utils/cloudinary");
const uploader = require("../utils/multer");

const route = express.Router();

// Middleware for token authentication
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ status: 'error', msg: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ status: 'error', msg: 'Invalid token' });
        req.userId = decoded._id; // Attach user ID to request object
        next();
    });
};

// Endpoint to upload a new file
route.post('/admin/upload', authenticateToken, uploader.single("file"), async (req, res) => {
    const { fileType, title, description, genre, category } = req.body;

    // Validate required fields
    if (!fileType || !title || !description || !genre || !category) {
        return res.status(400).json({
            status: 'error',
            msg: 'All required fields (fileType, title, description, genre, category) must be provided.'
        });
    }

    // Validate category and fileType
    const validCategories = ['movie', 'series', 'music'];
    const validFileTypes = ['video', 'audio'];

    if (!validCategories.includes(category)) {
        return res.status(400).json({ status: 'error', msg: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }

    if (!validFileTypes.includes(fileType)) {
        return res.status(400).json({ status: 'error', msg: `Invalid fileType. Must be one of: ${validFileTypes.join(', ')}` });
    }

    try {
        let fileUrl = null, fileId = null;

        // Upload file to Cloudinary if a file is provided
        if (req.file) {
            const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
                resource_type: fileType === 'video' ? 'video' : 'auto',
                folder: 'file_uploads'
            });

            fileUrl = secure_url.replace('/upload/', '/upload/fl_attachment/');
            fileId = public_id;
        } else {
            return res.status(400).json({ status: 'error', msg: 'No file uploaded.' });
        }

        // Create a new media document
        const media = new Media({
            title,
            description,
            fileType,
            genre,
            category,
            fileUrl,
            fileId
        });

        // Save media to the database
        await media.save();

        // Respond with success
        return res.status(200).json({
            status: 'ok',
            msg: 'File uploaded successfully.',
            media
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            msg: 'Failed to upload file.',
            error: error.message
        });
    }
});

// Endpoint to delete a file
route.delete('/admin/delete', authenticateToken, async (req, res) => {
    const { fileId } = req.body;

    // Validate that the fileId is provided
    if (!fileId) {
        return res.status(400).json({
            status: 'error',
            msg: 'fileId is required to delete the file.'
        });
    }

    try {
        // Attempt to delete the file from Cloudinary
        const result = await cloudinary.uploader.destroy(fileId);

        // Check the result of the Cloudinary deletion
        if (result.result === 'ok') {
            // Remove the media document from MongoDB
            const deletedMedia = await Media.findOneAndDelete({ fileId });

            if (deletedMedia) {
                return res.status(200).json({
                    status: 'ok',
                    msg: 'File deleted successfully',
                    media: deletedMedia
                });
            } else {
                return res.status(404).json({
                    status: 'error',
                    msg: 'Media not found in the database.'
                });
            }
        } else {
            return res.status(400).json({
                status: 'error',
                msg: 'Failed to delete file from Cloudinary.'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            msg: 'Failed to delete file.',
            error: error.message
        });
    }
});

// Endpoint to edit file details
route.put('/admin/edit', authenticateToken, async (req, res) => {
    const { title, description, genre, fileId } = req.body;

    // Validate that fileId, title, description, and genre are provided
    if (!fileId) {
        return res.status(400).json({ status: 'error', msg: 'fileId is required' });
    }
    if (!title || !description || !genre) {
        return res.status(400).json({ status: 'error', msg: 'Title, description, and genre are required' });
    }

    try {
        // Find the media document by fileId
        const media = await Media.findOne({ fileId });
        
        if (!media) {
            return res.status(404).json({ status: 'error', msg: 'File not found' });
        }

        // Update the media document with the new details
        media.title = title;
        media.description = description;
        media.genre = genre;  // Update the genre field
        await media.save();

        // Return success response with updated media details
        return res.status(200).json({ status: 'ok', msg: 'File details updated successfully', media });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', msg: 'Failed to update file details', error: error.message });
    }
});

// Endpoint to list all available videos
route.get('/media/videos', authenticateToken, async (req, res) => {
    const { genre, title, sortBy, page = 1, limit = 10 } = req.body;  // Pagination and filters

    try {
        // Construct filter object based on query parameters
        const filter = { fileType: 'video' };

        if (genre) filter.genre = genre;  // Filter by genre
        if (title) filter.title = { $regex: title, $options: 'i' };  // Filter by title (case-insensitive)

        // Sorting by a field (views or createdAt) - Default to createdAt
        const sortOptions = {};
        if (sortBy === 'views') {
            sortOptions.views = -1;  // Sort by views in descending order
        } else {
            sortOptions.createdAt = -1;  // Sort by createdAt in descending order (newest first)
        }

        // Calculate pagination options
        const skip = (page - 1) * limit;  // Skip based on the current page
        const totalVideos = await Media.countDocuments(filter);  // Get the total count of videos
        const totalPages = Math.ceil(totalVideos / limit);  // Calculate total pages

        // Get the videos with filtering, sorting, and pagination
        const videos = await Media.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit));

        res.status(200).json({
            status: 'ok',
            videos,
            pagination: {
                totalVideos,
                totalPages,
                currentPage: Number(page),
                pageSize: Number(limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            msg: 'Failed to retrieve videos',
            error: error.message
        });
    }
});

// Endpoint to list all available audio files
route.get('/media/audios', authenticateToken, async (req, res) => {
    const { genre, title, sortBy, page = 1, limit = 10 } = req.body;  // Pagination and filters

    try {
        // Construct filter object based on query parameters
        const filter = { fileType: 'audio' };

        if (genre) filter.genre = genre;  // Filter by genre
        if (title) filter.title = { $regex: title, $options: 'i' };  // Filter by title (case-insensitive)

        // Sorting by a field (views or createdAt) - Default to createdAt
        const sortOptions = {};
        if (sortBy === 'views') {
            sortOptions.views = -1;  // Sort by views in descending order
        } else {
            sortOptions.createdAt = -1;  // Sort by createdAt in descending order (newest first)
        }

        // Calculate pagination options
        const skip = (page - 1) * limit;  // Skip based on the current page
        const totalAudios = await Media.countDocuments(filter);  // Get the total count of audio files
        const totalPages = Math.ceil(totalAudios / limit);  // Calculate total pages

        // Get the audio files with filtering, sorting, and pagination
        const audios = await Media.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit));

        res.status(200).json({
            status: 'ok',
            audios,
            pagination: {
                totalAudios,
                totalPages,
                currentPage: Number(page),
                pageSize: Number(limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            msg: 'Failed to retrieve audio files',
            error: error.message
        });
    }
});

// Endpoint to download a specific media file
route.post('/media/download', authenticateToken, async (req, res) => {
    const { _id } = req.body;

    try {
        // Find the media document by fileId
        const media = await Media.findOne({ _id });

        if (!media) {
            return res.status(404).json({ status: 'error', msg: 'File not found' });
        }

        // Assuming the fileUrl is a direct download link or a link that points to the file
        const downloadUrl = media.fileUrl;

        // Ensure that the file URL is valid and accessible. If not, handle it accordingly.
        if (!downloadUrl) {
            return res.status(400).json({ status: 'error', msg: 'Download URL not available' });
        }

        // Respond with the download URL
        res.status(200).json({ status: 'ok', downloadUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            msg: 'Failed to retrieve download link',
            error: error.message
        });
    }
});

// Endpoint to retrieve detailed info about a specific media item
route.post('/media/details', authenticateToken, async (req, res) => {
    const { _id } = req.body;

    // Validate the fileId input
    if (!_id) {
        return res.status(400).json({ status: 'error', msg: 'fileId is required' });
    }

    try {

        // Find the media document by fileId
        const media = await Media.findOne({ _id });
        console.log(media)

        if (!media) {
            return res.status(404).json({ status: 'error', msg: 'File not found' });
        }

        // Return detailed media information
        res.status(200).json({ status: 'ok', media });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            msg: 'Failed to retrieve media details',
            error: error.message
        });
    }
});




module.exports = route;
