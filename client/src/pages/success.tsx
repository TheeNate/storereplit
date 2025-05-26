import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CheckCircle, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Order, Product } from "@shared/schema";

export default function Success() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1]);
  const orderId = urlParams.get('orderId');

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  const { data: product } = useQuery<Product>({
    queryKey: ["/api/products", order?.productId],
    enabled: !!order?.productId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-matrix border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-matrix mb-4">Order Not Found</h1>
          <p className="text-gray-400 font-mono">The requested order does not exist.</p>
        </div>
      </div>
    );
  }

  const btcAmount = (parseFloat(order.amount) / 18000).toFixed(3);

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
              <h3 className="text-matrix font-mono font-bold mb-4">ORDER DETAILS:</h3>
              <div className="space-y-2 font-mono text-sm">
                <p>
                  <span className="text-gray-400">Order ID:</span>{" "}
                  <span className="text-white">#BTC-GLASS-{order.id.toString().padStart(6, '0')}</span>
                </p>
                <p>
                  <span className="text-gray-400">Product:</span>{" "}
                  <span className="text-white">{product?.title || "Loading..."}</span>
                </p>
                <p>
                  <span className="text-gray-400">Amount:</span>{" "}
                  <span className="text-white">₿{btcAmount} (${parseFloat(order.amount).toLocaleString()})</span>
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
                onClick={() => window.location.href = "/"}
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
