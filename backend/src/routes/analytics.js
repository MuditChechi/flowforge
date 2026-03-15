const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getBoardAnalytics, getUserAnalytics } = require('../controllers/analyticsController');

router.use(auth);
router.get('/board/:boardId', getBoardAnalytics);
router.get('/user', getUserAnalytics);

module.exports = router;
