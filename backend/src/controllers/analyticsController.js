const Task = require('../models/Task');
const Board = require('../models/Board');

exports.getBoardAnalytics = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const hasAccess = board.owner.equals(req.user._id) || board.members.some(m => m.user.equals(req.user._id));
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const tasks = await Task.find({ board: boardId, isArchived: false });

    const byColumn = {};
    board.columns.forEach(col => { byColumn[col.id] = 0; });
    tasks.forEach(t => { byColumn[t.columnId] = (byColumn[t.columnId] || 0) + 1; });

    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    tasks.forEach(t => { byPriority[t.priority]++; });

    const now = new Date();
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.columnId !== 'done').length;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const completed = tasks.filter(t => {
        if (!t.completedAt) return false;
        return t.completedAt.toISOString().split('T')[0] === dateStr;
      }).length;
      const created = tasks.filter(t => {
        return t.createdAt.toISOString().split('T')[0] === dateStr;
      }).length;
      last7Days.push({ date: dateStr, completed, created });
    }

    const completionRate = tasks.length > 0
      ? Math.round((byColumn['done'] || 0) / tasks.length * 100)
      : 0;

    res.json({
      totalTasks: tasks.length,
      byColumn,
      byPriority,
      overdue,
      completionRate,
      last7Days,
      completedToday: tasks.filter(t => {
        if (!t.completedAt) return false;
        const today = new Date().toISOString().split('T')[0];
        return t.completedAt.toISOString().split('T')[0] === today;
      }).length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserAnalytics = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      isArchived: false
    });
    const boardIds = boards.map(b => b._id);
    const tasks = await Task.find({ board: { $in: boardIds }, isArchived: false });

    const myTasks = tasks.filter(t => t.assignees.some(a => a.equals(req.user._id)));
    const completed = myTasks.filter(t => t.columnId === 'done').length;

    res.json({
      totalBoards: boards.length,
      totalTasks: tasks.length,
      myTasks: myTasks.length,
      myCompleted: completed,
      myCompletionRate: myTasks.length > 0 ? Math.round(completed / myTasks.length * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
