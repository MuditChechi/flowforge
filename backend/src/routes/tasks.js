const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireBoardRole = require('../middleware/boardRole');
const { getTasks, createTask, updateTask, moveTask, deleteTask, addComment } = require('../controllers/taskController');

// Viewers can read; members/admins can write; only admins can delete.
router.get('/board/:boardId', auth, requireBoardRole('viewer', 'member', 'admin'), getTasks);
router.post('/board/:boardId', auth, requireBoardRole('member', 'admin'), createTask);
router.put('/:taskId', auth, requireBoardRole('member', 'admin'), updateTask);
router.patch('/:taskId/move', auth, requireBoardRole('member', 'admin'), moveTask);
router.delete('/:taskId', auth, requireBoardRole('admin'), deleteTask);
router.post('/:taskId/comments', auth, requireBoardRole('member', 'admin'), addComment);

module.exports = router;
