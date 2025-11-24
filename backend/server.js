require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const escalateRoutes = require('./routes/escalate');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ai-support-agent.vercel.app', 'https://ai-support-agent-backend.onrender.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Basic routes
app.get('/', (req, res) => res.json({ ok: true, message: 'AI Support Agent Backend' }));

// API
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/escalate', escalateRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start
(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
