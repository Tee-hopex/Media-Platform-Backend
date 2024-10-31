const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin'], default: 'admin' }
});

adminSchema.index({ username: 1 });
const Admin = mongoose.model('Admin', adminSchema);
