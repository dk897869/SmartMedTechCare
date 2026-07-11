const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const Pharmacy = require("../models/Pharmacy");
const User = require("../models/User");

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { pharmacyId, items, paymentMethod, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No order items provided",
      });
    }

    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Verify stock and price
    for (const item of items) {
      const inventory = await Inventory.findOne({
        pharmacyId,
        medicineId: item.medicineId,
      }).populate("medicineId");

      if (!inventory || inventory.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Item not available or insufficient stock in selected pharmacy.`,
        });
      }

      const itemPrice = inventory.price;
      totalAmount += itemPrice * item.quantity;

      orderItems.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
        price: itemPrice,
      });

      // Update inventory stock (simulation/real update)
      inventory.stock -= item.quantity;
      await inventory.save();
    }

    const user = await User.findById(req.user._id);

    // Initial delivery coordinates start at the pharmacy
    const order = await Order.create({
      userId: req.user._id,
      pharmacyId,
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      shippingAddress,
      deliveryLocation: {
        lat: pharmacy.location.lat,
        lng: pharmacy.location.lng,
      },
      trackingHistory: [
        {
          status: "Pending",
          message: "Order placed successfully. Waiting for store confirmation.",
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Create Order Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email defaultLocation")
      .populate("pharmacyId", "name address location contact")
      .populate("items.medicineId", "name brand image");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check ownership
    if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get Order Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("pharmacyId", "name contact")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Simulate/Get real-time tracking updates for a delivery
// @route   GET /api/orders/:id/track
// @access  Private
const trackOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "defaultLocation")
      .populate("pharmacyId", "location");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Coordinates of pharmacy and user (destination)
    const startLat = order.pharmacyId.location.lat;
    const startLng = order.pharmacyId.location.lng;
    const destLat = order.userId.defaultLocation?.lat || 28.6139;
    const destLng = order.userId.defaultLocation?.lng || 77.2090;

    // Time elapsed since order creation (in seconds)
    const secondsElapsed = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
    
    // Simulate delivery progress: fully arrived after 3 minutes (180 seconds)
    const duration = 180; 
    let progress = Math.min(secondsElapsed / duration, 1);

    // If order was cancelled, progress is 0
    if (order.status === "Cancelled") {
      progress = 0;
    } else if (order.status === "Delivered") {
      progress = 1;
    }

    // Interpolate current latitude and longitude
    const currentLat = startLat + (destLat - startLat) * progress;
    const currentLng = startLng + (destLng - startLng) * progress;

    // Update order status dynamically in DB for demo purposes
    if (progress > 0 && progress < 0.3 && order.status === "Pending") {
      order.status = "Processing";
      order.trackingHistory.push({
        status: "Processing",
        message: "Your order is being prepared and packed.",
      });
      await order.save();
    } else if (progress >= 0.3 && progress < 0.9 && (order.status === "Pending" || order.status === "Processing")) {
      order.status = "Shipped";
      order.trackingHistory.push({
        status: "Shipped",
        message: "Delivery partner is on the way to your location.",
      });
      await order.save();
    } else if (progress >= 0.9 && order.status !== "Delivered" && order.status !== "Cancelled") {
      order.status = "Delivered";
      order.paymentStatus = "Paid";
      order.trackingHistory.push({
        status: "Delivered",
        message: "Order delivered successfully. Stay healthy!",
      });
      await order.save();
    }

    // Update delivery location
    order.deliveryLocation = { lat: currentLat, lng: currentLng };
    await order.save();

    res.json({
      success: true,
      data: {
        orderId: order._id,
        status: order.status,
        progress: Math.round(progress * 100),
        deliveryLocation: order.deliveryLocation,
        destinationLocation: { lat: destLat, lng: destLng },
        pharmacyLocation: { lat: startLat, lng: startLng },
        trackingHistory: order.trackingHistory,
      },
    });
  } catch (error) {
    console.error("Track Order Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  trackOrder,
};
