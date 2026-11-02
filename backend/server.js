const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Allowed frontend origins
const allowedOrigins = (
  process.env.FRONTEND_URL || 'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an origin (health checks, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./Route/auth');
app.use('/api/auth', authRoutes);

const productRoutes = require('./Route/products');
app.use('/api/products', productRoutes);

const swapRoutes = require('./Route/swaps');
app.use('/api/swaps', swapRoutes);

const chatRoutes = require('./Route/chats');
app.use('/api/chats', chatRoutes);

const adminRoutes = require('./Route/admin');
app.use('/api/admin', adminRoutes);

const disputeRoutes = require('./Route/disputes');
app.use('/api/disputes', disputeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Art Supply Marketplace API is running!',
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message:
      'Welcome to the Art Supply Exchange & Second-hand Material Marketplace API',
  });
});

// Start server
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from the environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected successfully!');

    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the backend:', error.message);
    process.exit(1);
  }
}

startServer();