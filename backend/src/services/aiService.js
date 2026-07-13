const { OpenAI } = require("openai");
const { GoogleGenAI } = require("@google/genai");

// Initialize OpenAI Client
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("🤖 OpenAI client initialized successfully.");
  } catch (err) {
    console.error("❌ Failed to initialize OpenAI client: ", err.message);
  }
}

// Initialize Gemini Client
let gemini = null;
const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (geminiApiKey) {
  try {
    gemini = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log("🤖 Gemini SDK initialized successfully.");
  } catch (err) {
    console.error("❌ Failed to initialize Gemini SDK: ", err.message);
  }
}

// Comprehensive static diagnostic data for Offline/Mock mode conforming to new JSON format
const offlineMedicalKnowledge = [
  {
    keywords: ["chest pain", "breath", "shortness of breath", "tightness", "left arm", "sweat"],
    response: {
      possibleConditions: [
        {
          name: "Angina / Suspected Myocardial Infarction (Heart Attack)",
          confidence: 90,
          reason: "Chest pain or pressure, especially spreading to the arm or accompanied by breathing difficulties, can indicate a lack of blood flow to the heart."
        }
      ],
      severity: "Emergency",
      requiresDoctor: true,
      requiresEmergencyCare: true,
      redFlags: ["Chest Pain", "Shortness of Breath", "Radiating Pain"],
      recommendedOTCMedicines: [
        {
          name: "Aspirin",
          purpose: "Improve blood flow during a cardiac event",
          dosage: "325mg (chewed immediately if advised by emergency services)",
          duration: "Single dose",
          warnings: "Do not take if allergic or if bleeding disorders are present."
        }
      ],
      homeCare: ["Rest quietly", "Loosen tight clothing", "Seek immediate emergency help"],
      followUpQuestions: ["Is the pain radiating to your jaw, neck, or left arm?", "Are you sweating heavily?"],
      medicalAdvice: "🚨 CRITICAL WARNING: These symptoms suggest a potential cardiac emergency. Please call emergency services or visit the nearest emergency room immediately. Do not drive yourself.",
      disclaimer: "This assessment is informational only and is not a substitute for professional medical advice."
    }
  },
  {
    keywords: ["fever", "cough", "sore throat", "runny nose", "cold", "congestion"],
    response: {
      possibleConditions: [
        {
          name: "Common Cold / Viral Upper Respiratory Infection",
          confidence: 85,
          reason: "Mild fever combined with a dry or productive cough and nasal congestion is highly indicative of a viral cold."
        },
        {
          name: "Influenza (Flu)",
          confidence: 60,
          reason: "Sudden onset of high fever, muscle aches, sore throat, and severe fatigue suggests the influenza virus."
        }
      ],
      severity: "Low",
      requiresDoctor: false,
      requiresEmergencyCare: false,
      redFlags: [],
      recommendedOTCMedicines: [
        {
          name: "Paracetamol (Acetaminophen)",
          purpose: "Reduce fever and ease body aches",
          dosage: "500mg-650mg every 4-6 hours (Max 4g/day)",
          duration: "3-5 days",
          warnings: "Do not exceed maximum daily limit to prevent liver damage. Avoid other paracetamol-containing products."
        },
        {
          name: "Dextromethorphan",
          purpose: "Suppress dry cough",
          dosage: "10-20mg every 4 hours or 30mg every 6-8 hours",
          duration: "3-5 days",
          warnings: "Do not use if taking MAOIs or if cough is productive with excess phlegm."
        }
      ],
      homeCare: ["Drink plenty of fluids", "Rest in a comfortable room", "Use a cool-mist humidifier"],
      followUpQuestions: ["Is your cough dry or productive?", "How long have you had this fever?"],
      medicalAdvice: "Rest and maintain hydration. Visit a doctor if fever persists more than 3 days, exceeds 103°F (39.4°C), or if you develop chest tightness.",
      disclaimer: "This assessment is informational only and is not a substitute for professional medical advice."
    }
  },
  {
    keywords: ["headache", "migraine", "temple", "throbbing", "stress"],
    response: {
      possibleConditions: [
        {
          name: "Tension Headache",
          confidence: 80,
          reason: "A dull, aching pain or band-like tightness around the forehead, commonly triggered by stress or muscle strain."
        },
        {
          name: "Migraine",
          confidence: 50,
          reason: "Unilateral, throbbing headache, often accompanied by sensitivity to light/sound or nausea."
        }
      ],
      severity: "Low",
      requiresDoctor: false,
      requiresEmergencyCare: false,
      redFlags: [],
      recommendedOTCMedicines: [
        {
          name: "Ibuprofen",
          purpose: "Relieve tension headache pain",
          dosage: "400mg with food",
          duration: "As needed, max 3 consecutive days",
          warnings: "Take with food to prevent stomach irritation. Avoid if history of ulcers."
        }
      ],
      homeCare: ["Rest in a quiet, dark room", "Apply a cool compress to the forehead", "Maintain screen-time boundaries"],
      followUpQuestions: ["Is the pain throbbing or steady?", "Are you sensitive to light or sound?"],
      medicalAdvice: "Monitor symptoms. Seek emergency care if this is the 'worst headache of your life' or is accompanied by fever, stiff neck, or confusion.",
      disclaimer: "This assessment is informational only and is not a substitute for professional medical advice."
    }
  },
  {
    keywords: ["stomach", "ache", "acid", "heartburn", "diarrhea", "cramp", "indigestion", "nausea", "dard", "pet"],
    response: {
      possibleConditions: [
        {
          name: "Gastroenteritis (Stomach Flu) / Indigestion",
          confidence: 75,
          reason: "Abdominal cramping, acidity, or general stomach pain is often caused by indigestion, acidity, or mild gastrointestinal irritation."
        }
      ],
      severity: "Medium",
      requiresDoctor: true,
      requiresEmergencyCare: false,
      redFlags: [],
      recommendedOTCMedicines: [
        {
          name: "Antacid Tablets (Calcium Carbonate)",
          purpose: "Neutralize stomach acid and relieve heartburn",
          dosage: "2 tablets chewed as symptoms occur",
          duration: "As needed",
          warnings: "Do not exceed product label warnings. Consult doctor if symptoms persist."
        }
      ],
      homeCare: ["Sip fluids in small amounts", "Eat bland foods like crackers or toast", "Avoid dairy, caffeine, and spicy dishes"],
      followUpQuestions: ["Where exactly is the pain located?", "How severe is the pain?", "Did you vomit or run a fever?"],
      medicalAdvice: "Consult a doctor if abdominal pain becomes severe, localized (such as lower right quadrant), or is accompanied by blood in stool, high fever, or persistent vomiting.",
      disclaimer: "This assessment is informational only and is not a substitute for professional medical advice."
    }
  }
];

