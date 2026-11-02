const dns = require('node:dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const products = [
  {
    name: 'Watercolor Paint Set',
    category: 'Paints',
    price: 350,
    condition: 'Lightly Used',
    location: 'Kochi, Kerala',
    image:
      'https://unsplash.com/photos/a-person-drawing-on-a-white-board-bDqmg2jG4Oc',
    description: 'A watercolor paint set for creative painting projects.',
  },
  {
    name: 'Artist Brush Collection',
    category: 'Brushes',
    price: 220,
    condition: 'Good',
    location: 'Thrissur, Kerala',
    image:
      'https://images.unsplash.com/photo-1599601821513-00e3f9fa1e6a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    description: 'A collection of brushes for different painting techniques.',
  },
  {
    name: 'Premium Sketchbook',
    category: 'Drawing',
    price: 180,
    condition: 'Like New',
    location: 'Kozhikode, Kerala',
    image:
      'https://images.pexels.com/photos/31358138/pexels-photo-31358138.jpeg',
    description: 'A sketchbook for drawing, sketching, and creative ideas.',
  },
  {
    name: 'Creative Painting Kit',
    category: 'Craft Tools',
    price: 450,
    condition: 'Lightly Used',
    location: 'Bengaluru, Karnataka',
    image:
      'https://images.pexels.com/photos/5512623/pexels-photo-5512623.jpeg',
    description: 'A creative kit for painting and craft activities.',
  },
];

async function seedProducts() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from the .env file');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB.');

    for (const product of products) {
      await Product.updateOne(
        { name: product.name },
        { $setOnInsert: product },
        { upsert: true, runValidators: true }
      );
    }

    console.log('Sample products added successfully!');

    const count = await Product.countDocuments();
    console.log(`Total products in database: ${count}`);
  } catch (error) {
    console.error('Error adding products:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();