function isObjectLiteral(obj) {
	return obj === null || typeof obj === 'undefined'
		? false
		: obj.constructor.name === 'Object'
}


function signToken (user) {
	const payload = { _id: user._id, username: user.username };
	const jwt = require('jsonwebtoken');
	return jwt.sign(payload, process.env.SECRET, { expiresIn: '1d' });
}



module.exports = { isObjectLiteral, signToken }