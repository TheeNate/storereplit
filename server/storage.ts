import { users, products, orders, type User, type InsertUser, type Product, type InsertProduct, type Order, type InsertOrder } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private currentUserId: number;
  private currentProductId: number;
  private currentOrderId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentOrderId = 1;
    
    // Initialize with some sample products
    this.initializeSampleProducts();
  }

  private initializeSampleProducts() {
    const sampleProducts: Omit<Product, 'id'>[] = [
      {
        title: "Genesis Block Prism",
        description: "Hand-etched glass featuring the first Bitcoin block hash. Each angle reveals different cryptographic patterns, creating a mesmerizing display of the genesis of digital currency.",
        price: "1.00",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        createdAt: new Date(),
      },
      {
        title: "Satoshi's Vision",
        description: "Crystalline interpretation of the Bitcoin whitepaper, with LED integration for dynamic illumination. A tribute to the mysterious creator of cryptocurrency.",
        price: "1.00",
        imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        createdAt: new Date(),
      },
      {
        title: "Blockchain Helix",
        description: "Spiral glass structure representing the interconnected nature of blockchain technology. Each layer represents a new block in the chain.",
        price: "1.00",
        imageUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        createdAt: new Date(),
      },
      {
        title: "Merkle Tree",
        description: "Binary tree structure in glass, representing cryptographic hashing with fiber optic branches. A beautiful representation of data integrity.",
        price: "1.00",
        imageUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        createdAt: new Date(),
      },
      {
        title: "SHA-256 Mandala",
        description: "Geometric representation of the SHA-256 algorithm, hand-cut with mathematical precision. Art meets cryptography in perfect harmony.",
        price: "1.00",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        createdAt: new Date(),
      },
      {
        title: "Lightning Conduit",
        description: "Captured lightning patterns in glass, representing the Lightning Network's instant transactions. Energy frozen in time.",
        price: "1.00",
        imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        createdAt: new Date(),
      },
    ];

    sampleProducts.forEach(product => {
      const id = this.currentProductId++;
      this.products.set(id, { ...product, id });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      ...insertProduct, 
      id,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { 
      id,
      productId: insertOrder.productId,
      customerName: insertOrder.customerName,
      customerEmail: insertOrder.customerEmail,
      shippingAddress: insertOrder.shippingAddress,
      notes: insertOrder.notes || null,
      amount: insertOrder.amount,
      stripePaymentIntentId: insertOrder.stripePaymentIntentId || null,
      status: "pending",
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (order) {
      const updatedOrder = { ...order, status };
      this.orders.set(id, updatedOrder);
      return updatedOrder;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
