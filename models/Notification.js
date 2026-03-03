const mongoose = require('mongoose');



const notificationSchema = new mongoose.Schema({
    title: {
        type: String, 
        required: true
    },
    description:{
        type: String, 
        required: false
    },
    priority: {
        type: Number, 
        required: false, default: 3
    },
    action: {
        type: String, 
        required: false
    },
    status: {
        type: String, 
        enum: ['unread', 'read', 'pinned', 'archived'],
        required: true, 
        default: 'unread'
    },
    data: {
        type: String,
        required: false
    },
    activityID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: false,
    }
}, { timestamps: true });



module.exports = mongoose.model('Notification', notificationSchema);
