const Board = require('../models/Board');
const User = require('../models/User');

const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#64748b', order: 0 },
  { id: 'inprogress', title: 'In Progress', color: '#6366f1', order: 1 },
  { id: 'review', title: 'In Review', color: '#f59e0b', order: 2 },
  { id: 'done', title: 'Done', color: '#10b981', order: 3 }
];

exports.getBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      isArchived: false
    }).populate('owner', 'name email').populate('members.user', 'name email');
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBoard = async (req, res) => {
  try {
    const { title, description, color } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });

    const board = new Board({
      title, description, color: color || '#6366f1',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      columns: DEFAULT_COLUMNS
    });
    await board.save();
    await board.populate('owner', 'name email');
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const isMember = board.owner._id.equals(req.user._id) ||
      board.members.some(m => m.user._id.equals(req.user._id));
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (!board.owner.equals(req.user._id)) return res.status(403).json({ message: 'Only owner can update' });

    const { title, description, color, columns } = req.body;
    if (title) board.title = title;
    if (description !== undefined) board.description = description;
    if (color) board.color = color;
    if (columns) board.columns = columns;

    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (!board.owner.equals(req.user._id)) return res.status(403).json({ message: 'Only owner can delete' });

    board.isArchived = true;
    await board.save();
    res.json({ message: 'Board archived' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (!board.owner.equals(req.user._id)) return res.status(403).json({ message: 'Only owner can invite' });

    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const alreadyMember = board.members.some(m => m.user.equals(user._id));
    if (alreadyMember) return res.status(400).json({ message: 'Already a member' });

    board.members.push({ user: user._id, role: role || 'member' });
    await board.save();
    await board.populate('members.user', 'name email avatar');
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
