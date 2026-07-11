const express = require("express");
const router = express.Router();
const {
  submitContactQuery,
  getAllContactQueries,
} = require("../controllers/contactController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/")
  .post(submitContactQuery)
  .get(protect, admin, getAllContactQueries);

module.exports = router;
