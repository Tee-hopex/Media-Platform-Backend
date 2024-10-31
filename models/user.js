const mongoose = require("mongoose");
const bcrypt = require('bcryptjs'); //allows for encrypting specific data

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },  
    profilePic: { type: String },  // URL to profile picture
    // phone_no: String,
    profilePic_id: String,
    notifications: [
        {
            message: String,
            link: String,  // URL or ID linking to relevant content
            read: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    timestamp: {type: Number, default: Date.now()},
       
}, {collection: 'users'});


// Check password
userSchema.methods.comparePassword = function(password) {
    return bcrypt.compare(password, this.password);
};


userSchema.index({ username: 1, email: 1 });
const model = mongoose.model('User', userSchema);
module.exports = model;