require('../utils/index');
const mongoose = require('mongoose');
const { User, UserProfile } = require("../models/User");
const Notification = require("../models/Notification");
const Activity = require('../models/Activity');
const Chat = require('../models/Chat');
const Collection = require('../models/Collection');
const Notebook = require('../models/Notebook');
const { Document } = require('../models/Document');
const Item = require('../models/Item');
const OEM = require('../models/OEM');
const { Reference } = require('../models/Reference');
const { WebLink } = require('../models/WebLink');

const Models = {
	User, UserProfile, Activity, Notification,
	Chat, Collection, Notebook, Document,
	Item, OEM, Reference, WebLink
};



// GET::/profiles
async function indexUserProfiles(req, res) {
	try {
		const users = await UserProfile.find()
			.where('info.privacy').not('hidden');

		return res
			.status(200)
			.json(users)

	} catch (error) {
		return res
			.status(500)
			.json({ error: error.message })
	}
}


// GET::/:userID
async function getUserData(req, res) {
	try {
		if (req.user._id !== req.params.userID && !req.user.isAdmin) {
			res.status(403);
			throw new Error("Not Authorized");
		};

		let mode, populate;
		try {
			populate = req.query.populate
		} catch { populate = null };

		switch (populate) {
			case 'notifications': mode = 'notifications'
			case 'all': mode = 'profile activity notifications chats photoCollection events notebook gear'; break;
			case 'profile':
			default: mode = 'profile notifications activity events';
		};

		const user = await User.findById(req.params.userID).populate(mode);

		if (!user) {
			res.status(404);
			throw new Error("User not found");
		};

		return res
			.status(200)
			.json(user)

	} catch (error) {
		if (res.statusCode === 403 || res.statusCode === 404) {
			return res.json({ error: error.message })
		} else {
			return res
				.status(500)
				.json({ error: error.message })
		}
	}
}


// GET::/:userID/notifications
async function getNotifications(req, res) {
	try {
		if (req.user._id !== req.params.userID && !req.user.isAdmin) {
			res.status(403);
			throw new Error("Not Authorized");
		};

		let notifications;
		if (req.query.from) {
			notifications = await Notification.find({ 
				ownerID: req.user._id, 
				createdAt: { $gt: new Date(req.query.from) } 
			})
		} else {
			notifications = await Notification.find({ ownerID: req.user._id })
		}

		return res
			.status(200)
			.json(notifications)

	} catch (error) {
		return (res.statusCode === 403)
			? res.json({ error: error.message })
			: res.status(500)
				 .json({ error: error.message })
	}
}


// PUT::/:userID
async function updateUser(req, res) {
	try {
		if (req.user._id !== req.params.userID && !req.user.isAdmin) {
			res.status(403);
			throw new Error("Not Authorized");
		}

		/** The Front end creates an updateInfo object:
		 * 		updateInfo = {
		 * 			newProfilePhoto: true|false,
		 * 			models: { ModelName: {updated fields + _id} }
		 * 		} 
		 * The client app declares the models needed to perform the update in a "models"
		 * object, and sends only the updated properties in the body.
		 * It also specifies certain boolean properties indicating neccesary new models
		 * or other actions the server should take.
		 * The Server iteratively updates all models by comparing the key to properties
		 * in a declared Models object, which maps model names to their model. 
		 * The loop then modifies any neccesary data via conditional statements, and
		 * performs the update, before saving and looping to the next model. 
		 * PROFILE PHOTO: If the photo was changed to an existing photo in the user's 
		 * library, Then only the photo's ID will be sent as a string. */

		const updateInfo = req.body;

		const updateModels = {};

		for (key in updateInfo.models) {
			updateModels[key] = await Models[key].findById(updateInfo.models[key]._id);
			if (!updateModels[key]) throw new Error(`Update Error! '${key}' Not found.`);

			if (isObjectLiteral(updateModels[key]))
				Object.entries(updateInfo.models[key]).forEach(([k, v]) => {
					if (k !== '_id') updateModels[key][k] = v
				})
			else if (Array.isArray(updateModels[key]))
				updateModels[key].push(...updateInfo.models[key]);

			await updateModels[key].save();
		};

		if (newProfilePhoto in updateInfo) {
			try {
				let newPhoto = new WebLink({ ...updateInfo.models.UserProfile.photo });
				newPhoto = await newPhoto.save();
				updateModels.UserProfile.photo = newPhoto;
				updateModels.Collection.files.push(newPhoto);
				updateModels.UserProfile.save();
				updateModels.Collection.save();
			} catch (error) {
				console.error(error)
				throw new Error("New Profile Photo failed.");
			}
		} else

			if ('UserProfile' in updateModels) updateModels.User.profile = updateModels.UserProfile;
		return res
			.status(200)
			.json(updateModels);

	} catch (error) {
		if (req.statusCode === 403 || req.statusCode === 404) {
			res.json({ err: error.message });
		} else {
			console.error(error)
			return res
				.status(500)
				.json({ error: error.message })
		}
	}
}


