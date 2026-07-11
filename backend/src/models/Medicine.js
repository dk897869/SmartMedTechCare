const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    activeIngredients: [{ type: String }],
    sideEffects: [{ type: String }],
    dosageGuidance: {
      type: String,
      required: true,
    },
    requiresPrescription: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: "assets/images/placeholder-medicine.png",
    }
  },
  {
    timestamps: true,
  }
);

// Add text index for searching name, brand, and activeIngredients
MedicineSchema.index({ name: "text", brand: "text", activeIngredients: "text" });

module.exports = mongoose.model("Medicine", MedicineSchema, "medicines");
