const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getBoards, createBoard, getBoard, updateBoard, deleteBoard, inviteMember } = require('../controllers/boardController');

router.use(auth);
router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:id', getBoard);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);
router.post('/:id/invite', inviteMember);

module.exports = router;
