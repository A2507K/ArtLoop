const express = require('express');
const router = express.Router();

const Dispute = require('../models/Dispute');
const User = require('../models/User');
const Product = require('../models/Product');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Create a dispute
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { againstUser, product, reason, description } = req.body;

        if (!againstUser || !reason || !description) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (!['Scam', 'Payment Issue', 'Product Issue', 'Other'].includes(reason)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid dispute reason'
            });
        }

        if (description.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: 'Description cannot exceed 2000 characters'
            });
        }

        if (req.user.userId.toString() === againstUser.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot report yourself'
            });
        }

        const reportedUser = await User.findById(againstUser);

        if (!reportedUser) {
            return res.status(404).json({
                success: false,
                message: 'Reported user not found'
            });
        }

        if (product) {
            const existingProduct = await Product.findById(product);

            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
        }

        const dispute = await Dispute.create({
            reportedBy: req.user.userId, againstUser,
            product: product || null,
            reason,
            description: description.trim()
        });

        res.status(201).json({
            success: true,
            message: 'Dispute submitted successfully',
            dispute
        });

    } catch (error) {
        console.error('Create dispute error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to submit dispute'
        });
    }
});

// Get user's own disputes
router.get('/my', authMiddleware, async (req, res) => {
try {
console.log('Logged-in user ID:', req.user.userId);

    const disputes = await Dispute.find({
        reportedBy: req.user.userId
    })
        .populate('againstUser', 'name email')
        .populate('product', 'title name')
        .sort({ createdAt: -1 });

    console.log('Disputes found:', disputes.length);
    console.log('Disputes:', disputes);

    res.json({
        success: true,
        disputes
    });

} catch (error) {
    console.error('Fetch disputes error:', error);

    res.status(500).json({
        success: false,
        message: 'Failed to fetch disputes'
    });
}

});



// Admin: Get all disputes
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const disputes = await Dispute.find()
            .populate('reportedBy', 'name email')
            .populate('againstUser', 'name email')
            .populate('product', 'title name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: disputes.length,
            disputes
        });

    } catch (error) {
        console.error('Admin fetch disputes error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch disputes'
        });
    }
});


// Admin: Update dispute status and notes
router.patch('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        const allowedStatuses = [
            'Pending',
            'Under Review',
            'Resolved',
            'Rejected'
        ];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid dispute status'
            });
        }

        const dispute = await Dispute.findById(req.params.id);

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: 'Dispute not found'
            });
        }

        if (status) dispute.status = status;

        if (adminNotes !== undefined) {
            if (typeof adminNotes !== 'string' || adminNotes.length > 2000) {
                return res.status(400).json({
                    success: false,
                    message: 'Admin notes must be a string of at most 2000 characters'
                });
            }

            dispute.adminNotes = adminNotes.trim();
        }

        await dispute.save();

        res.json({
            success: true,
            message: 'Dispute updated successfully',
            dispute
        });

    } catch (error) {
        console.error('Update dispute error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to update dispute'
        });
    }
});

module.exports = router;