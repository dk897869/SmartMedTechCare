const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const Medicine = require("../models/Medicine");
const Pharmacy = require("../models/Pharmacy");
const User = require("../models/User");

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalMedicines = await Medicine.countDocuments({});
    const totalPharmacies = await Pharmacy.countDocuments({});
    const totalOrders = await Order.countDocuments({});

    // Calculate total revenue
    const paidOrders = await Order.find({ paymentStatus: "Paid" });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Get order status counts
    const pendingOrders = await Order.countDocuments({ status: "Pending" });
    const processingOrders = await Order.countDocuments({ status: "Processing" });
    const shippedOrders = await Order.countDocuments({ status: "Shipped" });
    const deliveredOrders = await Order.countDocuments({ status: "Delivered" });
    const cancelledOrders = await Order.countDocuments({ status: "Cancelled" });

    // Recent orders
    const recentOrders = await Order.find({})
      .populate("userId", "name email")
      .populate("pharmacyId", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        counts: {
          users: totalUsers,
          medicines: totalMedicines,
          pharmacies: totalPharmacies,
          orders: totalOrders,
          revenue: Math.round(totalRevenue * 100) / 100,
        },
        statusCounts: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update Medicine Inventory stock and price
// @route   PUT /api/admin/inventory
// @access  Private/Admin
const updateInventory = async (req, res) => {
  try {
    const { pharmacyId, medicineId, price, stock, isAvailable } = req.body;

    if (!pharmacyId || !medicineId) {
      return res.status(400).json({
        success: false,
        message: "Pharmacy ID and Medicine ID are required",
      });
    }

    let inventory = await Inventory.findOne({ pharmacyId, medicineId });

    if (inventory) {
      if (price !== undefined) inventory.price = price;
      if (stock !== undefined) inventory.stock = stock;
      if (isAvailable !== undefined) inventory.isAvailable = isAvailable;
      await inventory.save();
    } else {
      inventory = await Inventory.create({
        pharmacyId,
        medicineId,
        price,
        stock,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      });
    }

    res.json({
      success: true,
      message: "Inventory updated successfully",
      data: inventory,
    });
  } catch (error) {
    console.error("Update Inventory Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all orders in system
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("userId", "name email")
      .populate("pharmacyId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order status manually
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (status) {
      order.status = status;
      order.trackingHistory.push({
        status,
        message: `Order status manually updated to ${status} by admin.`,
      });
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    res.json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  updateInventory,
  getAllOrders,
  updateOrderStatus,
};