const analyzeSymptoms = async (symptomText) => {
  const query = symptomText.toLowerCase();

  // 1. Try OpenAI for dynamic diagnosis
  if (openai) {
    try {
      console.log(`🤖 Requesting OpenAI for symptom analysis: "${symptomText}"`);
      const prompt = `
        You are "SmartMed AI", the official AI Healthcare Assistant for SmartMedTechCare. Act as an intelligent medical assistant.
        Analyze user symptoms carefully: "${symptomText}".
        
        You are NOT a licensed doctor. Never present responses as a confirmed diagnosis. Always state that this assessment is informational only.
        
        Respond with a JSON object matching this schema exactly:
        {
          "possibleConditions": [
            {
              "name": "Condition Name",
              "confidence": 75, // integer percentage confidence (0-100)
              "reason": "Brief explanation why symptoms suggest this condition"
            }
          ],
          "severity": "Low" | "Medium" | "High" | "Emergency",
          "requiresDoctor": boolean,
          "requiresEmergencyCare": boolean,
          "redFlags": ["any emergency red flag indicators present"],
          "recommendedOTCMedicines": [
            {
              "name": "OTC medicine name",
              "purpose": "What this medicine helps with (e.g. reduce fever)",
              "dosage": "Suggested dosage details",
              "duration": "Suggested duration",
              "warnings": "Contraindications or label warnings"
            }
          ],
          "homeCare": ["step 1 for self care", "step 2..."],
          "followUpQuestions": ["question 1 to clarify duration/severity if needed"],
          "medicalAdvice": "General next steps guidance",
          "disclaimer": "This assessment is informational only and is not a substitute for professional medical advice."
        }
        
        MEDICINE RULES:
        - Suggest ONLY appropriate OTC medicines when suitable.
        - Never recommend prescription medicines, antibiotics, steroids, or narcotics.
        - If symptoms are incomplete, list follow-up clarifying questions.
        - Immediately set requiresEmergencyCare to true if red flags like chest pain or difficulty breathing are present.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional medical assistant AI. Analyze user symptoms and return response in strict JSON format." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const responseText = response.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (err) {
      console.error("🤖 OpenAI symptom analysis failed: ", err.message);
    }
  }

  // 2. Try Gemini for dynamic diagnosis
  if (gemini) {
    try {
      console.log(`🤖 Requesting Gemini for symptom analysis: "${symptomText}"`);
      const prompt = `
        You are "SmartMed AI", the official AI Healthcare Assistant for SmartMedTechCare. Act as an intelligent medical assistant.
        Analyze user symptoms carefully: "${symptomText}".
        
        Respond with a JSON object matching this schema exactly, and do NOT include markdown wraps other than the JSON itself.
        
        Schema:
        {
          "possibleConditions": [
            {
              "name": "Condition Name",
              "confidence": 75,
              "reason": "Explanation why symptoms suggest this condition"
            }
          ],
          "severity": "Low" | "Medium" | "High" | "Emergency",
          "requiresDoctor": boolean,
          "requiresEmergencyCare": boolean,
          "redFlags": ["red flags present"],
          "recommendedOTCMedicines": [
            {
              "name": "OTC medicine name",
              "purpose": "Purpose",
              "dosage": "Dosage details",
              "duration": "Duration",
              "warnings": "Contraindications"
            }
          ],
          "homeCare": ["self care step"],
          "followUpQuestions": ["clarifying question"],
          "medicalAdvice": "Guidance details",
          "disclaimer": "This assessment is informational only and is not a substitute for professional medical advice."
        }
      `;

      const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || response.candidates[0].content.parts[0].text;
      return JSON.parse(responseText);
    } catch (err) {
      console.error("🤖 Gemini symptom analysis failed: ", err.message);
    }
  }

  // 3. Fallback to Local Knowledge Base
  console.log("🔌 Running diagnostic analysis in offline mock database...");
  for (const knowledge of offlineMedicalKnowledge) {
    const isMatch = knowledge.keywords.some((keyword) => query.includes(keyword));
    if (isMatch) {
      return knowledge.response;
    }
  }

  // Default general response if no match
  return {
    possibleConditions: [
      {
        name: "General Malady / Mild Seasonal Infection",
        confidence: 65,
        reason: "Based on your description, you may be experiencing a mild seasonal or environmental reaction. Rest and hydration are advised."
      }
    ],
    severity: "Low",
    requiresDoctor: false,
    requiresEmergencyCare: false,
    redFlags: [],
    recommendedOTCMedicines: [
      {
        name: "Paracetamol",
        purpose: "Pain relief and fever reduction",
        dosage: "500mg every 6 hours as needed",
        duration: "2-3 days",
        warnings: "Do not exceed maximum daily limit."
      }
    ],
    homeCare: ["Stay hydrated by drinking water or clear broths", "Get ample sleep and rest"],
    followUpQuestions: ["How long have you had these symptoms?", "Do you have any other symptoms like fever or congestion?"],
    medicalAdvice: "Monitor your symptoms closely. If they worsen or if you develop breathing difficulties, consult a healthcare provider.",
    disclaimer: "This assessment is informational only and is not a substitute for professional medical advice."
  };
};

const chatWithAgent = async (messageText, chatHistory) => {
  const query = messageText.toLowerCase();

  // 1. Try OpenAI for Agent Chat
  if (openai) {
    try {
      console.log(`🤖 Requesting OpenAI for AI Agent Chat: "${messageText}"`);
      const messages = [
        {
          role: "system",
          content: `You are "SmartMed AI", the official AI Healthcare Assistant of SmartMedTechCare. Act as an intelligent AI Agent.

Responsibilities:
- Helping users navigate the application (pages: Home, Symptom Checker, Compare Medicines, Nearby Stores, Shopping Cart, Checkout, Order Tracking, User Profile, Admin Dashboard).
- Manage medicines, search catalog, compare prices.
- Manage shopping carts (add, update, clear, view items).
- Assist with order status.
- Book doctor consultations.
- Explain medicines and symptoms.

Response Schema (Strict JSON format required):
{
  "reply": "Friendly, professional text response explaining the action or answering conversationally. (Mandatory)",
  "action": "navigate" | "search_medicine" | "compare_prices" | "nearby_pharmacy" | "add_to_cart" | "remove_from_cart" | "clear_cart" | "view_cart" | "checkout" | "track_order" | "book_doctor" | "upload_prescription" | "symptom_analysis" | "contact_support" | null,
  "page": "medicines" | "symptoms" | "pharmacies" | "cart" | "profile" | "orders" | "checkout" | "admin" | null,
  "medicine": "medicine name string if applicable" | null,
  "quantity": number representing cart quantities | null,
  "symptoms": ["array", "of", "symptoms"] | null
}

Always prefer returning an action whenever the user requests something that changes data or navigates the application. If no action is needed, set action to null.`
        }
      ];

      // Add history
      if (chatHistory && chatHistory.length > 0) {
        const recentHistory = chatHistory.slice(-8);
        for (const msg of recentHistory) {
          messages.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        }
      }

      messages.push({ role: "user", content: messageText });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" }
      });

      const responseText = response.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (err) {
      console.warn("⚠️ OpenAI Agent Chat failed (possibly rate limited/quota exceeded):", err.message);
    }
  }

  // 2. Try Gemini for Agent Chat
  if (gemini) {
    try {
      console.log(`🤖 Requesting Gemini for AI Agent Chat: "${messageText}"`);
      const prompt = `
        You are "SmartMed AI", the official AI Healthcare Assistant of SmartMedTechCare. Act as an intelligent AI Agent.
        Analyze user message: "${messageText}".
        
        Respond with a JSON object matching this schema exactly, and do NOT include markdown wraps other than the JSON itself.
        
        Schema:
        {
          "reply": "Friendly response text",
          "action": "navigate" | "search_medicine" | "compare_prices" | "nearby_pharmacy" | "add_to_cart" | "remove_from_cart" | "clear_cart" | "view_cart" | "checkout" | "track_order" | "book_doctor" | "upload_prescription" | "symptom_analysis" | "contact_support" | null,
          "page": "medicines" | "symptoms" | "pharmacies" | "cart" | "profile" | "orders" | "checkout" | "admin" | null,
          "medicine": "medicine name" | null,
          "quantity": number | null,
          "symptoms": ["array", "of", "symptoms"] | null
        }
      `;

      const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || response.candidates[0].content.parts[0].text;
      return JSON.parse(responseText);
    } catch (err) {
      console.warn("⚠️ Gemini Agent Chat failed (possibly rate limited/quota exceeded):", err.message);
    }
  }

  // 3. Smart local NLP Agent Processor
  console.log("🔌 Running agent chat in local fallback processor...");

  // Navigation commands
  if (query.includes("navigate") || query.includes("go to") || query.includes("show me") || query.includes("take me to") || query.includes("open")) {
    if (query.includes("medicine") || query.includes("compare") || query.includes("catalog")) {
      return {
        reply: "Sure! I am redirecting you to our Compare Medicines catalog page.",
        action: "navigate",
        page: "medicines"
      };
    }
    if (query.includes("symptom") || query.includes("diagnose") || query.includes("checker")) {
      return {
        reply: "Sure! I am redirecting you to our AI Symptom Checker tool.",
        action: "navigate",
        page: "symptoms"
      };
    }
    if (query.includes("store") || query.includes("pharmacy") || query.includes("map") || query.includes("nearby")) {
      return {
        reply: "Understood! Redirecting you to our Nearby Stores map now.",
        action: "navigate",
        page: "pharmacies"
      };
    }
    if (query.includes("cart") || query.includes("basket")) {
      return {
        reply: "Redirecting you to your Shopping Cart to review items.",
        action: "navigate",
        page: "cart"
      };
    }
    if (query.includes("profile") || query.includes("password") || query.includes("photo")) {
      return {
        reply: "Sure! I will open your Medical Profile settings page.",
        action: "navigate",
        page: "profile"
      };
    }
    if (query.includes("order") || query.includes("track") || query.includes("history")) {
      return {
        reply: "Redirecting you to your Order History and live tracking.",
        action: "navigate",
        page: "orders"
      };
    }
    if (query.includes("checkout") || query.includes("pay")) {
      return {
        reply: "Taking you to the secure checkout page.",
        action: "navigate",
        page: "checkout"
      };
    }
    if (query.includes("admin") || query.includes("dashboard")) {
      return {
        reply: "Opening the Admin Panel management console.",
        action: "navigate",
        page: "admin"
      };
    }
  }

  // Clear Cart command
  if (query.includes("clear") && (query.includes("cart") || query.includes("basket") || query.includes("item"))) {
    return {
      reply: "Sure, I have programmatically emptied your shopping cart for you!",
      action: "clear_cart"
    };
  }

  // Show Cart command
  if (query.includes("show my cart") || query.includes("view my cart") || query.includes("view cart") || query.includes("show cart")) {
    return {
      reply: "Here is your shopping cart.",
      action: "view_cart"
    };
  }

  // Checkout command
  if (query.includes("checkout") || query.includes("check out")) {
    return {
      reply: "Redirecting you to the secure checkout panel.",
      action: "checkout"
    };
  }

  // Track Order command
  if (query.includes("track") && (query.includes("order") || query.includes("delivery"))) {
    return {
      reply: "Opening your Order History so you can select and track your delivery live.",
      action: "track_order"
    };
  }

  // Book Doctor command
  if (query.includes("book") || query.includes("doctor") || query.includes("appointment")) {
    return {
      reply: "Book a consultation with our premium medical doctors.",
      action: "book_doctor"
    };
  }

  // Upload Prescription command
  if (query.includes("upload") || query.includes("prescription")) {
    return {
      reply: "Please select and upload your medical prescription.",
      action: "upload_prescription"
    };
  }

  // Logout command
  if (query.includes("log out") || query.includes("logout") || query.includes("sign out")) {
    return {
      reply: "Logging you out of your current session. Please wait.",
      action: "logout"
    };
  }

  // Guide / Training command
  if (query.includes("guide") || query.includes("training") || query.includes("tutorial") || query.includes("help") || query.includes("how to use") || query.includes("guidelines")) {
    return {
      reply: "I would be happy to guide you! Here is the interactive training guide for SmartMedTechCare.",
      action: "show_training"
    };
  }

  // Add/Remove/Update Cart command
  if (query.includes("add") || query.includes("remove") || query.includes("update") || query.includes("put") || query.includes("buy") || query.includes("cart")) {
    let medName = "";
    if (query.includes("crocin")) medName = "Crocin";
    else if (query.includes("dolo")) medName = "Dolo";
    else if (query.includes("vicks") || query.includes("syrup")) medName = "Vicks";
    else if (query.includes("paracetamol") || query.includes("acetaminophen")) medName = "Paracetamol";
    else if (query.includes("vitamin") || query.includes("multivitamin")) medName = "Multivitamins";

    if (medName) {
      const qtyMatch = query.match(/\d+/);
      const qty = qtyMatch ? parseInt(qtyMatch[0]) : 1;

      if (query.includes("remove") || query.includes("delete")) {
        return {
          reply: `Removing ${medName} from your shopping cart.`,
          action: "remove_from_cart",
          medicine: medName
        };
      } else if (query.includes("update") || query.includes("increase") || query.includes("decrease") || query.includes("change")) {
        return {
          reply: `Updating ${medName} quantity to ${qty} in your cart.`,
          action: "update_cart",
          medicine: medName,
          quantity: qty
        };
      } else {
        return {
          reply: `Understood! I am adding ${qty}x ${medName} to your shopping cart now.`,
          action: "add_to_cart",
          medicine: medName,
          quantity: qty
        };
      }
    }
  }

  // Symptom Analysis command
  if (query.includes("fever") || query.includes("headache") || query.includes("cough") || query.includes("pain") || query.includes("cold")) {
    const list = [];
    if (query.includes("fever")) list.push("fever");
    if (query.includes("headache")) list.push("headache");
    if (query.includes("cough")) list.push("cough");
    if (query.includes("pain")) list.push("pain");
    if (query.includes("cold")) list.push("cold");

    return {
      reply: `Analyzing symptoms for: ${list.join(", ")}. Redirecting you to the AI Symptom Checker.`,
      action: "symptom_analysis",
      symptoms: list
    };
  }

  // General questions fallback
  return {
    reply: "Hello! I am your SmartMed AI Assistant. I can navigate the site, clear your cart, add medicines (e.g. 'Add 2 Crocin to cart'), or display our system user guide. Try asking me: 'Show me the stores', 'Navigate to compare medicines', or 'Clear my cart'!",
    action: null
  };
};

module.exports = {
  analyzeSymptoms,
  chatWithAgent,
};
