const Pharmacy = require("../models/Pharmacy");
const Medicine = require("../models/Medicine");
const Inventory = require("../models/Inventory");
const User = require("../models/User");

const seedDatabase = async () => {
  try {
    // Check if pharmacies already exist
    const pharmacyCount = await Pharmacy.countDocuments({});
    if (pharmacyCount > 0) {
      console.log("ℹ️ Database already seeded. Skipping initial seeding.");
      return;
    }

    console.log("🌱 Database is empty. Starting database seeding...");

    // Create Admin User
    const adminExists = await User.findOne({ email: "admin@smartmed.com" });
    if (!adminExists) {
      await User.create({
        name: "Dr. Admin",
        email: "admin@smartmed.com",
        password: "adminpassword123",
        role: "admin",
        defaultLocation: {
          lat: 28.6139,
          lng: 77.2090,
          address: "SmartMedTechCare Command Center, CP, New Delhi"
        }
      });
      console.log("👤 Default Admin account created: admin@smartmed.com / adminpassword123");
    }

    // Create Pharmacies
    const pharmacies = await Pharmacy.create([
      {
        name: "Care & Cure Pharmacy",
        address: "12 Block H, Connaught Place, New Delhi",
        location: { lat: 28.6159, lng: 77.2070 },
        contact: "+91 98765 43210",
        rating: 4.8,
      },
      {
        name: "Apollo MedZone CP",
        address: "45 Barakhamba Road, New Delhi",
        location: { lat: 28.6259, lng: 77.2180 },
        contact: "+91 99999 88888",
        rating: 4.6,
      },
      {
        name: "Wellness Forever Pharmacy",
        address: "8 Chanakyapuri, New Delhi",
        location: { lat: 28.6059, lng: 77.1950 },
        contact: "+91 96666 55555",
        rating: 4.4,
      },
    ]);
    console.log(`🏥 Created ${pharmacies.length} pharmacies.`);

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
        image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400",
      },
    ]);
    console.log(`💊 Created ${medicines.length} medicines.`);

    // Create Inventories with price and stock variation
    const inventories = [];

    // Care & Cure Pharmacy prices (mostly moderate)
    inventories.push(
      { pharmacyId: pharmacies[0]._id, medicineId: medicines[0]._id, price: 12.5, stock: 120 },
      { pharmacyId: pharmacies[0]._id, medicineId: medicines[1]._id, price: 45.0, stock: 80 },
      { pharmacyId: pharmacies[0]._id, medicineId: medicines[2]._id, price: 18.0, stock: 150 },
      { pharmacyId: pharmacies[0]._id, medicineId: medicines[3]._id, price: 9.9, stock: 200 },
      { pharmacyId: pharmacies[0]._id, medicineId: medicines[4]._id, price: 95.0, stock: 40 }
    );

    // Apollo MedZone prices (slightly higher but premium stock)
    inventories.push(
      { pharmacyId: pharmacies[1]._id, medicineId: medicines[0]._id, price: 14.0, stock: 95 },
      { pharmacyId: pharmacies[1]._id, medicineId: medicines[1]._id, price: 48.5, stock: 100 },
      { pharmacyId: pharmacies[1]._id, medicineId: medicines[2]._id, price: 19.5, stock: 110 },
      { pharmacyId: pharmacies[1]._id, medicineId: medicines[3]._id, price: 11.2, stock: 85 },
      { pharmacyId: pharmacies[1]._id, medicineId: medicines[4]._id, price: 99.0, stock: 65 }
    );

    // Wellness Forever prices (cheaper, higher stock)
    inventories.push(
      { pharmacyId: pharmacies[2]._id, medicineId: medicines[0]._id, price: 11.8, stock: 250 },
      { pharmacyId: pharmacies[2]._id, medicineId: medicines[1]._id, price: 42.0, stock: 180 },
      { pharmacyId: pharmacies[2]._id, medicineId: medicines[2]._id, price: 16.5, stock: 300 },
      { pharmacyId: pharmacies[2]._id, medicineId: medicines[3]._id, price: 8.5, stock: 400 },
      { pharmacyId: pharmacies[2]._id, medicineId: medicines[4]._id, price: 92.5, stock: 20 }
    );

    await Inventory.insertMany(inventories);
    console.log(`📦 Created ${inventories.length} inventory listings across pharmacies.`);
    console.log("🌱 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding Database Error:", error.message);
  }
};

module.exports = {
  seedDatabase,
};
