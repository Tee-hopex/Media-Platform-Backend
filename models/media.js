const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
    title: { type: String, required: true, index: true },
    description: { type: String },
    fileType: { type: String, enum: ['video', 'audio'], required: true },
    genre: { type: String, required: true },  // Genre for classification
    category: { type: String, enum: ['movie', 'series', 'music'], required: true },  // For distinguishing between movie, series, and audio
    fileId: { type: String },
    fileUrl: { type: String, required: true },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'mediaSchema' });

// Indexes
mediaSchema.index({ title: 1, fileType: 1 });
mediaSchema.index({ views: -1 });  // For popular media sorting
mediaSchema.index({ category: 1 });
mediaSchema.index({ genre: 1 });
mediaSchema.index({ createdAt: -1 });  // For latest media sorting

const model = mongoose.model('Media', mediaSchema);
module.exports = model;
