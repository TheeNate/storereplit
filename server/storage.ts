import {
  users,
  products,
  orders,
  designs,
  sizeOptions,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Design,
  type InsertDesign,
  type SizeOption,
  type InsertSizeOption,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Legacy product methods (keep for backward compatibility)
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  // New design methods
  getAllDesigns(): Promise<Design[]>;
  getDesign(id: number): Promise<Design | undefined>;
  createDesign(design: InsertDesign): Promise<Design>;
  updateDesign(
    id: number,
    design: Partial<InsertDesign>,
  ): Promise<Design | undefined>;
  deleteDesign(id: number): Promise<boolean>;

  // Size option methods
  getAllSizeOptions(): Promise<SizeOption[]>;
  getSizeOption(id: number): Promise<SizeOption | undefined>;
  createSizeOption(sizeOption: InsertSizeOption): Promise<SizeOption>;
  updateSizeOption(
    id: number,
    sizeOption: Partial<InsertSizeOption>,
  ): Promise<SizeOption | undefined>;
  deleteSizeOption(id: number): Promise<boolean>;

  // Order methods (updated for new schema)
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getOrderWithDetails(id: number): Promise<
    | {
        order: Order;
        design: Design | undefined;
        sizeOption: SizeOption | undefined;
      }
    | undefined
  >;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Legacy product methods (backward compatibility)
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  // Design methods
  async getAllDesigns(): Promise<Design[]> {
    return await db.select().from(designs);
  }

  async getDesign(id: number): Promise<Design | undefined> {
    const [design] = await db.select().from(designs).where(eq(designs.id, id));
    return design || undefined;
  }

  async createDesign(insertDesign: InsertDesign): Promise<Design> {
    const [design] = await db.insert(designs).values(insertDesign).returning();
    return design;
  }

  async updateDesign(
    id: number,
    designUpdate: Partial<InsertDesign>,
  ): Promise<Design | undefined> {
    const [design] = await db
      .update(designs)
      .set(designUpdate)
      .where(eq(designs.id, id))
      .returning();
    return design || undefined;
  }

  async deleteDesign(id: number): Promise<boolean> {
    const result = await db.delete(designs).where(eq(designs.id, id));
    return result.rowCount > 0;
  }

  // Size option methods
  async getAllSizeOptions(): Promise<SizeOption[]> {
    return await db.select().from(sizeOptions);
  }

  async getSizeOption(id: number): Promise<SizeOption | undefined> {
    const [sizeOption] = await db
      .select()
      .from(sizeOptions)
      .where(eq(sizeOptions.id, id));
    return sizeOption || undefined;
  }

  async createSizeOption(
    insertSizeOption: InsertSizeOption,
  ): Promise<SizeOption> {
    const [sizeOption] = await db
      .insert(sizeOptions)
      .values(insertSizeOption)
      .returning();
    return sizeOption;
  }

  async updateSizeOption(
    id: number,
    sizeOptionUpdate: Partial<InsertSizeOption>,
  ): Promise<SizeOption | undefined> {
    const [sizeOption] = await db
      .update(sizeOptions)
      .set(sizeOptionUpdate)
      .where(eq(sizeOptions.id, id))
      .returning();
    return sizeOption || undefined;
  }

  async deleteSizeOption(id: number): Promise<boolean> {
    const result = await db.delete(sizeOptions).where(eq(sizeOptions.id, id));
    return result.rowCount > 0;
  }

  // Order methods (updated for new schema)
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async updateOrderStatus(
    id: number,
    status: string,
  ): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Get order with related design and size option details
  async getOrderWithDetails(id: number): Promise<
    | {
        order: Order;
        design: Design | undefined;
        sizeOption: SizeOption | undefined;
      }
    | undefined
  > {
    const order = await this.getOrder(id);
    if (!order) return undefined;

    const design = await this.getDesign(order.designId);
    const sizeOption = await this.getSizeOption(order.sizeOptionId);

    return {
      order,
      design,
      sizeOption,
    };
  }
}

export const storage = new DatabaseStorage();