// DELETE::/:userID
async function deleteUser(req, res) {
	try {
		if (req.user._id !== req.params.userID && !req.user.isAdmin) {
			res.status(403);
			throw new Error("Not Authorized");
		}

		let user = await User.findById(req.params.userID);
		if (!user) throw new Error("User Not found.");

		Activity.deleteMany().where('_id').in(user.activity);
		Notification.deleteMany().where('_id').in(user.notifications);
		Chat.deleteMany().where('_id').in(user.chats);
		Item.deleteMany({ verified: false }).where('id').in(user.gear);
		Collection.deleteMany().where('_id').in(user.myPhotos);
		Document.deleteMany({ ownerID: user._id })

		await User.deleteMany().where('_id').in([user.profile, user.myPhotos, user.notebook]);
		await User.deleteOne({ _id: user._id });

		return res
			.status(204)
			.json({ message: "Successfully deleted" })

	} catch (error) {
		console.error(error)
		return res
			.status(500)
			.json({ error: error.message })
	}
};


// POST::/friends/request
async function sendFriendRequest(req, res) {
	try {
		const { user_id, profile_id, requested_id, username, displayname } = req.body;

		const sendingUser = await User.findById(user_id).populate('activity');
		const receivingUser = await UserProfile.findById(requested_id).populate({ path: 'userID', populate: { path: 'activity' } });

		const existing = await User.exists({
			_id: sendingUser, activity: {
				$elemMatch: {
					users: profile_id,
					type: 'friend_request'
		}	}	});
		if (existing) throw new Error("A friend request has already been sent to the user. Please wait for the to respond.");

		if (!sendingUser) throw new Error("Account cannot be found! Please try your request again later.");
		if (!receivingUser) throw new Error("Requested user cannot be found! This may be a server error, or the account may have been deleted. Please try your request again later.");

		const friendRequestNotificationID = new mongoose.Types.ObjectId();
		const requestReceivedActivityID = new mongoose.Types.ObjectId();
		const requestSentActivityID = new mongoose.Types.ObjectId();

		const requestReceivedActivity = new Activity({
			_id: requestReceivedActivityID,
			users: [profile_id, receivingUser._id],
			category: 'friend-request',
			description: 'received new friend request from ' + username,
			status: 'pending',
			data: { senderActivityID: requestSentActivityID }
		});
		await requestReceivedActivity.save();

		const friendRequestNotification = new Notification({
			_id: friendRequestNotificationID,
			title: `New Staargazer found! ${displayname} (${username}) wants to add you as a friend.`,
			description: "Click here to accept or decline their request.",
			action: '/users/friends/requests/' + requestReceivedActivityID,
			priority: 1,
			activityID: requestReceivedActivityID,
			ownerID: receivingUser.userID._id
		});
		await friendRequestNotification.save();

		let requestSentActivity = new Activity({
			_id: requestSentActivityID,
			users: [profile_id, receivingUser._id],
			category: 'friend-request',
			description: 'sent new friend request to ' + receivingUser.username,
			status: 'pending',
			data: { recipientActivityID: requestReceivedActivityID }
		});
		requestSentActivity = await requestSentActivity.save();


		await User.updateOne (
			{ _id: receivingUser.userID._id },
			{ $push: {
				activity: requestReceivedActivityID,
				notifications: friendRequestNotificationID
			}}
		);
		await User.updateOne (
			{ _id: user_id },
			{ $push: { activity: requestSentActivityID }}
		);

		return res
			.status(200)
			.json(requestSentActivity);

	} catch (error) {
		console.error(error)
		return res
			.status(500)
			.json({ error: error.message || "Server error" });
	}
}


// PUT::/friends/request
async function respondFriendRequest(req, res) {
	try {
		const { user_id, username, displayname, profile_id, requestor_id, response } = req.body;

		const requestor = await UserProfile.findById(requestor_id).populate('photo');
		if (!requestor) throw new Error("Requested user cannot be found! This may be a server error, or the account may have been deleted. Please try your request again later.");

		const updatedActivity = await Activity.findByIdAndUpdate(response.recipientActivityID, { status: response.choice }, { new: true });
		await Activity.findByIdAndUpdate(response.senderActivityID, { status: response.choice });

		const responseNotificationID = new mongoose.Types.ObjectId();
		const responseNotification = new Notification({
			_id: responseNotificationID,
			title: `${displayname} (${username}) has Responded to your friend request.`,
			description: `${displayname} has ${response.choice} your friend request.` + response.choice === 'accepted' ? " Click to view their profile." : '',
			action: response.choice === 'accepted' ? '/users/' + profile_id : null,
			priority: 1,
			activityID: response.senderActivityID,
			ownerID: updatedActivity.users.find(u => u !== user_id)
		});
		await responseNotification.save();

		if (response.choice === 'accepted') {
			await UserProfile.updateOne (
				{ _id: profile_id }, 
				{ $push: { friends: requestor_id }}
			);
			await UserProfile.updateOne (
				{ _id: requestor_id }, 
				{ $push: { friends: profile_id }}
			);
		};

		return res
			.status(200)
			.json({requestor, updatedActivity});

	} catch (error) {
		console.error(error)
		return res
			.status(500)
			.json({ error: error.message || "Server error" });
	}
}



module.exports = {
	indexUserProfiles,
	deleteUser,
	updateUser,
	getUserData,
	getNotifications,
	sendFriendRequest,
	respondFriendRequest
}