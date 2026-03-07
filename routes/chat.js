const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const chat = require('../controllers/chat');



router.patch('/', requireAuth, chat.handleSpawnStatus);

router.post('/retrieve', requireAuth, (req, res)=>chat.retrieveChats(req, res, {api:true}));



module.exports = router