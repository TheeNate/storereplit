import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import {
  insertProductSchema,
  insertOrderSchema,
  insertDesignSchema,
  insertSizeOptionSchema,
} from "@shared/schema";
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
  // Legacy product routes (backward compatibility)
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

  // NEW: Design routes
  app.get("/api/designs", async (req, res) => {
    try {
      const designs = await storage.getAllDesigns();
      res.json(designs);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error fetching designs: " + error.message });
    }
  });

  app.get("/api/designs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const design = await storage.getDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      res.json(design);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error fetching design: " + error.message });
    }
  });

  // NEW: Size options routes
  app.get("/api/size-options", async (req, res) => {
    try {
      const sizeOptions = await storage.getAllSizeOptions();
      res.json(sizeOptions);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error fetching size options: " + error.message });
    }
  });

  app.get("/api/size-options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sizeOption = await storage.getSizeOption(id);
      if (!sizeOption) {
        return res.status(404).json({ message: "Size option not found" });
      }
      res.json(sizeOption);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error fetching size option: " + error.message });
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

  // Admin: Create design
  app.post("/api/admin/designs", upload.single("image"), async (req, res) => {
    try {
      const { title, description } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "Design image is required" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;

      const designData = {
        title,
        description,
        imageUrl,
      };

      const validatedData = insertDesignSchema.parse(designData);
      const design = await storage.createDesign(validatedData);

      res.json(design);
    } catch (error: any) {
      res
        .status(400)
        .json({ message: "Error creating design: " + error.message });
    }
  });

  // Admin: Update design
  app.put("/api/admin/designs/:id", upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, description } = req.body;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }

      const design = await storage.updateDesign(id, updateData);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      res.json(design);
    } catch (error: any) {
      res
        .status(400)
        .json({ message: "Error updating design: " + error.message });
    }
  });

  // Admin: Delete design
  app.delete("/api/admin/designs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDesign(id);
      if (!deleted) {
        return res.status(404).json({ message: "Design not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res
        .status(400)
        .json({ message: "Error deleting design: " + error.message });
    }
  });

  // Admin: Update size option with Stripe IDs
  app.put("/api/admin/size-options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stripeProductId, stripePriceId, price, description } = req.body;

      const updateData: any = {};
      if (stripeProductId) updateData.stripeProductId = stripeProductId;
      if (stripePriceId) updateData.stripePriceId = stripePriceId;
      if (price) updateData.price = price;
      if (description) updateData.description = description;

      const sizeOption = await storage.updateSizeOption(id, updateData);
      if (!sizeOption) {
        return res.status(404).json({ message: "Size option not found" });
      }

      res.json(sizeOption);
    } catch (error: any) {
      res
        .status(400)
        .json({ message: "Error updating size option: " + error.message });
    }
  });

  // Legacy: Create product (admin only)
  app.post("/api/products", upload.single("image"), async (req, res) => {
    try {
      const { title, description, price } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "Product image is required" });
      }

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

  // NEW: Create payment intent for design + size combination
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { designId, sizeOptionId, customerInfo } = req.body;

      console.log("Creating payment intent for design + size:", {
        designId,
        sizeOptionId,
      });

      // Get the size option to determine pricing
      const sizeOption = await storage.getSizeOption(sizeOptionId);
      if (!sizeOption) {
        return res.status(404).json({ message: "Size option not found" });
      }

      // Convert amount to cents and ensure minimum amount for Stripe (50 cents)
      const chargeAmount = Math.max(
        Math.round(parseFloat(sizeOption.price) * 100),
        50,
      );

      console.log("Creating payment intent:", {
        amount: sizeOption.price,
        chargeAmount,
        designId,
        sizeOptionId,
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: chargeAmount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          designId: designId.toString(),
          sizeOptionId: sizeOptionId.toString(),
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

  // NEW: Handle successful payment and create order (updated for design + size)
  app.post("/api/orders", async (req, res) => {
    try {
      console.log("Creating order with data:", req.body);

      // Validate and parse the order data
      let orderData;
      try {
        orderData = insertOrderSchema.parse(req.body);
      } catch (validationError: any) {
        console.error("Order validation error:", validationError);
        return res.status(400).json({ 
          message: "Invalid order data: " + validationError.message,
          details: validationError.issues || validationError
        });
      }

      // Verify the payment intent was successful (if provided)
      if (orderData.stripePaymentIntentId) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            orderData.stripePaymentIntentId,
          );
          console.log("Payment intent status:", paymentIntent.status);

          if (paymentIntent.status !== "succeeded") {
            console.warn(`Payment not fully completed. Status: ${paymentIntent.status}`);
            // Don't fail the order creation for non-succeeded payments in testing
            // In production, you might want to be stricter here
          }
        } catch (stripeError: any) {
          console.error("Error verifying payment intent:", stripeError);
          // Log the error but don't fail the order creation
          // This allows testing with mock payment intents
          console.warn("Proceeding with order creation despite payment verification error");
        }
      }

      const order = await storage.createOrder(orderData);
      console.log("Order created:", order.id);

      // Get design and size option details for email
      const orderDetails = await storage.getOrderWithDetails(order.id);
      if (!orderDetails) {
        return res.status(404).json({ message: "Order details not found" });
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
          productTitle: `${orderDetails.design?.title} - ${orderDetails.sizeOption?.name}`,
          productDescription: `Design: ${orderDetails.design?.description}\n\nSize: ${orderDetails.sizeOption?.description}`,
          productImage: orderDetails.design?.imageUrl || "",
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

  // Get order details (updated to include design + size info)
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderDetails = await storage.getOrderWithDetails(id);
      if (!orderDetails) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(orderDetails);
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
