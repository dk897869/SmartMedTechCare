const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config(); // CWD .env
dotenv.config({ path: path.join(__dirname, "..", ".env") }); // backend/.env
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") }); // root/.env

const { GoogleGenAI } = require("@google/genai");

const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

async function listModels() {
  try {
    console.log("Listing models...");
    const res = await ai.models.list();
    console.log("Raw Response Keys:", Object.keys(res));
    if (res.models) {
      console.log("Models list length:", res.models.length);
      for (const m of res.models) {
        console.log("- Name:", m.name);
      }
    } else {
      console.log("Raw Response:", res);
    }
  } catch (err) {
    console.error("❌ Failed to list models:", err.message);
  }
}

listModels();
