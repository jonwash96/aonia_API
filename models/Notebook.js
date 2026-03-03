const mongoose = require('mongoose');



const notebookSchema = new mongoose.Schema({
	ownerID: mongoose.Schema.Types.ObjectId,
	Contents: [new mongoose.Schema({
		idx: Number,
		title: String,
		pages: [{ 
			idx: Number, 
			page: mongoose.Schema.Types.ObjectId
		}]
	})], // { section-title: [pages] }
	pages: [documentSchema],
})



module.exports = mongoose.model('Notebook', notebookSchema)