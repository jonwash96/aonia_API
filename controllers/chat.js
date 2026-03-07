const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const runSpawn = require('../workers/spawn.js');
let chatSpawn;
const hibernateChatSpawn = () => chatSpawn = null;
const BACK_END_URL = process.env.BACK_END_URL;
const CHAT_PORT = process.env.CHAT_PORT;
const { User } = require('../models/User');



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


//* router.post('/retrieve',
async function retrieveChats(req, res, serviceType) {
	try {
		const userID = serviceType.api
			? req.body.user._id
			: req;

		const user = await User.findById(userID).populate('chats profile.friends');
		if (!user) throw new Error("User not found");

		result = { 
			chats: user.chats, 
			friends: user.profile.friends 
		};
		return serviceType.api
			? res.status(200).json(result)
			: result;

	} catch (error) {
		console.error(error);
		return serviceType.api
			? res.status(500).json({ error: error.message })
			: error;
	}
}



module.exports = { retrieveChats, handleSpawnStatus }