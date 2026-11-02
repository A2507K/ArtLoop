const express = require('express');
const mongoose = require('mongoose');

const SwapRequest = require('../models/SwapRequest');
const Product = require('../models/Product');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { requestedProductId, offeredProductId, message } = req.body;
    const requesterId = req.user.userId;

    if (
      !mongoose.Types.ObjectId.isValid(requestedProductId) ||
      !mongoose.Types.ObjectId.isValid(offeredProductId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    if (requestedProductId === offeredProductId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot swap a product with itself.',
      });
    }

    if (message && message.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 500 characters.',
      });
    }

    const requestedProduct = await Product.findById(requestedProductId);
    const offeredProduct = await Product.findById(offeredProductId);

    if (!requestedProduct || !offeredProduct) {
      return res.status(404).json({
        success: false,
        message: 'One or both products were not found.',
      });
    }

    if (requestedProduct.isSold || offeredProduct.isSold) {
      return res.status(400).json({
        success: false,
        message: 'Swaps are only allowed for available products.',
      });
    }

    if (
      requestedProduct.seller.toString() === requesterId
    ) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request a swap for your own product.',
      });
    }

    if (offeredProduct.seller.toString() !== requesterId) {
      return res.status(403).json({
        success: false,
        message: 'You can only offer your own product.',
      });
    }

    if (
      requestedProduct.seller.toString() ===
      offeredProduct.seller.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: 'These products belong to the same seller.',
      });
    }

    const existingRequest = await SwapRequest.findOne({
      requester: requesterId,
      requestedProduct: requestedProductId,
      offeredProduct: offeredProductId,
      status: 'Pending',
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You have already sent this swap request.',
      });
    }

    const swapRequest = await SwapRequest.create({
      requester: requesterId,
      receiver: requestedProduct.seller,
      requestedProduct: requestedProductId,
      offeredProduct: offeredProductId,
      message: message || '',
    });

    res.status(201).json({
      success: true,
      message: 'Swap request sent successfully.',
      swapRequest,
    });
  } catch (error) {
    console.error('Create swap request error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create swap request.',
    });
  }
});


router.get('/sent', authMiddleware, async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      requester: req.user.userId,
    })
      .populate('requester', 'name email')
      .populate('receiver', 'name email')
      .populate('requestedProduct')
      .populate('offeredProduct')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Fetch sent swaps error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent swap requests.',
    });
  }
});


router.get('/received', authMiddleware, async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      receiver: req.user.userId,
    })
      .populate('requester', 'name email')
      .populate('receiver', 'name email')
      .populate('requestedProduct')
      .populate('offeredProduct')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Fetch received swaps error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch received swap requests.',
    });
  }
});


router.patch('/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { action } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid swap request ID.',
      });
    }

    if (!['Accepted', 'Rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be Accepted or Rejected.',
      });
    }

    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found.',
      });
    }

    if (swapRequest.receiver.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to respond to this request.',
      });
    }

    if (swapRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed.',
      });
    }

    if (action === 'Accepted') {
      const requestedProduct = await Product.findById(
        swapRequest.requestedProduct
      );

      const offeredProduct = await Product.findById(
        swapRequest.offeredProduct
      );

      if (
        !requestedProduct ||
        !offeredProduct ||
        requestedProduct.isSold ||
        offeredProduct.isSold
      ) {
        return res.status(400).json({
          success: false,
          message: 'One or both products are no longer available.',
        });
      }

      requestedProduct.isSold = true;
      offeredProduct.isSold = true;

      await requestedProduct.save();
      await offeredProduct.save();
    }

    swapRequest.status = action;
    await swapRequest.save();

    res.status(200).json({
      success: true,
      message: `Swap request ${action.toLowerCase()} successfully.`,
      swapRequest,
    });
  } catch (error) {
    console.error('Respond to swap error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to respond to swap request.',
    });
  }
});


router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid swap request ID.',
      });
    }

    const swapRequest = await SwapRequest.findById(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found.',
      });
    }

    if (swapRequest.requester.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own requests.',
      });
    }

    if (swapRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled.',
      });
    }

    swapRequest.status = 'Cancelled';
    await swapRequest.save();

    res.status(200).json({
      success: true,
      message: 'Swap request cancelled successfully.',
      swapRequest,
    });
  } catch (error) {
    console.error('Cancel swap error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to cancel swap request.',
    });
  }
});

module.exports = router;