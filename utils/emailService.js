import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com', // SMTP server
    port: smtpPort,
    secure: smtpPort === 465, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASSWORD // Your email password
    },
    tls: {
        rejectUnauthorized: false // Accept self-signed certificates
    }
});

/**
 * Send OTP to user's email
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP
 */
export const sendEmailOTP = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: '🩸 Blood Donor - Verify Your Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Blood Donor</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Email Verification</p>
                    </div>
                    
                    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color: #1f2937; margin-top: 0;">Verify Your Registration</h2>
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                            Thank you for registering as a blood donor! Your dedication can save lives.
                        </p>
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                            Please use the following One-Time Password (OTP) to complete your registration:
                        </p>
                        
                        <div style="background: #fef2f2; border: 2px dashed #ef4444; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                            <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your OTP</p>
                            <p style="font-size: 36px; font-weight: bold; color: #ef4444; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                ${otp}
                            </p>
                        </div>
                        
                        <p style="color: #9ca3af; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            ⚠️ This OTP is valid for this session only. Do not share it with anyone.
                        </p>
                        <p style="color: #9ca3af; font-size: 14px; margin: 10px 0 0 0;">
                            If you didn't request this, please ignore this email.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} Blood Donor App. All rights reserved.</p>
                        <p>Saving lives, one donation at a time 🩸</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email OTP sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email OTP:', error);
        throw error;
    }
};
