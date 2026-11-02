const express = require('express');
const mongoose = require('mongoose');

const Chat = require('../models/Chat');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Start a conversation with a product seller
router.post('/product/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    if (!product.seller) {
      return res.status(400).json({
        success: false,
        message: 'Seller information is unavailable.',
      });
    }

    if (product.seller.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot chat with yourself.',
      });
    }

    if (product.isSold) {
      return res.status(400).json({
        success: false,
        message: 'This product has already been sold.',
      });
    }

    let chat = await Chat.findOne({
      product: productId,
      participants: { $all: [userId, product.seller] },
    });

    if (!chat) {
      chat = await Chat.create({
        product: productId,
        participants: [userId, product.seller],
        messages: [],
      });
    }

    await chat.populate([
      { path: 'participants', select: 'name email' },
      { path: 'product', select: 'name image price seller' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Conversation opened successfully.',
      chat,
    });
  } catch (error) {
    console.error('Start chat error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to start conversation.',
    });
  }
});


// Get all conversations with unread message counts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.find({
      participants: userId,
    })
      .populate('participants', 'name email')
      .populate('product', 'name image price')
      .sort({ updatedAt: -1 });

    const chatsWithUnreadCount = chats.map((chat) => {
      const unreadCount = chat.messages.filter((message) => {
        const sentByOtherUser =
          message.sender.toString() !== userId;

        const alreadyRead = (message.readBy || []).some(
          (reader) => reader.toString() === userId
        );

        return sentByOtherUser && !alreadyRead;
      }).length;

      return {
        ...chat.toObject(),
        unreadCount,
      };
    });

    res.status(200).json({
      success: true,
      chats: chatsWithUnreadCount,
    });
  } catch (error) {
    console.error('Fetch chats error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch conversations.',
    });
  }
});


// Get a conversation and mark received messages as read
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID.',
      });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const userId = req.user.userId;

    const isParticipant = chat.participants.some(
      (participant) => participant.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to access this conversation.',
      });
    }

    // Mark messages from the other participant as read
    let changed = false;

    chat.messages.forEach((message) => {
      const sentByOtherUser =
        message.sender.toString() !== userId;

      const alreadyRead = (message.readBy || []).some(
        (reader) => reader.toString() === userId
      );

      if (sentByOtherUser && !alreadyRead) {
        message.readBy.push(userId);
        changed = true;
      }
    });

    if (changed) {
      await chat.save();
    }

    await chat.populate([
      { path: 'participants', select: 'name email' },
      { path: 'product', select: 'name image price' },
      { path: 'messages.sender', select: 'name' },
    ]);

    res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error('Fetch conversation error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch conversation.',
    });
  }
});


// Send a message
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID.',
      });
    }

    if (!text || !text.trim() || text.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message must contain 1–2000 characters.',
      });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const userId = req.user.userId;

    const isParticipant = chat.participants.some(
      (participant) => participant.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to send messages here.',
      });
    }

    chat.messages.push({
      sender: userId,
      text: text.trim(),
      readBy: [userId],
    });

    await chat.save();

    await chat.populate('messages.sender', 'name');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      chat,
    });
  } catch (error) {
    console.error('Send message error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to send message.',
    });
  }
});

module.exports = router;