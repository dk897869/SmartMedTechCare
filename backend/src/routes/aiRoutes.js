const express = require("express");
const router = express.Router();
const { diagnoseSymptoms } = require("../controllers/aiController");

router.post("/diagnose", diagnoseSymptoms);

module.exports = router;
