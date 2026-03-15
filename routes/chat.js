const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const chat = require('../controllers/chat');



router.patch('/', requireAuth, chat.handleSpawnStatus);

router.get('/:userID', requireAuth, (req, res)=>chat.retrieveChats(req, res, {api:true}));

router.post('/', requireAuth, (req, res)=>chat.createChat(req, res, {api:true}));



module.exports = router