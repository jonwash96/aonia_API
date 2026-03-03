const mongoose = require('mongoose');
const { webLinkSchema } = require('./WebLink');
const dpp_male = {path: '/svg/default-profile-photo_male.svg', id: process.env.DEFAULT_PROFILE_PHOTO_MALE};
const dpp_female = {path: '/svg/default-profile-photo_female.svg', id: process.env.DEFAULT_PROFILE_PHOTO_FEMALE};
const dpp_andro = {path: '/svg/default-profile-photo_androgynous.svg', id: process.env.DEFAULT_PROFILE_PHOTO_ANDROGYNOUS};

console.log("defaultProfilePhoto_male".toUpperCase())

const userProfileSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true,
    },
    username: { 
        type: String, 
        required: true,
        unique: true,
        set: v => v.trim().toLowercase(),
        maxLength: [22, "Usernames must be 22 characters or less"]
    },
    displayname: { 
        type: String, 
        required: false 
    },
    photo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: webLinkSchema,
        required: false,
        autopopulate: true,
        default: dpp_male.id || {
            title: 'Default Profile Photo',
            name: 'default-profile-photo',
            url: dpp_male.path,
            category: 'photo'
        }
    },
    Info: new mongoose.Schema({
        bio: {
            type: String,
            maxLength: 500
        },
        privacy: {
            type: String,
            enum: ['private', 'friends', 'public'],
            default: 'private'
        }
    })
}, { timestamps: true })



const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true,
        unique: true,
        set: v => v.trim().toLowercase(),
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
        type: mongoose.Types.ObjectId,
        ref: 'UserProfile',
        required: true,
    },
    activity: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: false,
    }],
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
        required: false,
    }],
    Settings: new mongoose.Schema({
        theme: {
            type: String,
            enum: ['light', 'dark', 'pitch', 'red', 'default', 'client'],
            default: 'light'
        },
    })
}, { timestamps: true });



userSchema.pre('validate', function () {
    if (!this.displayname) this.displayname = this.username;
});
userProfileSchema.pre('validate', function () {
    if (!this.displayname) this.displayname = this.username;
});

const User = mongoose.model('User', userSchema);
const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = { User, UserProfile };