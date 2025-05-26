import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema } from "@shared/schema";
import { sendOrderNotification } from "./sendgrid";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching products: " + error.message });
    }
  });

  // Get single product
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching product: " + error.message });
    }
  });

  // Admin authentication
  app.post("/api/admin/auth", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || "btcglass2024";
      
      if (password === adminPassword) {
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Authentication error: " + error.message });
    }
  });

  // Create product (admin only)
  app.post("/api/products", upload.single('image'), async (req, res) => {
    try {
      const { title, description, price } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "Product image is required" });
      }

      // In a real app, you'd upload to cloud storage and get a URL
      // For this demo, we'll use a placeholder URL
      const imageUrl = `/uploads/${req.file.filename}`;

      const productData = {
        title,
        description,
        price,
        imageUrl,
      };

      const validatedData = insertProductSchema.parse(productData);
      const product = await storage.createProduct(validatedData);
      
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating product: " + error.message });
    }
  });

  // Create payment intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, productId, customerInfo } = req.body;
      
      // Ensure minimum amount for Stripe (50 cents)
      const chargeAmount = Math.max(Math.round(amount * 100), 50);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: chargeAmount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          productId: productId.toString(),
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Handle successful payment and create order
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      
      // Get product details for email
      const product = await storage.getProduct(order.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Send email notification to manufacturer
      const manufacturerEmail = process.env.MANUFACTURER_EMAIL || "manufacturer@btcglass.art";
      
      await sendOrderNotification({
        to: manufacturerEmail,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        productTitle: product.title,
        productDescription: product.description,
        productImage: product.imageUrl,
        amount: order.amount,
        notes: order.notes || undefined,
        orderId: order.id,
      });

      // Update order status
      await storage.updateOrderStatus(order.id, "confirmed");
      
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating order: " + error.message });
    }
  });

  // Get order details
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching order: " + error.message });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
