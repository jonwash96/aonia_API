const mongoose = require('mongoose');
const referenceSchema = require('./Reference');



const commentSchema = new mongoose.Schema({
	ownerID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	body: {
		type: String,
		required: true
	},
	files: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'WebLink',
		required: false,
		autopopulate: true
	}],
	references: [referenceSchema],
	topic: mongoose.Schema.Types.ObjectId,
	parent: mongoose.Schema.Types.ObjectId,
	children: [commentSchema],
}, { timestamps: true });



module.exports = mongoose.model('Comment', commentSchema)