const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
  },
  emailOtp: {
    type: String,
    required: true,
  },
  smsOtp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Automatic TTL index: documents expire after 300 seconds (5 minutes)
  }
});

module.exports = mongoose.model("Otp", OtpSchema, "otps");
