const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const auth = require('../controllers/auth');



router.post('/register', auth.register);

router.get('/me', requireAuth, auth.me);

router.post('/login', auth.login);

router.post('/logout', auth.logout);



module.exports = router