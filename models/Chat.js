const mongoose = require('mongoose');



const chatSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		maxLength: 120
	},
	users: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'User is required']
	}],
	messages: [Object]
}, { timestamps: true });



module.exports = mongoose.model('Chat', chatSchema)