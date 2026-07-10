const Task = require('../models/Task');

// Access control and board/task resolution are handled by the requireBoardRole
// middleware, which attaches `req.board` and (on task routes) `req.task`.

exports.getTasks = async (req, res, next) => {
  try {
    const boardId = req.board._id;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find({ board: boardId, isArchived: false })
        .populate('assignees', 'name email avatar')
        .populate('createdBy', 'name email')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments({ board: boardId, isArchived: false })
    ]);

    res.json({
      tasks,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const boardId = req.board._id;
    const { title, description, columnId, priority, labels, dueDate, assignees } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Title required' });

    const targetColumn = columnId || 'todo';
    const validColumn = req.board.columns.some((c) => c.id === targetColumn);
    if (!validColumn) return res.status(400).json({ message: 'Invalid column' });

    const taskCount = await Task.countDocuments({ board: boardId, columnId: targetColumn });
    const task = new Task({
      title: title.trim(),
      description,
      board: boardId,
      columnId: targetColumn,
      createdBy: req.user._id,
      priority: priority || 'medium',
      labels: labels || [],
      dueDate,
      assignees: assignees || [],
      order: taskCount
    });
    await task.save();
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = req.task;
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.body.columnId !== undefined) {
      const validColumn = req.board.columns.some((c) => c.id === req.body.columnId);
      if (!validColumn) return res.status(400).json({ message: 'Invalid column' });
    }

    const fields = ['title', 'description', 'columnId', 'priority', 'labels', 'dueDate', 'assignees', 'order'];
    fields.forEach((f) => { if (req.body[f] !== undefined) task[f] = req.body[f]; });

    await task.save();
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) {
    next(err);
  }
};

exports.moveTask = async (req, res, next) => {
  try {
    const task = req.task;
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { columnId, order } = req.body;
    if (columnId !== undefined) {
      const validColumn = req.board.columns.some((c) => c.id === columnId);
      if (!validColumn) return res.status(400).json({ message: 'Invalid column' });
      task.columnId = columnId;
    }
    if (order !== undefined) task.order = order;

    await task.save();
    res.json(task);
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = req.task;
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.isArchived = true;
    await task.save();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const task = req.task;
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Comment text required' });

    task.comments.push({ text, author: req.user._id });
    await task.save();
    await task.populate('comments.author', 'name email');
    res.json(task);
  } catch (err) {
    next(err);
  }
};
