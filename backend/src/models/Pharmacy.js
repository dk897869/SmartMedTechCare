const mongoose = require("mongoose");

const PharmacySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      }
    },
    contact: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    }
  },
  {
    timestamps: true,
  }
);

// GeoJSON index or standard spatial indexes can be simulated, but we'll do proximity search in code via Haversine formula for maximum cross-platform compatibility
module.exports = mongoose.model("Pharmacy", PharmacySchema, "pharmacies");
