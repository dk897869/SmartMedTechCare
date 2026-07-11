const express = require("express");
const router = express.Router();
const {
  searchMedicines,
  getMedicineDetails,
  comparePrices,
} = require("../controllers/medicineController");

router.get("/", searchMedicines);
router.get("/:id", getMedicineDetails);
router.get("/:id/compare", comparePrices);

module.exports = router;
