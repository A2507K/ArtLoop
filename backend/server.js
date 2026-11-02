require('dotenv').config();

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Allowed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://art-loop-git-main-aravind-ddc4.vercel.app',
  'https://art-loop-asrnuxe88-aravind-ddc4.vercel.app',
  ...(process.env.FRONTEND_URL || '').split(','),
]
  .map((origin) => origin.trim().replace(/\/+$/, ''))
.filter(Boolean);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log('Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,

  })
);

// Middleware
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
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected',
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
      throw new Error('MONGODB_URI is missing from environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected successfully!');

    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
      console.log('Allowed frontend origins:', allowedOrigins);
    });

  } catch (error) {
    console.error('Failed to start the backend:', error.message);
    process.exit(1);
  }
}

startServer();
