const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config(); // CWD .env
dotenv.config({ path: path.join(__dirname, "..", ".env") }); // backend/.env
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") }); // root/.env

console.log("OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);

const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function test() {
  try {
    console.log("Calling OpenAI completions...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello! Say hi." }
      ]
    });
    console.log("Success! Response:", response.choices[0].message.content);
  } catch (err) {
    console.error("❌ OpenAI call failed:", err.message);
  }
}

test();
