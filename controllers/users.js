require('../utils/index');
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

const Models = { User,	UserProfile,	Activity,	Notification, 
				 Chat,  Collection, 	Notebook, 	Document, 
				 Item, 	OEM, 			Reference, 	WebLink };



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


async function getUserData(req, res) {
	try {
		if (req.user._id !== req.params.userID && !req.user.isAdmin) {
			res.status(403);
			throw new Error("Not Authorized");
		};

		let mode, populate;
		try {populate = req.query.populate
		} catch {populate = null};

		switch (populate) {
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
			return res
				.json({ err: error.message })
		} else {
			return res
				.status(500)
				.json({ error: error.message })
		}
	}
}


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
				Object.entries(updateInfo.models[key]).forEach(([k,v]) => {
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
		Item.deleteMany({verified: false}).where('id').in(user.gear);
		Collection.deleteMany().where('_id').in(user.myPhotos);
		Document.deleteMany({ ownerID: user._id })
		
		await User.deleteMany().where('_id').in([ user.profile, user.myPhotos, user.notebook ]);
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



module.exports = { 
	indexUserProfiles, 
	deleteUser, 
	updateUser, 
	getUserData 
}