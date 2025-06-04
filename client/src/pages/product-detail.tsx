import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { CreditCard, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
    queryKey: [`/api/products/${productId}`],
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
      console.log("Creating payment intent for product:", product);
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: parseFloat(product?.price || "0"),
        productId,
        customerInfo: data,
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Payment intent created successfully:", data);
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      console.error("Payment intent creation failed:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Replace the createOrderMutation in product-detail.tsx (around line 69)

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      console.log("SENDING ORDER DATA TO API:", orderData);
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (order) => {
      console.log("Order created successfully:", order);
      toast({
        title: "Order Created",
        description: "Your order has been confirmed!",
      });
      // Fix: Ensure the orderId parameter is properly added to the URL
      const successUrl = `/success?orderId=${order.id}`;
      console.log("Redirecting to:", successUrl);
      setLocation(successUrl);
    },
    onError: (error: any) => {
      console.error("Order creation failed:", error);
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrderForm) => {
    if (!product) {
      console.error("No product available for payment intent creation");
      return;
    }
    console.log("Form submitted with:", data);
    console.log("Product data:", product);
    createPaymentIntentMutation.mutate(data);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log("=== PAYMENT SUCCESS HANDLER CALLED ===");
    console.log("Payment Intent ID:", paymentIntentId);
    console.log("Product data:", product);

    if (!product) {
      console.error("No product data available for order creation");
      return;
    }

    const formData = form.getValues();
    console.log("Form data:", formData);

    const orderData = {
      productId: product.id,
      customerName: formData.name,
      customerEmail: formData.email,
      shippingAddress: formData.address,
      notes: formData.notes || "",
      amount: product.price,
      stripePaymentIntentId: paymentIntentId,
    };

    console.log("CREATING ORDER WITH DATA:", orderData);

    try {
      await createOrderMutation.mutateAsync(orderData);
    } catch (error) {
      console.error("Error in handlePaymentSuccess:", error);
    }
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
          <h1 className="text-4xl font-display font-bold text-matrix mb-4">
            Product Not Found
          </h1>
          <p className="text-gray-400 font-mono">
            The requested product does not exist.
          </p>
        </div>
      </div>
    );
  }

  const productPrice = parseFloat(product.price);

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
                <span className="text-4xl font-bold text-matrix font-mono">
                  ${productPrice.toFixed(2)}
                </span>
                <span className="text-xl text-gray-400 font-mono">USD</span>
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
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-matrix font-mono text-sm">
                              NAME *
                            </FormLabel>
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
                            <FormLabel className="text-matrix font-mono text-sm">
                              EMAIL *
                            </FormLabel>
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
                          <FormLabel className="text-matrix font-mono text-sm">
                            SHIPPING ADDRESS *
                          </FormLabel>
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
                          <FormLabel className="text-matrix font-mono text-sm">
                            SPECIAL INSTRUCTIONS
                          </FormLabel>
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
                        {createPaymentIntentMutation.isPending
                          ? "PREPARING..."
                          : `PAY WITH STRIPE - $${productPrice.toFixed(2)}`}
                      </Button>
                    )}

                    {clientSecret && (
                      <Elements
                        stripe={stripePromise}
                        options={{ clientSecret }}
                      >
                        <StripeCheckoutForm
                          onSuccess={handlePaymentSuccess}
                          amount={productPrice.toFixed(2)}
                        />
                      </Elements>
                    )}

                    <p className="text-xs text-gray-500 font-mono text-center">
                      Secure payment powered by Stripe. Your order will be sent
                      to our manufacturer immediately after payment.
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
function StripeCheckoutForm({
  onSuccess,
  amount,
}: {
  onSuccess: (paymentIntentId: string) => void;
  amount: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error("Stripe or Elements not loaded");
      toast({
        title: "Payment Error",
        description: "Payment system not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    console.log("Starting payment confirmation...");

    try {
      // First, submit the payment element to collect payment method
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error("Error submitting payment element:", submitError);
        toast({
          title: "Payment Error",
          description:
            submitError.message || "Error submitting payment information",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      console.log("Payment element submitted successfully");

      // Then confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: "if_required",
      });

      console.log("Payment confirmation result:", { error, paymentIntent });

      if (error) {
        console.error("Payment confirmation error:", error);
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed",
          variant: "destructive",
        });
      } else if (paymentIntent) {
        console.log(
          "Payment successful:",
          paymentIntent.id,
          "Status:",
          paymentIntent.status,
        );

        if (paymentIntent.status === "succeeded") {
          console.log(
            "Payment succeeded, calling onSuccess with:",
            paymentIntent.id,
          );
          await onSuccess(paymentIntent.id);
        } else {
          console.log("Payment not succeeded, status:", paymentIntent.status);
          toast({
            title: "Payment Incomplete",
            description: `Payment status: ${paymentIntent.status}`,
            variant: "destructive",
          });
        }
      } else {
        console.error("No payment intent returned");
        toast({
          title: "Payment Error",
          description: "No payment confirmation received",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Unexpected error during payment:", err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-darker-surface rounded-lg border border-matrix/30">
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card"],
          }}
          onReady={() => {
            console.log("PaymentElement is ready");
          }}
          onChange={(event) => {
            console.log("PaymentElement changed:", event);
            if (event.error) {
              console.error("PaymentElement error:", event.error);
            }
          }}
        />
      </div>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || !elements || isProcessing}
        className="w-full py-4 bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
      >
        {isProcessing ? "PROCESSING..." : `COMPLETE PAYMENT - $${amount}`}
      </Button>
    </div>
  );
}
