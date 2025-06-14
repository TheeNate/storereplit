import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import axios from "axios";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import {
  insertProductSchema,
  insertOrderSchema,
  insertDesignSchema,
  insertSizeOptionSchema,
} from "@shared/schema";
import { sendOrderNotification, sendCustomerOrderConfirmation } from "./resend";
import { zapriteService } from "./zaprite";
import { uspsService } from "./usps-rates";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
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

  // Admin authentication with session
  app.post("/api/admin/auth", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || "btcglass2024";

      if (password === adminPassword) {
        // Set session cookie that expires in 1 hour
        res.cookie('admin_session', 'authenticated', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 3600000, // 1 hour
          sameSite: 'strict'
        });
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

  // Middleware to check admin authentication
  const requireAdminAuth = (req: any, res: any, next: any) => {
    if (req.cookies?.admin_session === 'authenticated') {
      next();
    } else {
      res.status(401).json({ message: "Admin authentication required" });
    }
  };

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie('admin_session');
    res.json({ success: true });
  });

  // Admin: Create design
  app.post("/api/admin/designs", requireAdminAuth, upload.single("image"), async (req, res) => {
    try {
      const { title, description } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "Design image is required" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;

      const designData = {
        title,
        description: description || "",
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
  app.put("/api/admin/designs/:id", requireAdminAuth, upload.single("image"), async (req, res) => {
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
  app.delete("/api/admin/designs/:id", requireAdminAuth, async (req, res) => {
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
  app.put("/api/admin/size-options/:id", requireAdminAuth, async (req, res) => {
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

  // Create payment intent for cart-based orders
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, items, customerInfo, designId, sizeOptionId, shippingMethod, shippingRate } = req.body;

      // Support both cart-based orders (new) and single-item orders (legacy)
      if (items && items.length > 0) {
        // Cart-based order with multiple items
        console.log("Creating payment intent for cart:", { items, amount });

        // Convert amount to cents and ensure minimum amount for Stripe (50 cents)
        const chargeAmount = Math.max(Math.round(amount * 100), 50);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: chargeAmount,
          currency: "usd",
          payment_method_types: ['card'], // ✅ Only allow cards
          metadata: {
            orderType: "cart",
            itemCount: items.length.toString(),
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerAddress: customerInfo.address,
            customerZip: customerInfo.customerZip,
            cartItems: JSON.stringify(items),
            shippingMethod: shippingMethod || "",
            shippingRate: shippingRate?.toString() || "0",
          },
        });

        console.log("Cart payment intent created:", paymentIntent.id);
        res.json({ clientSecret: paymentIntent.client_secret });
      } else if (designId && sizeOptionId) {
        // Legacy single-item order
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
          payment_method_types: ['card'], // ✅ Only allow cards
          metadata: {
            orderType: "single",
            designId: designId.toString(),
            sizeOptionId: sizeOptionId.toString(),
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerAddress: customerInfo.address,
            shippingMethod: shippingMethod || "",
            shippingRate: shippingRate?.toString() || "0",
          },
        });

        console.log("Payment intent created:", paymentIntent.id);
        res.json({ clientSecret: paymentIntent.client_secret });
      } else {
        return res.status(400).json({ 
          message: "Either cart items or design/size selection is required" 
        });
      }
    } catch (error: any) {
      console.error("Stripe error:", error);
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Create order after successful Stripe payment
  app.post("/api/complete-stripe-order", async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }

      // Retrieve the payment intent from Stripe to get metadata
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Payment not completed" });
      }

      const metadata = paymentIntent.metadata;
      const orderType = metadata.orderType;

      let orderData;

      if (orderType === "cart") {
        // Cart-based order
        const cartItems = JSON.parse(metadata.cartItems);
        const firstItem = cartItems[0];

        orderData = {
          designId: firstItem.designId,
          sizeOptionId: firstItem.sizeOptionId,
          customerName: metadata.customerName,
          customerEmail: metadata.customerEmail,
          shippingAddress: metadata.customerAddress,
          notes: `Cart order: ${cartItems.length} items - ${cartItems.map((item: any) => `${item.designId}x${item.quantity}`).join(', ')}`,
          amount: (paymentIntent.amount / 100).toString(),
          paymentMethod: "stripe",
          shippingMethod: metadata.shippingMethod,
          shippingRate: metadata.shippingRate,
        };
      } else {
        // Single item order
        orderData = {
          designId: parseInt(metadata.designId),
          sizeOptionId: parseInt(metadata.sizeOptionId),
          customerName: metadata.customerName,
          customerEmail: metadata.customerEmail,
          shippingAddress: metadata.customerAddress,
          notes: "",
          amount: (paymentIntent.amount / 100).toString(),
          paymentMethod: "stripe",
          shippingMethod: metadata.shippingMethod,
          shippingRate: metadata.shippingRate,
        };
      }

      const order = await storage.createOrder(orderData);
      console.log("Stripe order created:", order.id);

      // Get design and size option details for email
      const orderDetails = await storage.getOrderWithDetails(order.id);
      if (!orderDetails) {
        return res.status(404).json({ message: "Order details not found" });
      }

      // Prepare email data
      const emailData = {
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        productTitle: `${orderDetails.design?.title} - ${orderDetails.sizeOption?.name}`,
        productDescription: `Design: ${orderDetails.design?.description}\n\nSize: ${orderDetails.sizeOption?.description}`,
        productImage: orderDetails.design?.imageUrl || "",
        amount: order.amount,
        notes: order.notes || undefined,
        orderId: order.id,
      };

      // Send both emails
      try {
        // Send manufacturer notification
        const manufacturerEmailSent = await sendOrderNotification(emailData);
        console.log("Manufacturer email sent:", manufacturerEmailSent);

        // Send customer confirmation
        const customerEmailSent = await sendCustomerOrderConfirmation(emailData);
        console.log("Customer email sent:", customerEmailSent);

        if (!manufacturerEmailSent || !customerEmailSent) {
          console.warn("Some emails failed to send, but order was created successfully");
        }
      } catch (emailError: any) {
        console.error("Email sending error:", emailError);
        // Don't fail the order creation if emails fail
      }

      res.json({ 
        success: true, 
        orderId: order.id,
        order: order 
      });

    } catch (error: any) {
      console.error("Error completing Stripe order:", error);
      res.status(500).json({ 
        message: "Error completing order: " + error.message 
      });
    }
  });

  // Test Zaprite API connection
  app.get("/api/test-zaprite", async (req, res) => {
    try {
      const response = await axios.get("https://api.zaprite.com/v1/account", {
        headers: {
          Authorization: `Bearer ${process.env.ZAPRITE_API_KEY}`,
          "Content-Type": "application/json",
        },
      });
      res.json({ 
        status: "success", 
        message: "Zaprite API connection successful",
        account: response.data 
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: "error",
        message: "Zaprite API connection failed",
        error: error.response?.data || error.message 
      });
    }
  });

  // ✅ FIXED: Zaprite Bitcoin order creation for CART-based orders
  app.post("/api/create-bitcoin-invoice", async (req, res) => {
    try {
      const { items, cartItems, customerInfo, shippingCost = 0, shippingMethod, designId, sizeOptionId, amount } = req.body;
      
      // Handle both parameter names for compatibility
      const orderItems = items || cartItems;

      // Handle both cart-based orders (new) and single-item orders (legacy)
      if (orderItems && orderItems.length > 0) {
        // ✅ NEW: Cart-based Bitcoin payment
        console.log("Creating Bitcoin invoice for cart:", { orderItems, shippingCost });

        // Calculate total for all items in cart
        let cartSubtotal = 0;
        let orderDescription = "Cart: ";

        for (const item of orderItems) {
          const design = await storage.getDesign(item.designId);
          const sizeOption = await storage.getSizeOption(item.sizeOptionId);

          if (!design || !sizeOption) {
            return res.status(404).json({ 
              message: `Design or size option not found for item: ${item.designId}/${item.sizeOptionId}` 
            });
          }

          const itemPrice = parseFloat(sizeOption.price) * item.quantity;
          cartSubtotal += itemPrice;
          orderDescription += `${design.title} (${sizeOption.name}) x${item.quantity}, `;
        }

        // Remove trailing comma and space
        orderDescription = orderDescription.slice(0, -2);

        const totalAmount = cartSubtotal + (shippingCost || 0);
        const chargeAmount = Math.round(totalAmount * 100); // Convert to cents

        console.log("Cart Bitcoin order:", { 
          cartSubtotal, 
          shippingCost, 
          totalAmount, 
          chargeAmount,
          itemCount: orderItems.length 
        });

        // Create consolidated order for entire cart
        const order = await storage.createOrder({
          designId: orderItems[0].designId, // Use first item's design for legacy compatibility
          sizeOptionId: orderItems[0].sizeOptionId, // Use first item's size for legacy compatibility
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          shippingAddress: customerInfo.address,
          notes: customerInfo.notes || `Cart order: ${orderItems.length} items`,
          amount: totalAmount.toString(),
          paymentMethod: "bitcoin",
          shippingMethod: shippingMethod,
          shippingRate: shippingCost.toString(),
        });

        const invoice = await zapriteService.createInvoice({
          amount: chargeAmount,
          description: orderDescription,
          customerEmail: customerInfo.email,
          metadata: {
            orderId: order.id.toString(),
            orderType: "cart",
            itemCount: orderItems.length.toString(),
            cartItems: JSON.stringify(orderItems),
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            shippingCost: shippingCost.toString(),
          },
        });

        // Update order with Zaprite invoice ID
        await storage.updateOrderZapriteId(order.id, invoice.id);

        console.log("Cart Bitcoin invoice created:", invoice.id);
        res.json(invoice);

      } else if (designId && sizeOptionId) {
        // ✅ EXISTING: Single-item Bitcoin payment (legacy support)
        console.log("Creating Bitcoin invoice for single item:", { designId, sizeOptionId });

        const design = await storage.getDesign(designId);
        const sizeOption = await storage.getSizeOption(sizeOptionId);

        if (!design || !sizeOption) {
          return res.status(404).json({ message: "Design or size option not found" });
        }

        const baseAmount = parseFloat(sizeOption.price);
        const totalAmount = baseAmount + (shippingCost || 0);
        const chargeAmount = Math.round(totalAmount * 100);

        console.log("Single item Bitcoin order:", { 
          baseAmount, 
          shippingCost, 
          totalAmount, 
          chargeAmount 
        });

        const order = await storage.createOrder({
          designId,
          sizeOptionId,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          shippingAddress: customerInfo.address,
          notes: customerInfo.notes,
          amount: totalAmount.toString(),
          paymentMethod: "bitcoin",
          shippingMethod: shippingMethod,
          shippingRate: shippingCost.toString(),
        });

        const invoice = await zapriteService.createInvoice({
          amount: chargeAmount,
          description: `${design.title} - ${sizeOption.name}`,
          customerEmail: customerInfo.email,
          metadata: {
            orderId: order.id.toString(),
            orderType: "single",
            designId: designId.toString(),
            sizeOptionId: sizeOptionId.toString(),
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            shippingCost: shippingCost.toString(),
          },
        });

        await storage.updateOrderZapriteId(order.id, invoice.id);

        console.log("Single item Bitcoin invoice created:", invoice.id);
        res.json(invoice);

      } else {
        return res.status(400).json({ 
          message: "Either cart items or design/size selection is required for Bitcoin payment" 
        });
      }

    } catch (error: any) {
      console.error("Zaprite error:", error);
      res
        .status(500)
        .json({ 
          message: "Bitcoin payment service unavailable: " + error.message,
          suggestion: "Please use credit card payment or contact support to verify Bitcoin payment setup"
        });
    }
  });

  // Get Bitcoin invoice status
  app.get("/api/bitcoin-invoice/:invoiceId", async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const invoice = await zapriteService.getInvoice(invoiceId);
      res.json(invoice);
    } catch (error: any) {
      console.error("Zaprite error:", error);
      res
        .status(500)
        .json({ message: "Error fetching Bitcoin invoice: " + error.message });
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
          }
        } catch (stripeError: any) {
          console.error("Error verifying payment intent:", stripeError);
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

      // Prepare email data
      const emailData = {
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        productTitle: `${orderDetails.design?.title} - ${orderDetails.sizeOption?.name}`,
        productDescription: `Design: ${orderDetails.design?.description}\n\nSize: ${orderDetails.sizeOption?.description}`,
        productImage: orderDetails.design?.imageUrl || "",
        amount: order.amount,
        notes: order.notes || undefined,
        orderId: order.id,
      };

      // Send both emails
      try {
        // Send manufacturer notification
        const manufacturerEmailSent = await sendOrderNotification(emailData);

        // Send customer confirmation
        const customerEmailSent = await sendCustomerOrderConfirmation(emailData);

        if (manufacturerEmailSent) {
          console.log("✅ Manufacturer notification email sent");
        } else {
          console.error("❌ Failed to send manufacturer email");
        }

        if (customerEmailSent) {
          console.log("✅ Customer confirmation email sent");
        } else {
          console.error("❌ Failed to send customer email");
        }

      } catch (emailError: any) {
        console.error("Error sending emails:", emailError);
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

  // Zaprite webhook endpoint for Bitcoin payment confirmations
  app.post(
    "/api/zaprite-webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["x-zaprite-signature"];

      if (!sig) {
        console.log("No Zaprite signature found in headers");
        return res.status(400).send("Missing signature");
      }

      try {
        const payload = req.body.toString();
        const isValid = zapriteService.verifyWebhookSignature(payload, sig as string);

        if (!isValid) {
          console.log("Zaprite webhook signature verification failed");
          return res.status(400).send("Invalid signature");
        }

        const event = JSON.parse(payload);
        console.log("Zaprite webhook event:", event.type, event.data?.id);

        // Handle Bitcoin payment confirmation
        if (event.type === "invoice.paid" && event.data) {
          const invoice = event.data;
          console.log("Bitcoin payment confirmed for invoice:", invoice.id);

          // Find and update order status
          // Implementation will depend on how you store the Zaprite invoice ID
          // This would need to be added to your order creation flow
        }

        res.json({ received: true });
      } catch (error: any) {
        console.error("Zaprite webhook error:", error);
        res.status(400).send(`Webhook Error: ${error.message}`);
      }
    },
  );

  // USPS Shipping Rate API endpoints
  app.post("/api/shipping/calculate", async (req, res) => {
    try {
      const { destinationZip, sizeOptionId } = req.body;

      if (!destinationZip || !sizeOptionId) {
        return res.status(400).json({ 
          message: "Destination zip code and size option ID are required" 
        });
      }

      // Validate zip code format
      const isValidZip = await uspsService.validateZipCode(destinationZip);
      if (!isValidZip) {
        return res.status(400).json({ 
          message: "Invalid zip code format. Please use 5-digit format (e.g., 12345)" 
        });
      }

      // Get size option details
      const sizeOption = await storage.getSizeOption(sizeOptionId);
      if (!sizeOption) {
        return res.status(404).json({ message: "Size option not found" });
      }

      console.log(`Calculating shipping rates for ${sizeOption.name} to ${destinationZip}`);

      // Get shipping rates from USPS
      const shippingOptions = await uspsService.getShippingRates(destinationZip, sizeOption.name);

      res.json({
        destinationZip,
        sizeOption: {
          id: sizeOption.id,
          name: sizeOption.name,
          size: sizeOption.size,
        },
        shippingOptions,
      });
    } catch (error: any) {
      console.error("Error calculating shipping rates:", error);
      res.status(500).json({ 
        message: "Error calculating shipping rates: " + error.message 
      });
    }
  });

  // Validate zip code endpoint
  app.post("/api/shipping/validate-zip", async (req, res) => {
    try {
      const { zipCode } = req.body;

      if (!zipCode) {
        return res.status(400).json({ message: "Zip code is required" });
      }

      const isValid = await uspsService.validateZipCode(zipCode);

      res.json({
        zipCode,
        isValid,
        message: isValid ? "Valid zip code" : "Invalid zip code format",
      });
    } catch (error: any) {
      console.error("Error validating zip code:", error);
      res.status(500).json({ 
        message: "Error validating zip code: " + error.message 
      });
    }
  });

  // Test USPS API connection
  app.get("/api/shipping/test-usps", async (req, res) => {
    try {
      // Test with a sample zip code and default size
      const testZip = "90210"; // Beverly Hills, CA
      const sizeOptions = await storage.getAllSizeOptions();

      if (sizeOptions.length === 0) {
        return res.status(404).json({ message: "No size options available for testing" });
      }

      const testSize = sizeOptions[0];
      const shippingOptions = await uspsService.getShippingRates(testZip, testSize.name);

      res.json({
        status: "success",
        message: "USPS API connection successful",
        testZip,
        testSize: testSize.name,
        shippingOptions,
      });
    } catch (error: any) {
      console.error("USPS API test failed:", error);
      res.status(500).json({
        status: "error",
        message: "USPS API connection failed",
        error: error.message,
      });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  const httpServer = createServer(app);
  return httpServer;
}