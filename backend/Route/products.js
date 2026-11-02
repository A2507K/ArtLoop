const express = require('express');
const mongoose = require('mongoose');

const Product = require('../models/Product');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const cloudinary = require('../config/cloudinary');
const upload = require('../middleware/upload');

const router = express.Router();

// ========================================
// GET ALL PRODUCTS
// ========================================

router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Fetch products error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve products.',
    });
  }
});

// ========================================
// GET MY LISTINGS
// ========================================

router.get('/my/listings', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({
      seller: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Fetch my listings error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve your listings.',
    });
  }
});

// ========================================
// GET MY WISHLIST
// ========================================

router.get('/my/wishlist', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate({
        path: 'wishlist',
        populate: {
          path: 'seller',
          select: 'name email',
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      count: user.wishlist.length,
      products: user.wishlist,
    });
  } catch (error) {
    console.error('Fetch wishlist error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve wishlist.',
    });
  }
});

// ========================================
// ADD PRODUCT TO WISHLIST
// ========================================

router.post('/:id/wishlist', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.wishlist.addToSet(product._id);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist.',
      wishlistCount: user.wishlist.length,
    });
  } catch (error) {
    console.error('Add wishlist error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to add product to wishlist.',
    });
  }
});

// ========================================
// MARK PRODUCT AS SOLD
// ========================================

router.patch('/:id/sold', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const isAdmin = req.user.role === 'admin';

    const isOwner =
      product.seller &&
      product.seller.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can mark this product as sold.',
      });
    }

    if (product.isSold) {
      return res.status(400).json({
        success: false,
        message: 'This product is already sold.',
      });
    }

    product.isSold = true;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product marked as sold successfully!',
      product,
    });
  } catch (error) {
    console.error('Mark product sold error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to update product status.',
    });
  }
});

// ========================================
// REMOVE PRODUCT FROM WISHLIST
// ========================================

router.delete('/:id/wishlist', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.wishlist.pull(req.params.id);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist.',
      wishlistCount: user.wishlist.length,
    });
  } catch (error) {
    console.error('Remove wishlist error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to remove product from wishlist.',
    });
  }
});

// ========================================
// PRODUCT REVIEWS
// ========================================

router.post('/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    if (
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5.',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please write a review.',
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review cannot exceed 1000 characters.',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    if (
      product.seller &&
      product.seller.toString() === req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You cannot review your own product.',
      });
    }

    const alreadyReviewed = product.reviews.some(
      (review) => review.user.toString() === req.user.userId.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product.',
      });
    }

    product.reviews.push({
      user: req.user.userId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    await product.save();

    await product.populate('reviews.user', 'name');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      reviews: product.reviews,
    });
  } catch (error) {
    console.error('Submit review error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to submit review.',
    });
  }
});

// ========================================
// GET INDIVIDUAL PRODUCT
// ========================================

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email phone')
      .populate('reviews.user', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const totalReviews = product.reviews.length;

    const averageRating =
      totalReviews > 0
        ? (
            product.reviews.reduce(
              (total, review) => total + review.rating,
              0
            ) / totalReviews
          ).toFixed(1)
        : 0;

    res.status(200).json({
      success: true,
      product,
      averageRating: Number(averageRating),
      totalReviews,
    });
  } catch (error) {
    console.error('Get product error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ========================================
// PRODUCT LIKES
// ========================================

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const userId = req.user.userId;

    if (product.likes.some((id) => id.toString() === userId)) {
      product.likes = product.likes.filter(
        (id) => id.toString() !== userId
      );

      await product.save();

      return res.status(200).json({
        success: true,
        liked: false,
        likesCount: product.likes.length,
        message: 'Like removed.',
      });
    }

    product.likes.push(userId);

    await product.save();

    res.status(200).json({
      success: true,
      liked: true,
      likesCount: product.likes.length,
      message: 'Product liked.',
    });
  } catch (error) {
    console.error('Like product error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to update like.',
    });
  }
});

// ========================================
// CREATE PRODUCT WITH IMAGE UPLOAD
// ========================================

router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      const {
        name,
        category,
        price,
        condition,
        location,
        description,
      } = req.body;

      let imageUrl = req.body.image || '';

      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'artloop/products',
              resource_type: 'image',
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          stream.end(req.file.buffer);
        });

        imageUrl = result.secure_url;
      }

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a product image.',
        });
      }

      const product = await Product.create({
        name,
        category,
        price,
        condition,
        location,
        image: imageUrl,
        description,
        seller: req.user.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Product listed successfully.',
        product,
      });
    } catch (error) {
      console.error('Create product error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Unable to create product.',
      });
    }
  }
);

// ========================================
// UPDATE PRODUCT WITH IMAGE UPLOAD
// ========================================

router.put(
  '/:id',
  authMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID.',
        });
      }

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found.',
        });
      }

      const isAdmin = req.user.role === 'admin';

      const isOwner =
        product.seller &&
        product.seller.toString() === req.user.userId;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own products.',
        });
      }

      const allowedFields = [
        'name',
        'category',
        'price',
        'condition',
        'location',
        'description',
      ];

      allowedFields.forEach((field) => {
        if (req.body && req.body[field] !== undefined) {
          product[field] = req.body[field];
        }
      });

      // Upload replacement image if selected
      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'artloop/products',
              resource_type: 'image',
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          stream.end(req.file.buffer);
        });

        product.image = result.secure_url;
      } else if (req.body && req.body.image !== undefined) {
        product.image = req.body.image;
      }

      await product.save();

      res.status(200).json({
        success: true,
        message: 'Product updated successfully.',
        product,
      });
    } catch (error) {
      console.error('Update product error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Unable to update product.',
      });
    }
  }
);

// ========================================
// DELETE PRODUCT
// ========================================

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const isAdmin = req.user.role === 'admin';

    const isOwner =
      product.seller &&
      product.seller.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own products.',
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    console.error('Delete product error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to delete product.',
    });
  }
});

module.exports = router;