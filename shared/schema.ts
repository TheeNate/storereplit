import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// New table for design templates (the graphics/artwork)
export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New table for size options with fixed pricing
export const sizeOptions = pgTable("size_options", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "6 inch", "12 inch", "15 inch"
  size: text("size").notNull(), // "6", "12", "15"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stripeProductId: text("stripe_product_id"), // Link to Stripe product
  stripePriceId: text("stripe_price_id"), // Link to Stripe price
  description: text("description"), // "Perfect for desk display", etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Updated orders table to reference both design and size
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  designId: integer("design_id").notNull(), // Which design they chose
  sizeOptionId: integer("size_option_id").notNull(), // Which size they chose
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  notes: text("notes"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Keep the old products table for backward compatibility during migration
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDesignSchema = createInsertSchema(designs).omit({
  id: true,
  createdAt: true,
});

export const insertSizeOptionSchema = createInsertSchema(sizeOptions).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Design = typeof designs.$inferSelect;
export type InsertDesign = z.infer<typeof insertDesignSchema>;
export type SizeOption = typeof sizeOptions.$inferSelect;
export type InsertSizeOption = z.infer<typeof insertSizeOptionSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
