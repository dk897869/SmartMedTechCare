const nodemailer = require("nodemailer");
const twilio = require("twilio");

// Configure Nodemailer SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Configure Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log("📱 Twilio SMS Service initialized successfully.");
  } catch (err) {
    console.error("❌ Failed to initialize Twilio client:", err.message);
  }
}

/**
 * Generate a random 6-digit numeric OTP
 * @returns {string}
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP Code to user email
 * @param {string} email - Destination email
 * @param {string} otp - Verification code
 */
const sendEmailOtp = async (email, otp) => {
  if (process.env.MOCK_MODE === "true") {
    console.log(`🤖 [MOCK MODE] Simulated Email OTP sent to ${email} -> Code: ${otp}`);
    return { mock: true };
  }

  const mailOptions = {
    from: `"SmartMedTechCare Support" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "🏥 SmartMedTechCare - Email Verification Code",
    html: `
      <div style="font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #10b981; margin: 0;">SmartMed<span style="color: #0f766e;">TechCare</span></h2>
          <p style="color: #64748b; font-size: 0.9rem; margin-top: 5px;">Your AI-Powered Healthcare Assistant</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
        <p style="color: #334155; font-size: 1rem; line-height: 1.5;">Dear User,</p>
        <p style="color: #334155; font-size: 1rem; line-height: 1.5;">Thank you for registering with SmartMedTechCare. Use the following verification code to complete your signup process. This code is valid for <strong>5 minutes</strong>.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; padding: 12px 30px; font-size: 2rem; font-weight: bold; letter-spacing: 5px; color: #10b981; background-color: #ecfdf5; border-radius: 8px; border: 1px dashed #10b981;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #ef4444; font-size: 0.85rem; font-weight: 500;">⚠️ Security Notice: Do not share this OTP with anyone, including our support agents.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 15px;" />
        <p style="color: #94a3b8; font-size: 0.75rem; text-align: center; margin: 0;">&copy; 2026 SmartMedTechCare. All rights reserved.</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send OTP Code to user mobile phone via SMS
 * @param {string} phone - Destination phone number
 * @param {string} otp - Verification code
 */
const sendSmsOtp = async (phone, otp) => {
  if (process.env.MOCK_MODE === "true") {
    console.log(`🤖 [MOCK MODE] Simulated SMS OTP sent to ${phone} -> Code: ${otp}`);
    return { mock: true };
  }

  if (!twilioClient) {
    throw new Error("Twilio SMS provider is not configured.");
  }

  // Format phone number to international standard (defaulting to Indian +91 if 10 digits)
  let formattedPhone = phone.trim();
  if (!formattedPhone.startsWith("+")) {
    if (formattedPhone.length === 10) {
      formattedPhone = "+91" + formattedPhone;
    } else {
      formattedPhone = "+" + formattedPhone;
    }
  }

  console.log(`✉️ Sending Twilio SMS to ${formattedPhone}...`);
  return await twilioClient.messages.create({
    body: `SmartMedTechCare OTP Code: ${otp}. Valid for 5 minutes. Do not share this with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: formattedPhone,
  });
};

module.exports = {
  generateOtp,
  sendEmailOtp,
  sendSmsOtp,
};
