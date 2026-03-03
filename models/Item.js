const mongoose = require('mongoose');



const itemSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	manufacturer: Object,
	model: {
		type: String,
		required: true,
		maxLength: 240
	},
	details: {
		type: String,
		required: true,
		maxLength: 500
	},
	photos: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'WebLink',
		required: false,
	}],
	links: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'WebLink',
		required: false,
	}]
}, { timestamps: true });



module.exports = mongoose.model('Item', itemSchema)