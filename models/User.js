const mongoose = require('mongoose');
const { webLinkSchema } = require('./WebLink');
const dpp_male = {path: '/svg/default-profile-photo_male.svg', id: process.env.DEFAULT_PROFILE_PHOTO_MALE};
const dpp_female = {path: '/svg/default-profile-photo_female.svg', id: process.env.DEFAULT_PROFILE_PHOTO_FEMALE};
const dpp_andro = {path: '/svg/default-profile-photo_androgynous.svg', id: process.env.DEFAULT_PROFILE_PHOTO_ANDROGYNOUS};



const userProfileSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: { 
        type: String, 
        required: true,
        unique: true,
        set: v => v.trim().toLowerCase(),
        maxLength: [22, "Usernames must be 22 characters or less"]
    },
    displayname: { 
        type: String, 
        required: false 
    },
    photo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WebLink',
        required: true,
        autopopulate: true
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserProfile',
        autopopulate: true
    }],
    info: new mongoose.Schema({
        bio: {
            type: String,
            maxLength: 500
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Androgynous', 'Other', 'Decline'],
            required: true,
            default: 'Decline'
        },
        privacy: {
            type: String,
            enum: ['private', 'hidden', 'friends', 'public'],
            default: 'private'
        }
    })
}, { timestamps: true })



const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true,
        unique: true,
        set: v => v.trim().toLowerCase(),
        maxLength: [22, "Usernames must be 22 characters or less"]
    },
    displayname: { 
        type: String, 
        required: false 
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserProfile',
        required: true
    },
    activity: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
    }],
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
    }],
    chats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
    }],
    myPhotos: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
        autopopulate: true
    },
    events: [new mongoose.Schema({
        title: {
            type: String,
            required: true
        },
        details: Object
    })],
    notebook: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notebook',
        autopopulate: true
    },
    gear: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
    }],
    data: Object,
    settings: new mongoose.Schema({
        theme: {
            type: String,
            enum: ['light', 'dark', 'pitch', 'red', 'default', 'client'],
            default: 'light'
        },
    })
}, { timestamps: true });



userSchema.pre('validate', function () {
    if (this.isNew && !this.displayname) this.displayname = this.username;
});
userProfileSchema.pre('validate', function () {
    if (this.isNew && !this.displayname) this.displayname = this.username;
});

const User = mongoose.model('User', userSchema);
const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = { User, UserProfile };