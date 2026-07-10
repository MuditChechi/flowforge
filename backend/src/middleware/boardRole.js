const Board = require('../models/Board');
const Task = require('../models/Task');

/**
 * Resolve the board a request targets. Task routes carry `:taskId`, board and
 * task-collection routes carry `:boardId` or `:id`. Returns { board, task }
 * where `task` is set only when we had to load it to find the board.
 */
const resolveBoard = async (req) => {
  const { boardId, id, taskId } = req.params;

  if (boardId || id) {
    const board = await Board.findById(boardId || id);
    return { board, task: null };
  }

  if (taskId) {
    const task = await Task.findById(taskId);
    if (!task) return { board: null, task: null };
    const board = await Board.findById(task.board);
    return { board, task };
  }

  return { board: null, task: null };
};

/**
 * Returns the caller's role on a board, or null if they are not a member.
 * The board owner is always treated as an admin, even if not listed in members.
 */
const getUserRole = (board, userId) => {
  if (board.owner.equals(userId)) return 'admin';
  const membership = board.members.find((m) => m.user && m.user.equals(userId));
  return membership ? membership.role : null;
};

/**
 * Guard a route by board membership role. Pass the roles allowed to proceed,
 * e.g. requireBoardRole('member', 'admin'). Must run after the `auth` middleware.
 * On success it attaches `req.board`, `req.boardRole`, and (when resolved via a
 * task route) `req.task`, so controllers can skip a redundant DB round-trip.
 */
const requireBoardRole = (...allowedRoles) => async (req, res, next) => {
  try {
    const { board, task } = await resolveBoard(req);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const role = getUserRole(board, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    if (allowedRoles.length && !allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    req.board = board;
    req.boardRole = role;
    if (task) req.task = task;
    next();
  } catch (err) {
    // Malformed ObjectIds land here — treat as not found rather than a 500.
    if (err.name === 'CastError') return res.status(404).json({ message: 'Board not found' });
    next(err);
  }
};

module.exports = requireBoardRole;
module.exports.getUserRole = getUserRole;
