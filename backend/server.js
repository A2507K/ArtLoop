const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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


app.get('/api/health', (req, res) => {

  res.status(200).json({
    success: true,
    message: 'Art Supply Marketplace API is running!',
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message:
      'Welcome to the Art Supply Exchange & Second-hand Material Marketplace API',
  });
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from the .env file');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected successfully!');

    app.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the backend:', error.message);
    process.exit(1);
  }
}

startServer();