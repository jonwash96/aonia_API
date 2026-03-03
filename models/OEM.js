const mongoose = require('mongoose');
const { webLinkSchema } = require('./WebLink');



const oemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'OEM name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String, 
    trim: true
  },
  url: {
    type: String, 
    required: false
  },
  logo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebLink',
    required: false,
    defualt: {category: 'photo'}
  },
  category: {
    type: String, 
    required: true
  },
}, { timestamps: true });



module.exports = mongoose.model('OEM', oemSchema);