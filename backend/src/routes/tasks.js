const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTasks, createTask, updateTask, moveTask, deleteTask, addComment } = require('../controllers/taskController');

router.use(auth);
router.get('/board/:boardId', getTasks);
router.post('/board/:boardId', createTask);
router.put('/:taskId', updateTask);
router.patch('/:taskId/move', moveTask);
router.delete('/:taskId', deleteTask);
router.post('/:taskId/comments', addComment);

module.exports = router;
