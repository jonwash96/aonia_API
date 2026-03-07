const mongoose = require('mongoose');
const { documentSchema } = require('./Document');



const notebookSchema = new mongoose.Schema({
	ownerID: mongoose.Schema.Types.ObjectId,
	contents: [new mongoose.Schema({
		idx: Number,
		title: String,
		pages: [{ 
			idx: Number, 
			page: mongoose.Schema.Types.ObjectId
		}]
	})], // Use: { section-title: [pages] }
	pages: [documentSchema],
})



module.exports = mongoose.model('Notebook', notebookSchema)