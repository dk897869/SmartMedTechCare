const express = require("express");
const router = express.Router();
const { diagnoseSymptoms, chatAssistant } = require("../controllers/aiController");

router.post("/diagnose", diagnoseSymptoms);
router.post("/chat", chatAssistant);

module.exports = router;
