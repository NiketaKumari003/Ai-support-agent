const mongoose = require('mongoose')

const humanQueueSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    sessionId: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: 'User requested human',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
)

const HumanQueue =
  mongoose.models.HumanQueue || mongoose.model('HumanQueue', humanQueueSchema)

module.exports = HumanQueue

