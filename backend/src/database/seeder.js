const Pharmacy = require("../models/Pharmacy");
const Medicine = require("../models/Medicine");
const Inventory = require("../models/Inventory");
const User = require("../models/User");

const seedDatabase = async () => {
  try {
    // Drop existing collections to ensure fresh seeds matching the UI image are loaded
    await Pharmacy.deleteMany({});
    await Medicine.deleteMany({});
    await Inventory.deleteMany({});
    
    console.log("🌱 Dropped old collections. Starting image-aligned seeding...");

    // Create Admin User if not exists
    const adminExists = await User.findOne({ email: "admin@smartmed.com" });
    if (!adminExists) {
      await User.create({
        name: "Dr. Admin",
        email: "admin@smartmed.com",
        password: "adminpassword123",
        role: "admin",
        isVerified: true,
        defaultLocation: {
          lat: 30.7000,
          lng: 76.6918,
          address: "Sector 70, Mohali, Punjab 160071"
        }
      });
      console.log("👤 Default Admin account created: admin@smartmed.com / adminpassword123");
    }

    // Create Pharmacies matching the image listings exactly
    const pharmacies = await Pharmacy.create([
      {
        name: "Apollo Pharmacy",
        address: "Sector 70, Mohali, Punjab 160071",
        location: { lat: 30.7020, lng: 76.6940 }, // ~0.4 km away
        contact: "+91 98765 43210",
        rating: 4.8,
      },
      {
        name: "MedPlus Pharmacy",
        address: "Sector 71, Mohali, Punjab 160071",
        location: { lat: 30.7090, lng: 76.6830 }, // ~1.2 km away
        contact: "+91 95555 44444",
        rating: 4.6,
      },
      {
        name: "Wellness Forever",
        address: "Phase 8, Mohali, Punjab 160071",
        location: { lat: 30.6860, lng: 76.7030 }, // ~2.1 km away
        contact: "+91 96666 55555",
        rating: 4.5,
      },
      {
        name: "Netmeds Pharmacy",
        address: "Sector 66, Mohali, Punjab 160062",
        location: { lat: 30.6800, lng: 76.6800 }, // ~2.8 km away
        contact: "+91 94444 33333",
        rating: 4.4,
      },
      {
        name: "Care & Cure Pharmacy (CP)",
        address: "12 Block H, Connaught Place, New Delhi",
        location: { lat: 28.6159, lng: 77.2070 },
        contact: "+91 98765 43210",
        rating: 4.8,
      }
    ]);
    console.log(`🏥 Seeded ${pharmacies.length} pharmacies matching image.`);

    // Create Medicines
    const medicines = await Medicine.create([
      {
        name: "Crocin Advance (Paracetamol)",
        brand: "GSK",
        category: "Pain Reliever",
        description: "Crocin Advance contains paracetamol which is an analgesic (painkiller) and antipyretic (helps to reduce body temperature when you have a fever).",
        activeIngredients: ["Acetaminophen", "Paracetamol"],
        sideEffects: ["Nausea", "Allergic skin rash", "Liver dysfunction (on excessive dose)"],
        dosageGuidance: "1 to 2 tablets (500mg - 1000mg) every 4 to 6 hours as needed. Do not exceed 4000mg in 24 hours.",
        requiresPrescription: false,
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
      },
      {
        name: "Prilosec (Omeprazole)",
        brand: "AstraZeneca",
        category: "Antacid",
        description: "Prilosec is a proton pump inhibitor (PPI) that decreases the amount of acid produced in the stomach, treating heartburn and acid reflux.",
        activeIngredients: ["Omeprazole"],
        sideEffects: ["Headache", "Abdominal pain", "Nausea", "Diarrhea"],
        dosageGuidance: "20mg capsule once daily in the morning, 30 minutes before breakfast.",
        requiresPrescription: false,
        image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400",
      },
      {
        name: "Cetirizine Hydrochloride",
        brand: "Zyrtec",
        category: "Allergy",
        description: "Cetirizine is an antihistamine medicine that helps relieve allergy symptoms such as runny nose, sneezing, itchy/watery eyes, and throat irritation.",
        activeIngredients: ["Cetirizine Hydrochloride"],
        sideEffects: ["Drowsiness", "Dry mouth", "Fatigue", "Headache"],
        dosageGuidance: "10mg tablet once daily, preferably in the evening since it may cause drowsiness.",
        requiresPrescription: false,
        image: "https://images.unsplash.com/photo-1607619275048-24722480f875?w=400",
      },
      {
        name: "Aspirin Pain Relief",
        brand: "Bayer",
        category: "Pain Reliever",
        description: "Aspirin is a nonsteroidal anti-inflammatory drug (NSAID) used to reduce pain, fever, or inflammation, and as an antiplatelet.",
        activeIngredients: ["Acetylsalicylic Acid"],
        sideEffects: ["Heartburn", "Stomach irritation", "Easy bruising or bleeding"],
        dosageGuidance: "325mg tablet every 4 hours with food and water. Consult physician for daily antiplatelet therapy.",
        requiresPrescription: false,
        image: "https://images.unsplash.com/photo-1628771065518-0d82f15e8562?w=400",
      },
      {
        name: "Amoxicillin Capsules",
        brand: "Mox",
        category: "Antibiotics",
        description: "Amoxicillin is a penicillin-type antibiotic used to treat a wide variety of bacterial infections. Requires prescription validation.",
        activeIngredients: ["Amoxicillin Trihydrate"],
        sideEffects: ["Diarrhea", "Nausea", "Skin rash", "Yeast infection"],
        dosageGuidance: "500mg capsule every 8 hours or 875mg capsule every 12 hours. Complete the full course of treatment.",
        requiresPrescription: true,
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
      },
    ]);
    console.log(`💊 Seeded ${medicines.length} medicines.`);

    // Seed inventories across pharmacies
    const inventories = [];

    // Loop through each pharmacy and insert stock for all medicines
    for (let ph of pharmacies) {
      inventories.push(
        { pharmacyId: ph._id, medicineId: medicines[0]._id, price: 12.5, stock: 120 },
        { pharmacyId: ph._id, medicineId: medicines[1]._id, price: 45.0, stock: 80 },
        { pharmacyId: ph._id, medicineId: medicines[2]._id, price: 18.0, stock: 150 },
        { pharmacyId: ph._id, medicineId: medicines[3]._id, price: 9.9, stock: 200 },
        { pharmacyId: ph._id, medicineId: medicines[4]._id, price: 95.0, stock: 40 }
      );
    }

    await Inventory.insertMany(inventories);
    console.log(`📦 Seeded ${inventories.length} inventories.`);
    console.log("🌱 Image-aligned seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding Database Error:", error.message);
  }
};

module.exports = {
  seedDatabase,
};
