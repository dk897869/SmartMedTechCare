const Pharmacy = require("../models/Pharmacy");
const { calculateDistance } = require("../services/locationService");

// @desc    Get nearby pharmacies based on user geolocation
// @route   GET /api/pharmacies/nearby
// @access  Public
const getNearbyPharmacies = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Please provide your latitude (lat) and longitude (lng) coordinates.",
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = radius ? parseFloat(radius) : 15; // default 15 km

    // Retrieve all pharmacies
    const pharmacies = await Pharmacy.find({});

    // Calculate distance for each pharmacy and filter
    const pharmaciesWithDistance = pharmacies
      .map((pharmacy) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          pharmacy.location.lat,
          pharmacy.location.lng
        );
        return {
          ...pharmacy.toObject(),
          distance,
        };
      })
      .filter((pharmacy) => pharmacy.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance); // Nearest first

    res.json({
      success: true,
      count: pharmaciesWithDistance.length,
      data: pharmaciesWithDistance,
    });
  } catch (error) {
    console.error("Get Nearby Pharmacies Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get pharmacy details
// @route   GET /api/pharmacies/:id
// @access  Public
const getPharmacyDetails = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    res.json({
      success: true,
      data: pharmacy,
    });
  } catch (error) {
    console.error("Get Pharmacy Detail Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getNearbyPharmacies,
  getPharmacyDetails,
};
