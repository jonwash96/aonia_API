const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

const SECRET = process.env.SECRET;
const METEOBLUE_API_KEY = process.env.METEOBLUE_API_KEY;



function signMeteoblueKey(lat, lon) {
	const query = `/packages/basic-1h?lat=${lat}&lon=${lon}&apikey=${METEOBLUE_API_KEY}&expire=${Date.now() + 1000 * 60 * 60 * 24}`;
	const sig = require('crypto').createHmac('sha256', SECRET).update(query).digest('hex');
	const signedUrl = `https://my.meteoblue.com${query}&sig=${sig}`;
	return signedUrl;
}


router.patch('/meteoblue/sign', requireAuth, (req, res) => {
	const signed = signMeteoblueKey(req.body.lat, req.body.lon);
	res.status(200).json({ url: signed })
})


router.get('/meteoblue', requireAuth, async (req, res) => {
	try {
		const signed = signMeteoblueKey(req.query.lat, req.query.lon);

		const data = await fetch(signed);
		const json = await data.json();

		return res
			.status(200)
			.json(json);

	} catch (error) {
		console.error(error);
		return res
			.status(500)
			.json({ error: error.message });
	}
})


const fs = require('fs');
router.get('/meteoblue/static', async (req, res) => {
	const url = "https://my.meteoblue.com/packages/basic-1h?lat=41.9344183&lon=-88.3762128&apikey=hrsTE74yx5OSZ0aG&expire=1773014109045&sig=443194ea1d0f30a88827a91e63dde4d60ae4083cdbdaff84c95a630e885a3a73"
	const data = await fetch (url);
	const json = await data.json();
	fs.writeFileSync('./dev/weather-data.json', JSON.stringify(json));
	res.status(200).json(json)
})


module.exports = router;