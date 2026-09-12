const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zerodowntimedb';

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// VERSION tells us which slot (blue/green) is responding — set via
// an environment variable in docker-compose.yml. Useful for confirming
// which slot is currently live during a switch.
const VERSION = process.env.VERSION || 'unknown';

// Health check endpoint - critical for zero-downtime deployment & auto-healing
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  if (dbState === 1) {
    res.status(200).json({ status: 'healthy', db: 'connected', version: VERSION });
  } else {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected', version: VERSION });
  }
});

// Sample data model
const Item = mongoose.model('Item', new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}));

// Sample API routes
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const item = new Item({ name: req.body.name });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
