import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { CreditCard, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { stripePromise } from "@/lib/stripe";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { z } from "zod";

const orderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(10, "Complete address is required"),
  notes: z.string().optional(),
});

type OrderForm = z.infer<typeof orderSchema>;

export default function ProductDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const productId = parseInt(params.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientSecret, setClientSecret] = useState("");

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      notes: "",
    },
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (data: OrderForm) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: Number(product?.price || "1.00"),
        productId,
        customerInfo: data,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (order) => {
      toast({
        title: "Order Created",
        description: "Your order has been confirmed!",
      });
      setLocation(`/success?orderId=${order.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrderForm) => {
    if (!product) return;
    createPaymentIntentMutation.mutate(data);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!product) return;

    const formData = form.getValues();
    await createOrderMutation.mutateAsync({
      productId: product.id,
      customerName: formData.name,
      customerEmail: formData.email,
      shippingAddress: formData.address,
      notes: formData.notes,
      amount: product.price,
      stripePaymentIntentId: paymentIntentId,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-matrix border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-matrix mb-4">Product Not Found</h1>
          <p className="text-gray-400 font-mono">The requested product does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="pt-20 py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-6">
            <img 
              src={product.imageUrl} 
              alt={product.title}
              className="w-full rounded-xl shadow-neon-green"
            />
            
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <img 
                  key={i}
                  src={product.imageUrl} 
                  alt={`${product.title} view ${i + 1}`}
                  className="w-full h-20 object-cover rounded-lg cursor-pointer hover:shadow-neon-green transition-all"
                />
              ))}
            </div>
          </div>

          {/* Product Details & Order Form */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-display font-bold text-matrix mb-4">
                {product.title}
              </h1>
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-4xl font-bold text-matrix font-mono">${Number(product.price).toFixed(2)}</span>
                <span className="text-xl text-gray-400 font-mono">
                  USD
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed font-mono">
                {product.description}
              </p>
            </div>

            {/* Customer Order Form */}
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-bold text-electric flex items-center">
                  <UserRound className="mr-2" size={24} />
                  CUSTOMER DATA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-matrix font-mono text-sm">NAME *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green"
                                placeholder="Satoshi Nakamoto"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-matrix font-mono text-sm">EMAIL *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="email"
                                className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green"
                                placeholder="satoshi@bitcoin.org"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-matrix font-mono text-sm">SHIPPING ADDRESS *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green h-24"
                              placeholder="123 Blockchain Ave&#10;Crypto City, CC 12345&#10;Digital Nation"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-matrix font-mono text-sm">SPECIAL INSTRUCTIONS</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green h-20"
                              placeholder="Any custom engraving requests or special handling notes..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!clientSecret && (
                      <Button 
                        type="submit" 
                        className="w-full py-4 bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
                        disabled={createPaymentIntentMutation.isPending}
                      >
                        <CreditCard className="mr-2" size={20} />
                        {createPaymentIntentMutation.isPending ? "PREPARING..." : `PAY WITH STRIPE - $${Number(product.price).toFixed(2)}`}
                      </Button>
                    )}

                    {clientSecret && (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <StripeCheckoutForm 
                          onSuccess={handlePaymentSuccess}
                          amount={Number(product.price).toFixed(2)}
                        />
                      </Elements>
                    )}

                    <p className="text-xs text-gray-500 font-mono text-center">
                      Secure payment powered by Stripe. Your order will be sent to our manufacturer immediately after payment.
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

// Separate component for Stripe Elements
function StripeCheckoutForm({ onSuccess, amount }: { onSuccess: (paymentIntentId: string) => void; amount: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/success",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      await onSuccess(paymentIntent.id);
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-darker-surface rounded-lg border border-matrix/30">
        {/* PaymentElement will be rendered here by Stripe */}
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full py-4 bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
      >
        {isProcessing ? "PROCESSING..." : `COMPLETE PAYMENT - ₿${amount}`}
      </Button>
    </form>
  );
}
