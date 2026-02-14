/**
 * Mock WhatsApp Service
 * 
 * To go live:
 * 1. Sign up for a provider like UltraMsg, Twilio, or WhatsApp Cloud API.
 * 2. Replace this fetch call with their API endpoint and your API Key.
 */
export const sendOTP = async (mobile, otp) => {
    // Formatting number for WhatsApp (remove non-digits)
    const formattedMobile = mobile.replace(/\D/g, '');

    console.log(`\n--- ATTEMPTING AUTOMATED WHATSAPP SEND ---`);
    console.log(`To: ${formattedMobile}`);
    console.log(`OTP: ${otp}`);

    try {
        const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
        const token = process.env.ULTRAMSG_TOKEN;

        if (!instanceId || !token) {
            console.warn("⚠️ WhatsApp API credentials missing in .env. Falling back to console log.");
            return true;
        }

        const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
        const data = {
            token: token,
            to: formattedMobile,
            body: `Your BloodDonor verification code is: ${otp}`
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log("WhatsApp API Response:", result);
        return response.ok;
    } catch (error) {
        console.error("❌ WhatsApp Delivery Error:", error);
        return false;
    }
};
