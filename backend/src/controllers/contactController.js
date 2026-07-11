const Contact = require("../models/Contact");

// @desc    Submit a new contact query
// @route   POST /api/contacts
// @access  Public
const submitContactQuery = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required fields",
      });
    }

    const contact = await Contact.create({
      name,
      email,
      phone: phone || "",
      message,
    });

    res.status(201).json({
      success: true,
      message: "Contact query submitted successfully. Our medical assistants will reach out shortly.",
      data: contact,
    });
  } catch (error) {
    console.error("Submit Contact Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all contact queries (Admin only)
// @route   GET /api/contacts
// @access  Private/Admin
const getAllContactQueries = async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("Get Contacts Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  submitContactQuery,
  getAllContactQueries,
};
