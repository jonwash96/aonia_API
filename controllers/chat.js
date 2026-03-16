const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const runSpawn = require('../workers/spawn.js');
let chatSpawn;
const hibernateChatSpawn = () => chatSpawn = null;
const BACK_END_URL = process.env.BACK_END_URL;
const CHAT_PORT = process.env.CHAT_PORT;
const { User, UserProfile } = require('../models/User');
const Chat = require('../models/Chat');



//* PATCH '/'
async function handleSpawnStatus(req, res) {
	try {
		if (!chatSpawn) {
			await new Promise((resolve, reject) => {
				chatSpawn = runSpawn (
					'node', './workers/chatServer.js', 
					resolve, reject,
					hibernateChatSpawn )
			})
		};
		return res
			.status(200)
			.json({
				message: "Chat server online.",
				url: BACK_END_URL+':'+CHAT_PORT
			});

	} catch (error) {
		console.error(error);
		return res
			.status(500)
			.json({ error: error.message });
	}
}


//* GET '/:userID'
async function retrieveChats(req, res, serviceType) {
	try {
		const userID = serviceType.api
			? req.params.userID
			: req;

		const user = await User.findById(userID).populate('chats');
		if (!user) throw new Error("User not found");

		return serviceType.api
			? res.status(200).json(user.chats)
			: user;

	} catch (error) {
		console.error(error);
		return serviceType.api
			? res.status(500).json({ error: error.message })
			: {error: error};
	}
}


//* POST '/' 
async function createChat(req, res, serviceType) {
	try {
		const body = serviceType.api
			? req.body
			: req;

		const newChat = await Chat.create(body);
		if (!newChat) throw new Error("Create new Chat Failed.");

		for (const pid of newChat.users) {
			const profile = await UserProfile.findById(pid);
			await User.updateOne (
				{ _id: profile.userID },
				{ $push: {chats: newChat._id} }
			)
		};

		return serviceType.api
			? res.status(200).json(newChat)
			: newChat;

	} catch (error) {
		console.error(error);
		return serviceType.api
			? res.status(500).json({ error: error.message })
			: {error: error};
	}
}



module.exports = { retrieveChats, handleSpawnStatus, createChat }