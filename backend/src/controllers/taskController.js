const Task = require('../models/Task');
const Board = require('../models/Board');

const checkBoardAccess = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return null;
  const hasAccess = board.owner.equals(userId) || board.members.some(m => m.user.equals(userId));
  return hasAccess ? board : null;
};

exports.getTasks = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await checkBoardAccess(boardId, req.user._id);
    if (!board) return res.status(403).json({ message: 'Access denied' });

    const tasks = await Task.find({ board: boardId, isArchived: false })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await checkBoardAccess(boardId, req.user._id);
    if (!board) return res.status(403).json({ message: 'Access denied' });

    const { title, description, columnId, priority, labels, dueDate, assignees } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });

    const taskCount = await Task.countDocuments({ board: boardId, columnId });
    const task = new Task({
      title, description, board: boardId,
      columnId: columnId || 'todo',
      createdBy: req.user._id,
      priority: priority || 'medium',
      labels: labels || [],
      dueDate, assignees: assignees || [],
      order: taskCount
    });
    await task.save();
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const board = await checkBoardAccess(task.board, req.user._id);
    if (!board) return res.status(403).json({ message: 'Access denied' });

    const fields = ['title', 'description', 'columnId', 'priority', 'labels', 'dueDate', 'assignees', 'order'];
    fields.forEach(f => { if (req.body[f] !== undefined) task[f] = req.body[f]; });

    await task.save();
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.moveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { columnId, order } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const board = await checkBoardAccess(task.board, req.user._id);
    if (!board) return res.status(403).json({ message: 'Access denied' });

    task.columnId = columnId;
    task.order = order;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const board = await checkBoardAccess(task.board, req.user._id);
    if (!board) return res.status(403).json({ message: 'Access denied' });

    task.isArchived = true;
    await task.save();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const board = await checkBoardAccess(task.board, req.user._id);
    if (!board) return res.status(403).json({ message: 'Access denied' });

    task.comments.push({ text: req.body.text, author: req.user._id });
    await task.save();
    await task.populate('comments.author', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
