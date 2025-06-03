import { db } from "./db";
import { designs, sizeOptions } from "@shared/schema";

async function migrate() {
  console.log("Starting migration...");
  
  try {
    // Insert sample designs
    console.log("Inserting sample designs...");
    await db.insert(designs).values([
      {
        title: "Genesis Block Prism",
        description: "Hand-etched glass featuring the first Bitcoin block hash. Each angle reveals different cryptographic patterns, creating a mesmerizing display of the genesis of digital currency.",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        category: "bitcoin"
      },
      {
        title: "Satoshi's Vision", 
        description: "Crystalline interpretation of the Bitcoin whitepaper, with LED integration for dynamic illumination. A tribute to the mysterious creator of cryptocurrency.",
        imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        category: "bitcoin"
      },
      {
        title: "Blockchain Helix",
        description: "Spiral glass structure representing the interconnected nature of blockchain technology. Each layer represents a new block in the chain.",
        imageUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        category: "bitcoin"
      }
    ]);

    // Insert size options
    console.log("Inserting size options...");
    await db.insert(sizeOptions).values([
      {
        name: "6 inch", 
        size: "6",
        price: "1.00",
        description: "Perfect for desk display"
      },
      {
        name: "12 inch",
        size: "12", 
        price: "1.00",
        description: "Ideal for shelf or table centerpiece"
      },
      {
        name: "15 inch",
        size: "15",
        price: "1.00", 
        description: "Statement piece for any room"
      }
    ]);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();