const mongoose = require('mongoose');
const referenceSchema = require('./Reference');



const documentSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	ownerID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	body: {
		type: String,
		required: true
	},
	details: {
		type: String,
		required: false
	},
	files: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'WebLink',
		required: false,
		autopopulate: true
	}],
	references: [referenceSchema],
	Config: new mongoose.Schema({
		custom: Object,
		language: {
			type: String,
			enum: ['html', 'markdown', 'plain-text'],
			default: 'plain-text'
		},
	})
}, { timestamps: true });



documentSchema.pre('validate', function() {
	if (!this.name) this.name = this.title.replace(/\s/g, '-')
});

module.exports = mongoose.model('Document', documentSchema)