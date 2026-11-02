const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    againstUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },

    reason: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Resolved', 'Rejected'],
      default: 'Pending'
    },

    adminNotes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispute', disputeSchema);