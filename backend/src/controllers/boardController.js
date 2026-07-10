const Board = require('../models/Board');
const User = require('../models/User');

// Board-scoped routes run through requireBoardRole, which loads and authorizes
// the board and attaches it as `req.board`.

const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#64748b', order: 0 },
  { id: 'inprogress', title: 'In Progress', color: '#6366f1', order: 1 },
  { id: 'review', title: 'In Review', color: '#f59e0b', order: 2 },
  { id: 'done', title: 'Done', color: '#10b981', order: 3 }
];

exports.getBoards = async (req, res, next) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      isArchived: false
    }).populate('owner', 'name email').populate('members.user', 'name email');
    res.json(boards);
  } catch (err) {
    next(err);
  }
};

exports.createBoard = async (req, res, next) => {
  try {
    const { title, description, color } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Title required' });

    const board = new Board({
      title: title.trim(),
      description,
      color: color || '#6366f1',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      columns: DEFAULT_COLUMNS
    });
    await board.save();
    await board.populate('owner', 'name email');
    res.status(201).json(board);
  } catch (err) {
    next(err);
  }
};

exports.getBoard = async (req, res, next) => {
  try {
    await req.board.populate('owner', 'name email avatar');
    await req.board.populate('members.user', 'name email avatar');
    res.json(req.board);
  } catch (err) {
    next(err);
  }
};

exports.updateBoard = async (req, res, next) => {
  try {
    const board = req.board;
    const { title, description, color, columns } = req.body;
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ message: 'Title cannot be empty' });
      board.title = title.trim();
    }
    if (description !== undefined) board.description = description;
    if (color) board.color = color;
    if (columns) board.columns = columns;

    await board.save();
    res.json(board);
  } catch (err) {
    next(err);
  }
};

exports.deleteBoard = async (req, res, next) => {
  try {
    // Only the owner may delete the whole board, even among admins.
    if (!req.board.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can delete a board' });
    }
    req.board.isArchived = true;
    await req.board.save();
    res.json({ message: 'Board archived' });
  } catch (err) {
    next(err);
  }
};

exports.inviteMember = async (req, res, next) => {
  try {
    const board = req.board;
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    if (role && !['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const alreadyMember = board.members.some((m) => m.user.equals(user._id));
    if (alreadyMember) return res.status(400).json({ message: 'Already a member' });

    board.members.push({ user: user._id, role: role || 'member' });
    await board.save();
    await board.populate('members.user', 'name email avatar');
    res.json(board);
  } catch (err) {
    next(err);
  }
};
