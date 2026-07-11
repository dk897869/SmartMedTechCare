const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { generateOtp, sendEmailOtp, sendSmsOtp } = require("../services/otpService");

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "smartmedtechcare_jwt_secret_key_123_super_secret",
    { expiresIn: "30d" }
  );
};

// @desc    Send OTP to email and phone
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Email and phone number are required",
      });
    }

    // Check if user already exists in database
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already registered with this email address",
      });
    }

    const emailOtp = generateOtp();
    const smsOtp = generateOtp();

    // Clear previous OTP records
    await Otp.deleteMany({ email: email.toLowerCase() });

    // Store verification codes in DB
    await Otp.create({
      email: email.toLowerCase(),
      phone,
      emailOtp,
      smsOtp
    });

    console.log(`🔑 OTP generated for ${email}: Email OTP = ${emailOtp}, SMS OTP = ${smsOtp}`);

    // Send Email
    try {
      await sendEmailOtp(email, emailOtp);
    } catch (smtpError) {
      console.warn("⚠️ Email delivery warning (SMTP):", smtpError.message);
      // Catch SMTP failures (e.g. BadCredentials 535) so it doesn't block signup
    }

    // Send SMS via Twilio
    try {
      await sendSmsOtp(phone, smsOtp);
    } catch (twilioError) {
      console.warn("⚠️ SMS delivery warning (Twilio):", twilioError.message);
      // Catch Twilio delivery issues without blocking signup
    }

    res.status(200).json({
      success: true,
      message: "Verification codes generated successfully.",
      devCodes: { emailOtp, smsOtp }
    });
  } catch (error) {
    console.error("Send OTP Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Register a new user (with verification validation)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, emailOtp, smsOtp } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Google login OAuth bypass password check
    const isGoogleOAuth = password === "google_oauth_secure_password_123_bypass";

    if (!isGoogleOAuth) {
      // Validate verification codes
      if (!emailOtp || !smsOtp) {
        return res.status(400).json({
          success: false,
          message: "Please enter verification codes for both Email and SMS",
        });
      }

      const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Verification codes have expired or do not exist. Please resend code.",
        });
      }

      if (otpRecord.emailOtp !== emailOtp.trim() || otpRecord.smsOtp !== smsOtp.trim()) {
        return res.status(400).json({
          success: false,
          message: "Incorrect Email OTP or Mobile SMS OTP code",
        });
      }

      // Valid codes, clear OTP record from collection
      await Otp.deleteOne({ _id: otpRecord._id });
    }

    // Create the User record
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || "",
      role: role || "user",
      isVerified: true
    });

    if (user) {
      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user data",
      });
    }
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.comparePassword(password))) {
      return res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
      res.json({
        success: true,
        data: user,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user profile / health data / profile photo
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      if (req.body.profilePhoto !== undefined) {
        user.profilePhoto = req.body.profilePhoto;
      }

      if (req.body.defaultLocation) {
        user.defaultLocation = {
          lat: req.body.defaultLocation.lat !== undefined ? req.body.defaultLocation.lat : user.defaultLocation.lat,
          lng: req.body.defaultLocation.lng !== undefined ? req.body.defaultLocation.lng : user.defaultLocation.lng,
          address: req.body.defaultLocation.address || user.defaultLocation.address,
        };
      }

      if (req.body.profile) {
        user.profile = {
          age: req.body.profile.age !== undefined ? req.body.profile.age : user.profile.age,
          weight: req.body.profile.weight !== undefined ? req.body.profile.weight : user.profile.weight,
          height: req.body.profile.height !== undefined ? req.body.profile.height : user.profile.height,
          bloodGroup: req.body.profile.bloodGroup || user.profile.bloodGroup,
          allergies: req.body.profile.allergies || user.profile.allergies,
          chronicConditions: req.body.profile.chronicConditions || user.profile.chronicConditions,
          medicationReminders: req.body.profile.medicationReminders || user.profile.medicationReminders,
        };
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          profilePhoto: updatedUser.profilePhoto,
          defaultLocation: updatedUser.defaultLocation,
          profile: updatedUser.profile
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user profile
// @route   DELETE /api/auth/profile
// @access  Private
const deleteUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.deleteOne({ _id: req.user._id });

    res.json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("Delete Profile Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendOtp,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
