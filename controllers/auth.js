const { signToken, isObjectLiteral } = require('../utils/index');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { User, UserProfile } = require('../models/User');
const Notification = require("../models/Notification");
const Activity = require('../models/Activity');
const Collection = require('../models/Collection');
const Notebook = require('../models/Notebook');
const { WebLink } = require('../models/WebLink');


const saltRounds = 12;



async function register(req, res) {
	try {
		const { username, password, displayname, email } = req.body;

		if (!username?.trim() || !password) {
			return res
				.status(400)
				.json({ error: "Username and password are required" });
		}

		const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } });

		if (existingUser) {
			return res
				.status(409)
				.json({ error: `User with username ${username} already exists.` });
		}

		const hashed = bcrypt.hashSync(password, saltRounds);

		const newUserID = new mongoose.Types.ObjectId();
		const newUserProfileID = new mongoose.Types.ObjectId();
		const welcomeNotificationID = new mongoose.Types.ObjectId();
		const newUserActivityID = new mongoose.Types.ObjectId();
		const newNotebookID = new mongoose.Types.ObjectId();
		const newPhotoCollectionID = new mongoose.Types.ObjectId();

		const newUserActivity = new Activity({
			_id: newUserActivityID,
			users: newUserID,
			category: 'register',
		});
		newUserActivity.save();

		const welcomeNotification = new Notification({
			_id: welcomeNotificationID,
			title: "Welcome to Aonia",
			description: "Click here to set up your profile",
			action: '/profile/edit',
			priority: 3,
			activityID: newUserActivityID
		});
		welcomeNotification.save();

		let profilePhoto = await WebLink.findOne({ title: "Default Profile Photo" });
		if (!profilePhoto) {
			profilePhoto = new WebLink({
				title: "Default Profile Photo",
				name: 'default_male',
				category: 'photo',
				url: '/svg/default-profile-photo_male.svg'
			});
			profilePhoto = await profilePhoto.save();
		};

		const newPhotoCollection = new Collection({
			_id: newPhotoCollectionID,
			name: "My Photos",
			ownerID: newUserID,
			type: 'my-photos',
			files: profilePhoto._id
		});
		newPhotoCollection.save();

		const newNotebook = new Notebook({
			_id: newNotebookID,
			ownerID: newUserID,
		});
		newNotebook.save();

		let userProfile = new UserProfile({
			_id: newUserProfileID,
			userID: newUserID,
			username: username.trim(),
			displayname: displayname.trim(),
			photo: profilePhoto,
		});
		userProfile.save();

		let user = new User({
			_id: newUserID,
			username: username.trim(),
			displayname: displayname.trim(),
			password: hashed,
			profile: newUserProfileID,
			email: email,
			notifications: [welcomeNotificationID],
			activity: [newUserActivityID],
			myPhotos: newPhotoCollectionID,
			notebook: newNotebookID
		});
		user = await user.save();
		await user.populate('notifications activity events')
			.populate({path: 'profile', populate: {path: 'photo'}})
			.populate({path: 'profile', populate: {path: 'friends'}});

		const token = signToken({ _id: user._id, username: user.username });
		return res
			.status(201)
			.json({ token, user });

	} catch (error) {
		console.error(error)
		return res
			.status(500)
			.json({ error: error.message || "Server error" });
	}
}


async function me(req, res) {
	try {
		const user = await User.findById(req.user._id).select('+password');

		if (!user) return res.status(404).json({ error: "User not found." });

		res.status(200).json(user);

	} catch (error) {
		return res
			.status(500)
			.json({ error: error.message || "Server error" });
	}
}


async function login(req, res) {
	try {
		const { username, password } = req.body;

		if (!username?.trim() || !password)
			return res
				.status(400)
				.json({ error: "Username and password are required" });

		const user = await User.findOne({ username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } })
			.select('+password')
			.populate('notifications activity events')
			.populate({path: 'profile', populate: {path: 'photo'}})
			.populate({path: 'profile', populate: {path: 'friends'}});

		if (!user) return res.status(401).json({ error: "Invalid credentials" });

		const isMatch = bcrypt.compareSync(password, user.password);
		if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
		delete user.password;

		const token = signToken({ _id: user._id, username: user.username });
		return res
			.status(200)
			.json({ token, user });

	} catch (error) {
		return res
			.status(500)
			.json({ error: error.message || "Server error" });
	}
}


async function logout(req, res) {
	try {
		return res
			.status(200)
			.json({message: "Signed out successfully",});

	} catch (error) {
		return res
			.status(500)
			.json({ error: "Logout failed" });
	}
}



module.exports = { register, me, login, logout }