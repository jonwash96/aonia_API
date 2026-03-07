const mongoose = require('mongoose');
const { referenceSchema } = require('./Reference');



const commentTemplate = {
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
};


const commentSchema = new mongoose.Schema({
	...commentTemplate,
	children: [commentTemplate]
}, { timestamps: true });



const Comment = mongoose.model('Comment', commentSchema);

module.exports = { Comment, commentSchema }