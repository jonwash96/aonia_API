require('../db/connection');
const { retrieveChats, createChat } = require('../controllers/chat');
const jwt = require('jsonwebtoken');
const admins = process.env.ADMINS || [];
const Chat = require('../models/Chat');



const usersCache = {};
const chatsCache = {};


const findUser = (id) => usersCache[id];
const populate = (user) => (
	{ ...user, chats: user.chats.map(chatInfo => chatsCache.find(c => c._id === chatInfo)) }
);
const findConvo = (id) => chatsCache[id];

const updateChat = (chatID, message) => {
	if (!chatsCache[chatID]) chatsCache[chatID] = { 
		_id: chatID,
		messages: [message] 
	} 
	else chatsCache[chatID].messages.push(message);
};


let helicount = 0;
let helinil = 0;
async function heliFlush() {
	if (helinil === 6) process.exit();
	let count = 0, count2 = 0;
	for (const key in chatsCache) {
		const chat = chatsCache[key];
		if (chat.flushed_at && (Date.now() - chat.flushed_at > 3600000) && chat.messages.length === 0) {
			delete chatsCache[key];
			count2++;
			continue;
		};
		try {
			if (!chat.messages.length > 0) continue;
			const messages = new Array(chat.messages);
			chat.messages = [];
			chat['flushed_at'] = Date.now();
			await Chat.updateOne (
				{ _id: key },
				{ push: { messages: { each: messages } } }
			);
			count++;
		} catch (err) {
			console.error("heliFlush Error.", err);
		}	
	};
	helicount++;
	count === 0 ? helinil++ : helinil = 0;
	return console.log(`@heliFlush (${helicount}) complete.\n `, count, "chats flushed,\n ", count2, "empty chats removed.\n  Helinil:", helinil);
}
const rotor = setInterval(heliFlush, 10000);



const io = require('socket.io')(28000, {
	cors: {origin:'*'}
});

console.log(`Starting chatserver on port 28000. . .`);




io.on('connect', () => console.log("Socket.io running on port 28000"));
io.on('disconnect', () => console.log("Socket.io Disconnected"));

io.on('connection', socket => {
	console.log("Socket.io Connection on port 28000 from ID: ", socket.id);
	const { uid, token, chatInfo } = socket.handshake.query;
	console.log("@handshake", socket.handshake.query);
	let decoded

	try {
		if (!token) {
			console.error(1403, "Socket.io missing token:", socket.id);
			return socket.emit('error', "Unauthorized! Missing Auth Token.", 1403);
		};

		decoded = jwt.verify(token, process.env.SECRET);
		admins.includes(uid) 
			? decoded['isAdmin'] = true 
			: decoded['isAdmin'] = false;
		
	} catch (error) {
		console.log("\n\n@chat server. token error", error)
		return socket.emit('error', "Socket.io Authorization Error. "+error.message, 1403);
	};

	if (chatInfo?.chatID) socket.join(chatInfo?.chatID);
	
	socket.emit('loading', "Retrieving Chats. . .", 1200);
	new Promise(async (resolve, reject) => {
		try {
			const user = await retrieveChats(uid, null, {api:false});
			if (!user || user.error) {
				socket.emit('error', `Data retrieval error @ chat server. User not found. ${user.error.message}`, 1500);
				return console.error("No Chat data received for user", uid)
			};
			
			usersCache[uid] = {
				_id: uid, 
				username: decoded.username,
				isAdmin: decoded.isAdmin,
				session: {id: socket.id, join: Date.now()}, 
				chats: user.chats?.map(c => c._id) || []
			};

			if (user.chats?.length === 0) return resolve(socket.emit('chatdata', user.chats));

			const dbFlushSome = async (user) => {
				const chats = user.chats;
				const updates = chats?.map(async (chat,idx) => {
					console.log("@flushSome. chat in cache:", idx +1);
					const cached = chatsCache[chat._id];
					if (!cached) return;
					await Chat.updateOne (
						{ _id: chat._id },
						{ push: { messages: { each: cached.messages } } }
					);
					chatsCache[chat._id] = [];
				});
				try {await Promise.all(updates);
					user.save();
				} catch (err) {throw new Error(err)}
			};
			dbFlushSome(user);

			return resolve(socket.emit('chatdata', user.chats));

		} catch (error) {
			console.error(error);
			return reject(socket.emit('error', "Data retrieval error @ chat server.", 1500));
		}
	});



	socket.onAny((eventName, uid) => {
		if (!uid) {
			console.error(1403, eventName, "User not recognized:", socket.id);
			return socket.emit('error', "User not recognized. Please refresh or sign back in.", 1403);
		}
	})

	socket.on('broadcast', (uid, message) => {
		console.log("Message:", message)
		socket.broadcast.emit('receive-message', message);
	});

	socket.on('send-message', (uid, message, chatID) => {
		console.log(usersCache[uid]?.username, "Message:", message, "to room:", chatID);
		updateChat(chatID, message);
		socket.to(chatID).emit('receive-message', message, chatID);
	});

	socket.on('create-chat', async (uid, chat) => {
		try {
			console.log("Creating new Chat...", chat);
			const { _id, name, users, messages } = await createChat(chat, null, {api:false});
			const newChat = { _id, name, users, messages };
			if (!newChat || newChat.error) 
				throw new Error(newChat.error.message || "Create Chat Error @ chat server. Chat not created.");

			chatsCache[newChat._id] = newChat;
			newChat.users.forEach(u => u !== uid && usersCache[u]?.chats.push(newChat._id));
			if (usersCache[uid]) usersCache[uid]?.chats.push(newChat._id)
			else console.error("Non-fatal error @ create-chat. User session not Found in cache!");

			console.log("New Chat Created...", newChat)
			return socket.emit('chat-created', newChat);

		} catch (error) {
			console.error(error);
			socket.emit('error', error.message, 1500);
		}
	});

	socket.on('join-room', (uid, chatID) => {
		console.log(chatsCache[uid]?.username, "Join room:", chatID);
		socket.join(chatID);
		// socket.emit('chatdata', findConvo(chatID));
	});

	socket.on('leave-room', (uid, chatID) => {
		console.log(uid, "Leave room:", chatID)
		socket.leave(chatID);
		socket.emit('confirm', `You have left room: ${chatID}`, chatID);
	});

	socket.on('cmd', (uid, cmd) => {
		try {
			console.log(uid, "CMD:", cmd);
			console.log(eval(cmd));
		} catch (err) {
			console.error(err);
			socket.emit('error', err.message, 1500);
		}
	})
})