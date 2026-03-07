const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const users = require('../controllers/users');



router.get('/profiles', requireAuth, users.indexUserProfiles);

router.get('/:userID', requireAuth, users.getUserData);

router.put('/:userID', requireAuth, users.updateUser);

router.delete('/:userID', requireAuth, users.deleteUser);



module.exports = router