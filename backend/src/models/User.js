const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    defaultLocation: {
      lat: { type: Number, default: 28.6139 }, // Default to New Delhi or user geo
      lng: { type: Number, default: 77.2090 },
      address: { type: String, default: "Default Address" }
    },
    profile: {
      age: { type: Number },
      weight: { type: Number }, // in kg
      height: { type: Number }, // in cm
      bloodGroup: { type: String },
      allergies: [{ type: String }],
      chronicConditions: [{ type: String }],
      medicationReminders: [
        {
          medicineName: { type: String, required: true },
          dosage: { type: String }, // e.g. "1 pill", "5ml"
          time: { type: String }, // e.g. "08:00", "20:00"
          frequency: { type: String, default: "Daily" }, // "Daily", "Weekly"
          active: { type: Boolean, default: true }
        }
      ]
    }
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema, "users");
