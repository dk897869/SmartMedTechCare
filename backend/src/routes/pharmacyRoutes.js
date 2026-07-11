const express = require("express");
const router = express.Router();
const {
  getNearbyPharmacies,
  getPharmacyDetails,
} = require("../controllers/pharmacyController");

router.get("/nearby", getNearbyPharmacies);
router.get("/:id", getPharmacyDetails);

module.exports = router;
