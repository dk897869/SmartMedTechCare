const { analyzeSymptoms, chatWithAgent } = require("../services/aiService");

// @desc    Analyze symptoms (AI assessment)
// @route   POST /api/ai/diagnose
// @access  Public
const diagnoseSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({
        success: false,
        message: "Please provide symptoms to analyze.",
      });
    }

    console.log(`🤖 Processing symptom checker request: "${symptoms}"`);
    const analysis = await analyzeSymptoms(symptoms);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("AI Diagnosis Controller Error:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while analyzing symptoms. Please try again.",
    });
  }
};

// @desc    Interactive AI Agent Chatbot
// @route   POST /api/ai/chat
// @access  Public
const chatAssistant = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const responseText = await chatWithAgent(message, history);

    res.json({
      success: true,
      data: responseText,
    });
  } catch (error) {
    console.error("AI Chat Controller Error:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred during chat processing.",
    });
  }
};

module.exports = {
  diagnoseSymptoms,
  chatAssistant,
};
