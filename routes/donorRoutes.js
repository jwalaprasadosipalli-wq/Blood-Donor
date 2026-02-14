import express from 'express';
import Donor from '../models/Donor.js';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import { sendEmailOTP } from '../utils/emailService.js';

const router = express.Router();

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @route   POST /api/donors/register
// @desc    Register a new donor (Step 1: Save details & Send OTP)
router.post('/register', async (req, res) => {
    try {
        const { fullName, bloodGroup, age, mobile, email, address, state, city, lastDonationDate } = req.body;

        // Validation
        if (!/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
        }

        // Relaxed email validation to match frontend
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: 'Valid email address is required.' });
        }

        const otp = generateOTP();

        // Check for existing verified donor with same mobile
        const existingMobile = await Donor.findOne({ where: { mobile, isVerified: true } });
        if (existingMobile) {
            return res.status(400).json({ message: 'Mobile number already registered.' });
        }

        // Check for existing verified donor with same email
        const existingEmail = await Donor.findOne({ where: { email, isVerified: true } });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        // Find existing unverified donor to update, or create new
        let donor = await Donor.findOne({
            where: {
                [Op.or]: [{ mobile }, { email }]
            }
        });

        if (donor) {
            // Update existing unverified donor details
            await donor.update({
                fullName, bloodGroup, age, mobile, email, address, state, city,
                lastDonationDate: (lastDonationDate && !isNaN(Date.parse(lastDonationDate))) ? lastDonationDate : donor.lastDonationDate,
                availability: req.body.availability !== undefined ? req.body.availability : donor.availability,
                otp,
                isVerified: false // Ensure it remains unverified until OTP check
            });
        } else {
            // Create new unverified donor
            donor = await Donor.create({
                fullName, bloodGroup, age, mobile, email, address, state, city,
                lastDonationDate: (lastDonationDate && !isNaN(Date.parse(lastDonationDate))) ? lastDonationDate : null,
                availability: req.body.availability !== undefined ? req.body.availability : true,
                termsAccepted: req.body.termsAccepted !== undefined ? req.body.termsAccepted : false,
                otp,
                isVerified: false
            });
        }

        // Send OTP to Email
        await sendEmailOTP(email, otp);

        res.status(200).json({
            message: 'OTP sent to your email!',
            mobile: mobile,
            email: email,
            otp: otp // Returning OTP for testing/demo purposes
        });
    } catch (error) {
        console.error('Error in registration step 1:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/donors/verify-otp
// @desc    Verify OTP and complete registration
router.post('/verify-otp', async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        const donor = await Donor.findOne({ where: { mobile, otp } });

        if (!donor) {
            return res.status(400).json({ message: 'Invalid OTP or mobile number' });
        }

        // Complete verification
        donor.isVerified = true;
        donor.otp = null; // Clear OTP after use
        await donor.save();

        // Issue JWT token
        const token = jwt.sign({ id: donor.id }, process.env.JWT_SECRET || 'secret_key', {
            expiresIn: '30d'
        });

        res.status(200).json({
            message: 'Verification successful!',
            token,
            donor
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/donors
// @desc    Search donors
router.get('/', async (req, res) => {
    try {
        const { bloodGroup, state, city } = req.query;

        let whereClause = {};

        if (bloodGroup && bloodGroup !== 'Select') {
            whereClause.bloodGroup = bloodGroup;
        }

        if (state && state !== 'Select State') {
            whereClause.state = state;
        }

        if (city && city !== 'Select City') {
            whereClause.city = city;
        }

        // ✅ If no filter selected, return message
        if (Object.keys(whereClause).length === 0) {
            return res.status(400).json({
                message: "Please select at least one filter (bloodGroup/state/city)"
            });
        }

        const donors = await Donor.findAll({ where: whereClause });
        return res.json(donors);
    } catch (error) {
        console.error("Error fetching donors:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// @route   PUT /api/donors/:id/availability
// @desc    Update donor availability
router.put('/:id/availability', async (req, res) => {
    try {
        const donor = await Donor.findByPk(req.params.id);
        if (!donor) return res.status(404).json({ message: 'Donor not found' });

        donor.availability = req.body.availability;
        await donor.save();

        res.json({ message: 'Availability updated', donor });
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/donors/:id
// @desc    Delete donor account
router.delete('/:id', async (req, res) => {
    try {
        const donor = await Donor.findByPk(req.params.id);
        if (!donor) return res.status(404).json({ message: 'Donor not found' });

        await donor.destroy();
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



export default router;
