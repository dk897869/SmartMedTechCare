const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  updateInventory,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");

router.use(protect);
router.use(admin);

router.get("/stats", getDashboardStats);
router.put("/inventory", updateInventory);
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);

module.exports = router;
