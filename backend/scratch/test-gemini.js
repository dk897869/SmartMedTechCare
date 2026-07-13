const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config(); // CWD .env
dotenv.config({ path: path.join(__dirname, "..", ".env") }); // backend/.env
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") }); // root/.env

console.log("GOOGLE_API_KEY present:", !!process.env.GOOGLE_API_KEY);

const { GoogleGenAI } = require("@google/genai");

const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

async function test() {
  try {
    console.log("Calling Gemini completions (gemini-2.0-flash)...");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hello! Say hi."
    });
    console.log("Success! Response:", response.text);
  } catch (err) {
    console.error("❌ Gemini call failed:", err.message);
  }
}

test();
