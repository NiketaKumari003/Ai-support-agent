const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object,
    },
  },
  {
    _id: false,
    timestamps: true,
  }
)

const conversationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    messages: [messageSchema],
    escalated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

const Conversation =
  mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema)

module.exports = Conversation

