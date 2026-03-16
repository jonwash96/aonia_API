const { signToken, isObjectLiteral } = require('../utils/index');
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
const runSpawn = require('../workers/spawn.js');
let chatSpawn;
const hibernateChatSpawn = () => chatSpawn = null;


const Models = { User,	UserProfile,	Activity,	Notification, 
				 Chat,  Collection, 	Notebook, 	Document, 
				 Item, 	OEM, 			Reference, 	WebLink };



router.use((req, res, next) => {
	requireAuth(req, res, next);
	if (!res.ok) return res;
	if (!req.user.isAdmin) {
		console.error("Not Authorized!");
		return res
			.status(403)
			.json({ error: "Not Authorized!" })

	} else next()
});



router.patch('/spawn', async (req,res) => {
	const cmds = ['run', 'kill']
	if (!req.query.cmd || !req.query.cmd in cmds) {
		return res
			.status(500)
			.json({error: 'ERROR! NO CMD QUERY'});
	};
	try {
		if (req.query.cmd === 'run') {
			await new Promise((resolve, reject) => {
				chatSpawn = runSpawn(
					'node', './workers/chatServer.js', 
					resolve, reject,
					hibernateChatSpawn
				)
			});
			return res
				.status(200)
				.json({RUN:['node','./workers/chatSocket']});
	
		} else if (req.query.cmd === 'kill') {
			chatSpawn.kill();
			return res
				.status(200)
				.json({KILL: './workers/chatSocket'});
		}
	} catch (error) {
		console.error(error);
		return res
			.status(500)
			.json({ error: error.message });
	}
})


router.get('/users', async function admin_indexUsers(req, res) {
	try {
		const users = await User.find({}).populate('profile');
		return res
			.status(200)
			.json(users)

	} catch (error) {
		return res
			.status(500)
			.json({ error: error.message })
	}
})


router.get('/', async(req, res) => {
	const result = {};
	try {
		for (let Model in Models) {
			result[Model] = await Models[Model].find();
		}

		return res.status(200).json(result)
	} catch (err) {
		console.error(err);
		return res.status(500).json(result)
	}
});


router.delete('/delete', async(req, res) => {
	const result = {};
	try {
		if (req.query.all === 'true') {
			for (let Model in Models) {
				result[Model] = await Models[Model].deleteMany();
		}
		};

		return res.status(204).json(result)
	} catch (err) {
		console.error(err);
		return res.status(500).json(result)
	}
});


router.put('/password-reset', async(req, res) => {
	try {
		const { userID, newPW, adminID, adminPW } = req.body;

		const admin = await User.findById(adminID).select('+password');

		const isMatch = bcrypt.compareSync(adminPW, admin.password);
			if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

		const newHashed = bcrypt.hashSync(newPW, 12)

		await User.updateOne (
			{ _id: userID },
			{ password: newHashed }
		);

		return res
			.status(204)
			.json({ message: "Password Updated" });

	} catch (err) {
		console.error(err);
		return res.status(500).json(result)
	}
});



module.exports = router;