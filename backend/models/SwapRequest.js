const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    requestedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    offeredProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

swapRequestSchema.index({
  requester: 1,
  requestedProduct: 1,
  status: 1,
});

module.exports = mongoose.model('SwapRequest', swapRequestSchema);