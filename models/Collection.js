const mongoose = require('mongoose');
const { commentSchema } = require('./Comment');



const collectionSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	details: {
		type: String,
		required: false,
	},
	type: {
		type: String,
		enum: ['my-photos', 'photo', 'other'],
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
	parent: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Collection'
	},
	children: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Collection'
	},
	comments: [commentSchema],
	config: new mongoose.Schema({
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