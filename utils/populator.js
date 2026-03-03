require('dotenv').config();
const mongoose = require('mongoose');
const Expense = require("../models/Expense");
const Activity = require('../models/Activity.js')
const Budget = require('../models/budget.js')
const Merchant = require('../models/merchant.js')
const User = require('../models/User.js')
const WebLink = require('../models/WebLink.js')

mongoose.connect(process.env.MONGODB_URI);

async function createMerchant() {
    const newMerchant = await Merchant.create({
        name:"LG Electronics",
        WebLink:"http://www.lg.com",
		logo:"https://www.lg.com/content/dam/lge/global/our-brand/src/mocks/bs0002/brand-elements-logo-primary-d.svg",
		category:"Retail",
    })
    process.exit();
}

async function indexMerchants() {
	const merchants = await Merchant.find();
	process.exit();
}

indexMerchants();
