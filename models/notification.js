const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    message: { type: String, required: true },
    link: { type: String },  // URL or ID linking to relevant content
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ userId: 1, read: 1 });
const Notification = mongoose.model('Notification', NotificationSchema);
