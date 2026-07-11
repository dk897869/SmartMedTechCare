const Medicine = require("../models/Medicine");
const Inventory = require("../models/Inventory");
const Pharmacy = require("../models/Pharmacy");

// @desc    Search medicines by query or category
// @route   GET /api/medicines
// @access  Public
const searchMedicines = async (req, res) => {
  try {
    const { query, category } = req.query;
    let filter = {};

    if (category) {
      filter.category = category;
    }

    if (query) {
      filter.$text = { $search: query };
    }

    const medicines = await Medicine.find(filter);
    res.json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error) {
    console.error("Search Medicines Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get medicine details
// @route   GET /api/medicines/:id
// @access  Public
const getMedicineDetails = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    console.error("Get Medicine Detail Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Compare prices for a specific medicine across all pharmacies
// @route   GET /api/medicines/:id/compare
// @access  Public
const comparePrices = async (req, res) => {
  try {
    const medicineId = req.params.id;

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    // Find all inventory items for this medicine and populate pharmacy information
    const listings = await Inventory.find({ medicineId })
      .populate("pharmacyId", "name address location contact rating")
      .sort({ price: 1 }); // Sort by cheapest price first

    res.json({
      success: true,
      medicine,
      data: listings,
    });
  } catch (error) {
    console.error("Compare Prices Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  searchMedicines,
  getMedicineDetails,
  comparePrices,
};
