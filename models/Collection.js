const mongoose = require('mongoose');



const collectionSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	details: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		enum: ['photo', 'other'],
		default: 'photo',
	},
	ownerID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	users: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'User is required']
	}],
	parent: mongoose.Schema.Types.ObjectId,
	children: [commentSchema],
	Config: new mongoose.Schema({
		custom: Object
	}),
	files: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'WebLink',
		required: false,
		autopopulate: true
	}],
}, { timestamps: true });



module.exports = mongoose.model('Collection', collectionSchema)