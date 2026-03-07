const mongoose = require('mongoose');
const AWS_BUCKET = process.env.AWS_BUCKET;



const webLinkSchema = new mongoose.Schema({
	title: {
		type: String,
		required: [true, 'Link title is required'],
		trim: true
	},
	description: {
		type: String,
		trim: true,
	},
	name: {
		type: String,
		required: false
	},
	url: {
		type: String,
		required: [true, 'URL is required'],
		trim: true,
	},
	category: {
		type: String,
		enum: ['website', 'photo', 'file'],
		required: false,
		default: 'website'
	},
}, { timestamps: true });



const WebLink = mongoose.model('WebLink', webLinkSchema);

module.exports = { WebLink, webLinkSchema };
