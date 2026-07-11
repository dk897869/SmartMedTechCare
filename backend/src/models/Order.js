const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },
    items: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medicine",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Stripe", "Razorpay", "COD"],
      default: "Stripe",
    },
    shippingAddress: {
      type: String,
      required: true,
    },
    deliveryLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    trackingHistory: [
      {
        status: { type: String },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", OrderSchema);
