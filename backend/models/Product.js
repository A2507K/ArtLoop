const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: ['Paints', 'Brushes', 'Canvas', 'Drawing', 'Craft Tools'],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    condition: {
      type: String,
      required: true,
      enum: ['Like New', 'Good', 'Lightly Used', 'Used'],
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    isSold: {
      type: Boolean,
      default: false,
    },

    reviews: {
      type: [reviewSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);