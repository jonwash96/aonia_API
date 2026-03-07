const { retrieveChats } = require('../controllers/chat');
const jwt = require('jsonwebtoken');
const admins = process.env.ADMINS || [];
const Chat = require('../models/Chat');

const usersCache = {
	'7B33392C-4445-6746-A08B0E4F0E8F': {_id:'7B33392C-4445-6746-A08B0E4F0E8F', name:'Vivaldi1', session:null, chats:['3063186A-1F55-15F3-38658105928B','52F7AEBC-768B-CD43-8F9B78A1E910', 'ECC06AA4-CE8D-9DB1-75D33308EE45']},
	'BEC02588-89E7-B786-A355A44EB022': {_id:'BEC02588-89E7-B786-A355A44EB022', name:'Vivaldi2', session:null, chats:['C198085D-D2FE-CE55-4CA57DBF8F70']},
	'98BED0D3-71EE-732B-2AA3C7F4C432': {_id:'98BED0D3-71EE-732B-2AA3C7F4C432', name:'Safari', session:null, chats:['ECC06AA4-CE8D-9DB1-75D33308EE45']},
	'4D154839-1137-5B64-7C8B1A32F521': {_id:'4D154839-1137-5B64-7C8B1A32F521', name:'C1-MK7P-1', session:null, chats:['3063186A-1F55-15F3-38658105928B','52F7AEBC-768B-CD43-8F9B78A1E910']},
	'F7CD23E7-2B97-561D-2C4037E5E8D9': {_id:'F7CD23E7-2B97-561D-2C4037E5E8D9', name:'R2T4-1', session:null, chats:['C198085D-D2FE-CE55-4CA57DBF8F70','52F7AEBC-768B-CD43-8F9B78A1E910']},
	'4C01AF31-E394-C72F-AEAAE2C7B72E': {_id:'4C01AF31-E394-C72F-AEAAE2C7B72E', name:'R2T4-2', session:null, chats:[]},
};

const chatsCache = {
	'3063186A-1F55-15F3-38658105928B': {
		_id:'3063186A-1F55-15F3-38658105928B',
		createdAt: 1772857730166,
		updatedAt: 1772857738166, // Database update
		updated_at: 1772857739166, // Cache update. faster for threaded message dupport
		name:'Vivaldi1/C1-MK7P-1',
		 users:['7B33392C-4445-6746-A08B0E4F0E8F', '4D154839-1137-5B64-7C8B1A32F521'], 
		 messages:[
			{text: "Test Message from Vivaldi", uid:'7B33392C-4445-6746-A08B0E4F0E8F', files:[], threads:[], updatedAt: 1772857731166},
			{text: "Test Message from C1", uid:'4D154839-1137-5B64-7C8B1A32F521', files:[], threads:[], updatedAt: 1772857738166}
	]},
	'ECC06AA4-CE8D-9DB1-75D33308EE45': {_id:'ECC06AA4-CE8D-9DB1-75D33308EE45', name:'Vivaldi1/Safari', users:['7B33392C-4445-6746-A08B0E4F0E8F', '98BED0D3-71EE-732B-2AA3C7F4C432'], messages:[
		{text: "Test Message from Vivaldi", uid:'7B33392C-4445-6746-A08B0E4F0E8F', files:[], threads:[]},
		{text: "Test Message from Safari", uid:'98BED0D3-71EE-732B-2AA3C7F4C432', files:[], threads:[]}
	]},
	'C198085D-D2FE-CE55-4CA57DBF8F70': {_id:'C198085D-D2FE-CE55-4CA57DBF8F70', name:'Vivaldi2/R2T4-1', users:['BEC02588-89E7-B786-A355A44EB022', 'F7CD23E7-2B97-561D-2C4037E5E8D9'], messages:[
		{text: "Test Message from Vivaldi", uid:'BEC02588-89E7-B786-A355A44EB022', files:[], threads:[]},
		{text: "Test Message from R2", uid:'F7CD23E7-2B97-561D-2C4037E5E8D9', files:[], threads:[]}
	]},
	'52F7AEBC-768B-CD43-8F9B78A1E910': {_id:'52F7AEBC-768B-CD43-8F9B78A1E910', name:'Vivaldi1/R2T4-1/C1-MK7P-1', users:['7B33392C-4445-6746-A08B0E4F0E8F', 'F7CD23E7-2B97-561D-2C4037E5E8D9', '4D154839-1137-5B64-7C8B1A32F521'], messages:[
		{text: "Test Message from C1", uid:'4D154839-1137-5B64-7C8B1A32F521', files:[], threads:[]},
		{text: "Test Message from Vivaldi", uid:'7B33392C-4445-6746-A08B0E4F0E8F', files:[], threads:[]},
		{text: "Test Message from R2", uid:'F7CD23E7-2B97-561D-2C4037E5E8D9', files:[], threads:[]}
	]},
};


const findUser = (id) => usersCache.find(user => user._id === id);
const populate = (user) => (
	{ ...user, chats: user.chats.map(chatInfo => chatsCache.find(c => c._id === chatInfo)) }
);
const findConvo = (id) => chatsCache.find(convo => convo._id === id);
const updateChat = (room, message) => {
	chatInfox = chatsCache.findIndex(c => c._id === room)
	chatsCache.at(chatInfox).messages.push(message);
}



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
	let authToken;


		try {
			if (!token) {
				console.error(1403, "Socket.io missing token:", socket.id);
				return socket.emit('error', "Unauthorized! Missing Auth Token.", 1403);
			}
	
			const decoded = jwt.verify(token, process.env.SECRET);
			authToken = decoded;
			admins.includes(uid) 
				? authToken['isAdmin'] = true 
				: authToken['isAdmin'] = false;
			
		} catch (error) {
			console.log("\n\n@chat server. token error", error)
			return socket.emit('error', "Socket.io Authorization Error. "+error.message, 1403);
		}


	if (usersCache[uid]) {
		user.session = {id: socket.id, join: Date.now()};
	} else if (chatInfo.id) {
		socket.emit('promise', "Content Loading. . .", 1200);
		new Promise(async (resolve, reject) => {
			try {
				const data = await retrieveChats(uid, null, {api:false});
				if (data?.chats.length === 0) resolve(socket.emit('receive-chatadata', data));

				const dbFlushSome = async (chats) => {
					const updates = chats?.map(async (chat) => {
						const cached = !chatsCache[chat._id];
						if (!cached) return;
						await Chat.updateOne (
							{ _id: chat._id },
							{ $push: { messages: { $each: cached.messages } } }
						);
						delete chatsCache[chat._id];
					});
					await Promise.all(updates);
				};
				dbFlushSome(data.chats);

				usersCache[uid] = {
					_id: uid, 
					name: authToken.username,
					isAdmin: authToken.isAdmin,
					session: {id: socket.id, join: Date.now()}, 
					chats: data.chats?.map(c => c._id)
				};
				resolve(socket.emit('receive-chatadata', data));

			} catch (error) {
				reject(socket.emit('error', "Data retrieval error @ chat server.", 1500));
			}
		})
	};



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

	socket.on('send-message', (uid, message, room) => {
		console.log("Message:", message);
		// updateChat(room, message);
		socket.to(room).emit('receive-message', message);
	});

	socket.on('join-room', (uid, chatInfo) => {
		console.log(uid, "Join room:", chatInfo);
		socket.join(chatInfo);
		socket.emit('receive-chatdata', findConvo(chatInfo));
	});

	socket.on('leave-room', (uid, room) => {
		console.log(uid, "Leave room:", room)
		socket.leave(room);
		socket.emit('confirm', `You have left room: ${room}`, room);
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