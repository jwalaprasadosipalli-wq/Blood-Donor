import express from 'express';
import jwt from 'jsonwebtoken';
import Donor from '../models/Donor.js';
import { sendOTP } from '../utils/whatsappService.js';
import { sendEmailOTP } from '../utils/emailService.js';

const router = express.Router();

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @route   POST /api/auth/send-otp
// @desc    Send OTP to mobile number (OTP sent to registered email)
router.post('/send-otp', async (req, res) => {
    try {
        const { mobile } = req.body;

        // Validation
        if (!/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
        }

        // Check if donor exists
        const donor = await Donor.findOne({ where: { mobile } });
        if (!donor) {
            return res.status(404).json({ message: 'Mobile number not registered.' });
        }

        // Check if donor has email
        if (!donor.email) {
            return res.status(400).json({ message: 'No email associated with this account. Please contact support.' });
        }

        // Generate Dynamic OTP
        const otp = generateOTP();

        // Store in DB
        donor.otp = otp;
        await donor.save();

        // Send to Email (not WhatsApp)
        await sendEmailOTP(donor.email, otp);

        res.json({
            message: 'OTP sent to your registered email successfully',
            email: donor.email
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and return JWT
router.post('/verify-otp', async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        const donor = await Donor.findOne({ where: { mobile, otp } });

        if (!donor) {
            return res.status(400).json({ message: 'Invalid OTP or mobile number' });
        }

        // Clear OTP after successful use
        donor.otp = null;
        await donor.save();

        // Create JWT
        const token = jwt.sign({ id: donor.id }, process.env.JWT_SECRET || 'secret_key', {
            expiresIn: '30d'
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: donor.id,
                fullName: donor.fullName,
                mobile: donor.mobile,
                availability: donor.availability
            }
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/send-email-otp
// @desc    Send OTP to email address
router.post('/send-email-otp', async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email format
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: 'Valid email address is required' });
        }

        // Validate email
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if donor exists with this email
        const donor = await Donor.findOne({ where: { email } });
        if (!donor) {
            return res.status(404).json({ message: 'Email not registered. Please register first.' });
        }

        // Generate Dynamic OTP
        const otp = generateOTP();

        // Store in DB
        donor.otp = otp;
        await donor.save();

        // Send to Email
        await sendEmailOTP(email, otp);

        res.json({ message: 'OTP sent to your email successfully' });
    } catch (error) {
        console.error('Error sending email OTP:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/verify-email-otp
// @desc    Verify email OTP and return JWT
router.post('/verify-email-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validate inputs
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const donor = await Donor.findOne({ where: { email, otp } });

        if (!donor) {
            return res.status(400).json({ message: 'Invalid OTP or email address' });
        }

        // Clear OTP after successful use
        donor.otp = null;
        await donor.save();

        // Create JWT
        const token = jwt.sign({ id: donor.id }, process.env.JWT_SECRET || 'secret_key', {
            expiresIn: '30d'
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: donor.id,
                fullName: donor.fullName,
                email: donor.email,
                mobile: donor.mobile,
                availability: donor.availability
            }
        });

    } catch (error) {
        console.error('Error verifying email OTP:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        const donor = await Donor.findByPk(decoded.id);

        if (!donor) return res.status(404).json({ message: 'User not found' });

        res.json(donor);
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

export default router;
