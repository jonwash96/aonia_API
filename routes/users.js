const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const users = require('../controllers/users');



router.post('/friends/request', requireAuth, users.sendFriendRequest);

router.put('/friends/respond', requireAuth, users.respondFriendRequest);

router.get('/profiles', requireAuth, users.indexUserProfiles);

router.get('/:userID/notifications', requireAuth, users.getNotifications);

router.get('/:userID', requireAuth, users.getUserData);

router.put('/:userID', requireAuth, users.updateUser);

router.delete('/:userID', requireAuth, users.deleteUser);



module.exports = router