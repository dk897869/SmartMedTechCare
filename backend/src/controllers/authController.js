const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "smartmedtechcare_jwt_secret_key_123_super_secret",
    { expiresIn: "30d" }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",
    });

    if (user) {
      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
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

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      return res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
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
    const user = await User.findById(req.user._id);

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

// @desc    Update user profile / health data
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
        data: updatedUser,
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

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
