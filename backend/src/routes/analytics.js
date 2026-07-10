const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireBoardRole = require('../middleware/boardRole');
const { getBoardAnalytics, getUserAnalytics } = require('../controllers/analyticsController');

router.get('/board/:boardId', auth, requireBoardRole('viewer', 'member', 'admin'), getBoardAnalytics);
router.get('/user', auth, getUserAnalytics);

module.exports = router;
