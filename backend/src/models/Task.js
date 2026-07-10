const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  columnId: { type: String, required: true },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  labels: [{ type: String }],
  dueDate: { type: Date },
  order: { type: Number, default: 0 },
  completedAt: { type: Date },
  isArchived: { type: Boolean, default: false },
  comments: [{
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// The "done" column marks completion. Keep `completedAt` in sync as tasks move
// in and out of it so analytics don't count re-opened tasks as complete.
const DONE_COLUMN = 'done';

taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isModified('columnId')) {
    if (this.columnId === DONE_COLUMN && !this.completedAt) {
      this.completedAt = Date.now();
    } else if (this.columnId !== DONE_COLUMN && this.completedAt) {
      this.completedAt = undefined;
    }
  }
  next();
});
taskSchema.index({ board: 1, columnId: 1 });
taskSchema.index({ board: 1, assignees: 1 });
taskSchema.index({ board: 1, isArchived: 1, order: 1 });
module.exports = mongoose.model('Task', taskSchema);
