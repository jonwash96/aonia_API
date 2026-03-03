const mongoose = require('mongoose');



const referenceSchema = new mongoose.Schema({
	start: Number,
	end: Number,
	data: Object,
	replace: Map,
	category: {
		type: String,
		enum: ['link', 'photo', 'file', 'topic', 'document'],
		default: 'link'
	}
});



const Reference = mongoose.model('Reference', referenceSchema);

module.exports = { Reference, referenceSchema }