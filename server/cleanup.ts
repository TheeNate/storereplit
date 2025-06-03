import { db } from "./db";
import { designs, sizeOptions } from "@shared/schema";

async function cleanupAndReseed() {
  console.log("🧹 Cleaning up duplicate data...");

  try {
    // Clear existing data
    console.log("Deleting existing designs...");
    await db.delete(designs);

    console.log("Deleting existing size options...");
    await db.delete(sizeOptions);

    console.log("📦 Re-seeding clean data...");

    // Create the 3 standard size options (clean)
    const sizeOptionsData = [
      {
        name: "6 Inch Glass Art",
        size: "6",
        price: "149.99",
        description: "Perfect for desk or shelf display. Compact and elegant.",
        stripeProductId: null,
        stripePriceId: null,
      },
      {
        name: "12 Inch Glass Art",
        size: "12",
        price: "299.99",
        description: "Medium size, great for wall mounting or display cases.",
        stripeProductId: null,
        stripePriceId: null,
      },
      {
        name: "15 Inch Glass Art",
        size: "15",
        price: "449.99",
        description:
          "Large statement piece, perfect for living rooms or offices.",
        stripeProductId: null,
        stripePriceId: null,
      },
    ];

    await db.insert(sizeOptions).values(sizeOptionsData);
    console.log("✅ Size options created (3 total)");

    // Create sample designs (clean)
    const designsData = [
      {
        title: "Genesis Block",
        description:
          "The first Bitcoin block ever mined, etched in elegant glass with the original hash and timestamp.",
        imageUrl:
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        category: "bitcoin",
      },
      {
        title: "Satoshi's Vision",
        description:
          "Abstract representation of the Bitcoin whitepaper's key concepts in flowing glass art.",
        imageUrl:
          "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        category: "bitcoin",
      },
      {
        title: "Digital Gold",
        description:
          "Bitcoin symbol merged with traditional gold patterns, representing the new digital store of value.",
        imageUrl:
          "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        category: "bitcoin",
      },
      {
        title: "Blockchain Network",
        description:
          "Interconnected nodes representing the decentralized nature of blockchain technology.",
        imageUrl:
          "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        category: "blockchain",
      },
      {
        title: "Cypherpunk Manifesto",
        description:
          "Typography art featuring key quotes from the cypherpunk movement that birthed Bitcoin.",
        imageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        category: "cypherpunk",
      },
    ];

    await db.insert(designs).values(designsData);
    console.log("✅ Sample designs created (5 total)");

    console.log("🎉 Cleanup completed successfully!");
    console.log("");
    console.log("📋 Next steps:");
    console.log("1. Go to admin panel → Size Options tab");
    console.log("2. Add your Stripe Product/Price IDs to the 3 size options");
    console.log("3. Test the order process again");
    console.log("");
    console.log("Expected IDs after cleanup:");
    console.log("- Size Option 1: 6 Inch ($149.99)");
    console.log("- Size Option 2: 12 Inch ($299.99)");
    console.log("- Size Option 3: 15 Inch ($449.99)");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    throw error;
  }
}

// Run cleanup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupAndReseed()
    .then(() => {
      console.log("Cleanup completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Cleanup failed:", error);
      process.exit(1);
    });
}

export { cleanupAndReseed };
