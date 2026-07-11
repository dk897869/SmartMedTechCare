const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getMyOrders,
  trackOrder,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").post(protect, createOrder);
router.route("/myorders").get(protect, getMyOrders);
router.route("/:id").get(protect, getOrderById);
router.route("/:id/track").get(protect, trackOrder);

module.exports = router;
