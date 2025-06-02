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
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG and WebP images are allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error fetching products: " + error.message });
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
      res
        .status(500)
        .json({ message: "Error fetching product: " + error.message });
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
      res
        .status(500)
        .json({ message: "Authentication error: " + error.message });
    }
  });

  // Create product (admin only)
  app.post("/api/products", upload.single("image"), async (req, res) => {
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
      res
        .status(400)
        .json({ message: "Error creating product: " + error.message });
    }
  });

  // Create payment intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, productId, customerInfo } = req.body;

      // Convert amount to cents and ensure minimum amount for Stripe (50 cents)
      const chargeAmount = Math.max(Math.round(parseFloat(amount) * 100), 50);

      console.log("Creating payment intent:", {
        amount,
        chargeAmount,
        productId,
      });

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

      console.log("Payment intent created:", paymentIntent.id);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Handle successful payment and create order
  app.post("/api/orders", async (req, res) => {
    try {
      console.log("Creating order with data:", req.body);

      const orderData = insertOrderSchema.parse(req.body);

      // Verify the payment intent was successful
      if (orderData.stripePaymentIntentId) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            orderData.stripePaymentIntentId,
          );
          console.log("Payment intent status:", paymentIntent.status);

          if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({
              message: `Payment not completed. Status: ${paymentIntent.status}`,
            });
          }
        } catch (stripeError: any) {
          console.error("Error verifying payment intent:", stripeError);
          return res.status(400).json({
            message: "Error verifying payment: " + stripeError.message,
          });
        }
      }

      const order = await storage.createOrder(orderData);
      console.log("Order created:", order.id);

      // Get product details for email
      const product = await storage.getProduct(order.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Send email notification to manufacturer
      const manufacturerEmail =
        process.env.MANUFACTURER_EMAIL || "manufacturer@btcglass.art";

      try {
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
        console.log("Order notification email sent");
      } catch (emailError: any) {
        console.error("Error sending email:", emailError);
        // Don't fail the order creation if email fails
      }

      // Update order status
      await storage.updateOrderStatus(order.id, "confirmed");
      console.log("Order status updated to confirmed");

      res.json(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      res
        .status(400)
        .json({ message: "Error creating order: " + error.message });
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
      res
        .status(500)
        .json({ message: "Error fetching order: " + error.message });
    }
  });

  // Stripe webhook endpoint (optional but recommended for production)
  app.post(
    "/api/stripe-webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!endpointSecret) {
        console.log(
          "No webhook secret configured, skipping webhook verification",
        );
        return res.status(400).send("Webhook secret not configured");
      }

      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
      } catch (err: any) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          console.log("PaymentIntent was successful!", paymentIntent.id);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    },
  );

  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  const httpServer = createServer(app);
  return httpServer;
}
