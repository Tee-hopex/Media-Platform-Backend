const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
    title: { type: String, required: true, index: true },
    description: { type: String },
    fileType: { type: String, enum: ['video', 'audio'], required: true },
    fileId: { type: String },
    fileUrl: { type: String, required: true },  // URL to file storage location
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {collection: 'mediaSchema'});

mediaSchema.index({ title: 1, fileType: 1 });
mediaSchema.index({ views: -1 });  // For popular media sorting

mediaSchema.index({ username: 1, email: 1 });
const model = mongoose.model('Media', mediaSchema);
module.exports = model;