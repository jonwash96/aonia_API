const mongoose = require('mongoose');



const activitySchema = new mongoose.Schema({
	users: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'User is required']
	}],
	category: {
		type: String,
		required: true,
		enum: [
			'login', 'logout', 'register',
			'create', 'create-collection', 'upload-photo',
			'update',
			'delete',
			'add-friend'
		]
	},
	description: {
		type: String,
		required: false,
		trim: true
	},
	data: {
		type: Object,
		required: false
	}
}, { timestamps: true });



activitySchema.index({ createdAt: -1 });

activitySchema.statics.log = async function (activityData) {
	try {
		return await this.create(activityData);
	} catch (error) {
		return null;
	}
};

activitySchema.statics.getRecentActivities = async function (uid, limit=20) {
	return await this.find({ user: uid })
		.sort({ createdAt: -1 })
		.limit(limit)
};

activitySchema.statics.getActivitySummary = async function (uid, startDate, endDate) {
	return await this.aggregate([
		{
			$match: {
				user: mongoose.Types.ObjectId(uid),
				createdAt: { $gte: startDate, $lte: endDate }
			}
		},
		{
			$group: {
				_id: '$action',
				count: { $sum: 1 }
			}
		},
		{
			$sort: { count: -1 }
		}
	]);
};

module.exports = mongoose.model('Activity', activitySchema);