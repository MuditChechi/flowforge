const Task = require('../models/Task');
const Board = require('../models/Board');

const toDateKey = (date) => date.toISOString().split('T')[0];

// Board access is enforced by requireBoardRole, which attaches `req.board`.
exports.getBoardAnalytics = async (req, res, next) => {
  try {
    const board = req.board;
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Single round-trip: compute every metric server-side with a $facet pipeline
    // instead of pulling all tasks into the app and looping in JS.
    const [facet] = await Task.aggregate([
      { $match: { board: board._id, isArchived: false } },
      {
        $facet: {
          total: [{ $count: 'n' }],
          byColumn: [{ $group: { _id: '$columnId', count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
          overdue: [
            { $match: { dueDate: { $lt: now }, columnId: { $ne: 'done' } } },
            { $count: 'n' }
          ],
          completedTrend: [
            { $match: { completedAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } }
          ],
          createdTrend: [
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const total = facet.total[0]?.n || 0;

    const byColumn = {};
    board.columns.forEach((col) => { byColumn[col.id] = 0; });
    facet.byColumn.forEach((row) => { byColumn[row._id] = row.count; });

    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    facet.byPriority.forEach((row) => { if (row._id in byPriority) byPriority[row._id] = row.count; });

    const completedByDay = Object.fromEntries(facet.completedTrend.map((r) => [r._id, r.count]));
    const createdByDay = Object.fromEntries(facet.createdTrend.map((r) => [r._id, r.count]));

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = toDateKey(date);
      last7Days.push({ date: key, completed: completedByDay[key] || 0, created: createdByDay[key] || 0 });
    }

    const completionRate = total > 0 ? Math.round(((byColumn.done || 0) / total) * 100) : 0;
    const todayKey = toDateKey(new Date());

    res.json({
      totalTasks: total,
      byColumn,
      byPriority,
      overdue: facet.overdue[0]?.n || 0,
      completionRate,
      last7Days,
      completedToday: completedByDay[todayKey] || 0
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      isArchived: false
    }).select('_id');
    const boardIds = boards.map((b) => b._id);

    const [totalTasks, myAgg] = await Promise.all([
      Task.countDocuments({ board: { $in: boardIds }, isArchived: false }),
      Task.aggregate([
        { $match: { board: { $in: boardIds }, isArchived: false, assignees: req.user._id } },
        {
          $group: {
            _id: null,
            myTasks: { $sum: 1 },
            myCompleted: { $sum: { $cond: [{ $eq: ['$columnId', 'done'] }, 1, 0] } }
          }
        }
      ])
    ]);

    const my = myAgg[0] || { myTasks: 0, myCompleted: 0 };
    res.json({
      totalBoards: boards.length,
      totalTasks,
      myTasks: my.myTasks,
      myCompleted: my.myCompleted,
      myCompletionRate: my.myTasks > 0 ? Math.round((my.myCompleted / my.myTasks) * 100) : 0
    });
  } catch (err) {
    next(err);
  }
};
