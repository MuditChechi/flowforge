const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireBoardRole = require('../middleware/boardRole');
const { getBoards, createBoard, getBoard, updateBoard, deleteBoard, inviteMember } = require('../controllers/boardController');

router.use(auth);

// User-scoped: no single board in context.
router.get('/', getBoards);
router.post('/', createBoard);

// Board-scoped: any member can view; only admins can modify or invite.
router.get('/:id', requireBoardRole('viewer', 'member', 'admin'), getBoard);
router.put('/:id', requireBoardRole('admin'), updateBoard);
router.delete('/:id', requireBoardRole('admin'), deleteBoard);
router.post('/:id/invite', requireBoardRole('admin'), inviteMember);

module.exports = router;
