// Replace the Success component in client/src/pages/success.tsx

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CheckCircle, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Order } from "@shared/schema";

export default function Success() {
  const [location] = useLocation();
  
  // Parse URL parameters more reliably
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get("orderId");
  
  // Also try alternative parsing as fallback
  const locationParts = location.split("?");
  const fallbackParams = new URLSearchParams(locationParts[1] || "");
  const fallbackOrderId = fallbackParams.get("orderId");
  
  // Use the first available orderId
  const finalOrderId = orderId || fallbackOrderId;

  console.log("Success page - orderId from URL:", finalOrderId);
  console.log("Full URL:", location);
  console.log("Window location search:", window.location.search);

  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/orders/${finalOrderId}`],
    enabled: !!finalOrderId,
    retry: 3,
    retryDelay: 1000,
  });

  console.log("Order query result:", { orderData, isLoading, error });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-matrix border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-matrix font-mono">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Error loading order:", error);
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-cyber-pink mb-4">
            Error Loading Order
          </h1>
          <p className="text-gray-400 font-mono mb-4">Error: {error.message}</p>
          <p className="text-gray-400 font-mono mb-4">Order ID: {orderId}</p>
          <Button
            className="cyber-border font-mono"
            onClick={() => (window.location.href = "/")}
          >
            <Home className="mr-2" size={16} />
            RETURN TO SHOP
          </Button>
        </div>
      </div>
    );
  }

  if (!finalOrderId) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-matrix mb-4">
            No Order ID
          </h1>
          <p className="text-gray-400 font-mono">
            Missing order ID in URL parameters.
          </p>
          <Button
            className="mt-4 cyber-border font-mono"
            onClick={() => (window.location.href = "/")}
          >
            <Home className="mr-2" size={16} />
            RETURN TO SHOP
          </Button>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-matrix mb-4">
            Order Not Found
          </h1>
          <p className="text-gray-400 font-mono mb-4">
            The requested order does not exist.
          </p>
          <p className="text-gray-500 font-mono text-sm">Order ID: {finalOrderId}</p>
          <Button
            className="mt-4 cyber-border font-mono"
            onClick={() => (window.location.href = "/")}
          >
            <Home className="mr-2" size={16} />
            RETURN TO SHOP
          </Button>
        </div>
      </div>
    );
  }

  // Handle the new order structure (with design + size)
  const order = orderData.order || orderData; // Support both old and new API responses
  const design = orderData.design;
  const sizeOption = orderData.sizeOption;

  const btcAmount = (parseFloat(order.amount) / 18000).toFixed(3);

  // Determine product title
  let productTitle = "Custom Glass Art";
  if (design && sizeOption) {
    productTitle = `${design.title} - ${sizeOption.name}`;
  } else if (design) {
    productTitle = design.title;
  }

  return (
    <main className="pt-20 py-20 px-6">
      <div className="container mx-auto max-w-4xl text-center">
        <Card className="glass-morphism">
          <CardContent className="p-12">
            <CheckCircle className="text-8xl text-matrix mb-8 animate-pulse-neon mx-auto" />
            <h1 className="text-5xl font-display font-bold text-white mb-6">
              ORDER CONFIRMED
            </h1>
            <p className="text-2xl text-electric font-mono mb-8">
              Thanks for your order. Your glass piece is in production.
            </p>

            <div className="bg-darker-surface rounded-xl p-8 mb-8 text-left max-w-2xl mx-auto">
              <h3 className="text-matrix font-mono font-bold mb-4">
                ORDER DETAILS:
              </h3>
              <div className="space-y-2 font-mono text-sm">
                <p>
                  <span className="text-gray-400">Order ID:</span>{" "}
                  <span className="text-white">
                    #BTC-GLASS-{order.id.toString().padStart(6, "0")}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Product:</span>{" "}
                  <span className="text-white">{productTitle}</span>
                </p>
                <p>
                  <span className="text-gray-400">Amount:</span>{" "}
                  <span className="text-white">
                    ₿{btcAmount} (${parseFloat(order.amount).toLocaleString()})
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Status:</span>{" "}
                  <span className="text-matrix">CONFIRMED</span>
                </p>
                <p>
                  <span className="text-gray-400">Email Sent:</span>{" "}
                  <span className="text-matrix">✓ Manufacturer Notified</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="px-8 py-4 bg-matrix text-black font-mono font-bold rounded-lg hover:shadow-cyber transition-all"
                onClick={() => (window.location.href = "/")}
              >
                <Home className="mr-2" size={20} />
                RETURN TO SHOP
              </Button>
              <Button className="px-8 py-4 cyber-border hover:shadow-neon-green transition-all font-mono">
                <Mail className="mr-2" size={20} />
                ORDER SUPPORT
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
