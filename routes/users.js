const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const users = require('../controllers/users');



router.get('/profiles', requireAuth, users.indexUserProfiles);

router.get('/:userID', requireAuth, users.getUserData);

router.get('/:userID/notifications', requireAuth, users.getNotifications);

router.put('/:userID', requireAuth, users.updateUser);

router.delete('/:userID', requireAuth, users.deleteUser);

router.post('/friends/request', requireAuth, users.sendFriendRequest);

router.put('/friends/respond', requireAuth, users.respondFriendRequest);



module.exports = router