import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { CreditCard, UserRound, ArrowLeft, Check, Bitcoin, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { Design, SizeOption } from "@shared/schema";
import { z } from "zod";
import { useCart } from "@/lib/cart";
import { PaymentMethodSelector } from "@/components/payment-method-selector";
import { BitcoinPaymentForm } from "@/components/bitcoin-payment-form";
import { ShippingCalculator } from "@/components/shipping-calculator";

const orderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(10, "Complete address is required"),
  notes: z.string().optional(),
});

type OrderForm = z.infer<typeof orderSchema>;

export default function DesignDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const designId = parseInt(params.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addToCart } = useCart();
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bitcoin' | null>(null);
  const [showBitcoinPayment, setShowBitcoinPayment] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);

  const { data: design, isLoading: designLoading } = useQuery<Design>({
    queryKey: [`/api/designs/${designId}`],
    enabled: !!designId,
  });

  const { data: sizeOptions, isLoading: sizesLoading } = useQuery<SizeOption[]>(
    {
      queryKey: ["/api/size-options"],
    },
  );

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
      console.log("Creating payment intent for design + size:", {
        designId,
        sizeOptionId: selectedSizeId,
      });
      const selectedSize = sizeOptions?.find(s => s.id === selectedSizeId);
      const productPrice = parseFloat(selectedSize?.price || "0");
      const shippingCost = selectedShipping?.price || 0;
      const totalAmount = (productPrice + shippingCost).toFixed(2);
      
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        designId,
        sizeOptionId: selectedSizeId,
        customerInfo: data,
        amount: totalAmount,
        customerZip: data.address ? data.address.split('\n').pop()?.trim() : '',
        shippingMethod: selectedShipping?.service,
        shippingRate: selectedShipping?.price,
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

  // Replace the createOrderMutation in design-detail.tsx (around line 69)

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      console.log("SENDING ORDER DATA TO API:", orderData);
      const response = await apiRequest("POST", "/api/orders", orderData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Order creation failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (order) => {
      console.log("Order created successfully:", order);
      toast({
        title: "Order Created",
        description: "Your custom glass art is in production!",
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
        description: error.message || "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShippingSelect = (option: any) => {
    setSelectedShipping(option);
  };

  const onSubmit = (data: OrderForm) => {
    if (!design || !selectedSizeId) {
      toast({
        title: "Selection Required",
        description: "Please select a size before proceeding",
        variant: "destructive",
      });
      return;
    }

    if (!selectedShipping) {
      toast({
        title: "Shipping Required",
        description: "Please select a shipping method before proceeding",
        variant: "destructive",
      });
      return;
    }
    console.log("Form submitted with:", data);
    console.log("Design:", design, "Selected size:", selectedSizeId);
    createPaymentIntentMutation.mutate(data);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log("=== PAYMENT SUCCESS HANDLER CALLED ===");
    console.log("Payment Intent ID:", paymentIntentId);
    console.log("Design:", design, "Size ID:", selectedSizeId);

    if (!design || !selectedSizeId) {
      console.error("Missing design or size selection");
      return;
    }

    const selectedSize = sizeOptions?.find(
      (size) => size.id === selectedSizeId,
    );
    if (!selectedSize) {
      console.error("Selected size option not found");
      return;
    }

    const formData = form.getValues();
    console.log("Form data:", formData);

    const orderData = {
      designId: design.id,
      sizeOptionId: selectedSizeId,
      customerName: formData.name,
      customerEmail: formData.email,
      shippingAddress: formData.address,
      notes: formData.notes || "",
      amount: selectedSize.price,
      paymentMethod: "stripe",
      stripePaymentIntentId: paymentIntentId,
    };

    console.log("CREATING ORDER WITH DATA:", orderData);

    try {
      await createOrderMutation.mutateAsync(orderData);
    } catch (error) {
      console.error("Error in handlePaymentSuccess:", error);
    }
  };

  // Handle Bitcoin payment success
  const handleBitcoinPaymentSuccess = async (invoiceId: string) => {
    console.log("=== BITCOIN PAYMENT SUCCESS HANDLER CALLED ===");
    console.log("Bitcoin Invoice ID:", invoiceId);
    console.log("Design:", design, "Size ID:", selectedSizeId);

    if (!design || !selectedSizeId) {
      console.error("Missing design or size selection");
      return;
    }

    const selectedSize = sizeOptions?.find(
      (size) => size.id === selectedSizeId,
    );
    if (!selectedSize) {
      console.error("Selected size option not found");
      return;
    }

    const formData = form.getValues();
    console.log("Form data:", formData);

    const orderData = {
      designId: design.id,
      sizeOptionId: selectedSizeId,
      customerName: formData.name,
      customerEmail: formData.email,
      shippingAddress: formData.address,
      notes: formData.notes || "",
      amount: selectedSize.price,
      paymentMethod: "bitcoin",
      zapriteInvoiceId: invoiceId,
    };

    console.log("CREATING BITCOIN ORDER WITH DATA:", orderData);
    
    try {
      await createOrderMutation.mutateAsync(orderData);
    } catch (error) {
      console.error("Error in handleBitcoinPaymentSuccess:", error);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: 'stripe' | 'bitcoin') => {
    setPaymentMethod(method);
    if (method === 'bitcoin') {
      // Don't set showBitcoinPayment to true here
      setClientSecret(""); // Clear Stripe data
    } else {
      setShowBitcoinPayment(false);
      // Form submission will trigger Stripe payment intent creation
    }
  };

  const handleAddToCart = async () => {
    if (!design || !selectedSizeId || !selectedSize) {
      toast({
        title: "Selection Required",
        description: "Please select a size before adding to cart",
        variant: "destructive",
      });
      return;
    }

    setIsAddingToCart(true);
    
    try {
      addToCart({
        designId: design.id,
        sizeOptionId: selectedSizeId,
        designTitle: design.title,
        designImage: design.imageUrl,
        sizeOptionName: selectedSize.name,
        price: selectedSize.price,
      });

      toast({
        title: "Added to Cart",
        description: `${design.title} (${selectedSize.name}) added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const selectedSize = sizeOptions?.find((size) => size.id === selectedSizeId);

  if (designLoading || sizesLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-matrix border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-matrix mb-4">
            Design Not Found
          </h1>
          <p className="text-gray-400 font-mono">
            The requested design does not exist.
          </p>
          <Button
            className="mt-4 cyber-border font-mono"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="mr-2" size={16} />
            BACK TO GALLERY
          </Button>
        </div>
      </div>
    );
  }



  return (
    <main className="pt-20 py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Back Button */}
        <Button
          className="mb-8 cyber-border font-mono"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="mr-2" size={16} />
          BACK TO GALLERY
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Design Image & Info */}
          <div className="space-y-6">
            <div className="relative">
              <img
                src={design.imageUrl}
                alt={design.title}
                className="w-full rounded-xl shadow-neon-green"
              />

            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-display font-bold text-matrix">
                {design.title}
              </h1>
              <p className="text-gray-300 leading-relaxed font-mono text-lg">
                {design.description}
              </p>
            </div>


          </div>

          {/* Size Selection & Order Form */}
          <div className="space-y-8">
            {/* Size Selection */}
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-bold text-matrix">
                  SELECT YOUR SIZE
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sizeOptions && sizeOptions.length > 0 ? (
                  <div className="space-y-4">
                    {sizeOptions.map((sizeOption) => (
                      <div
                        key={sizeOption.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedSizeId === sizeOption.id
                            ? "border-matrix bg-matrix/10 shadow-neon-green"
                            : "border-gray-600 hover:border-matrix/50"
                        }`}
                        onClick={() => setSelectedSizeId(sizeOption.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                selectedSizeId === sizeOption.id
                                  ? "border-matrix bg-matrix"
                                  : "border-gray-600"
                              }`}
                            >
                              {selectedSizeId === sizeOption.id && (
                                <Check className="w-4 h-4 text-black" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-white font-mono font-bold text-lg">
                                {sizeOption.name}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                {sizeOption.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-matrix font-mono font-bold text-2xl">
                              ${parseFloat(sizeOption.price).toFixed(0)}
                            </p>
                            <p className="text-gray-400 text-sm">USD</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 font-mono text-center py-8">
                    Size options not available. Please contact support.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Customer Order Form */}
            {selectedSizeId && (
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="text-2xl font-display font-bold text-electric flex items-center">
                    <UserRound className="mr-2" size={24} />
                    CUSTOMER INFORMATION
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

                      {/* Shipping Calculator */}
                      {selectedSizeId && (
                        <ShippingCalculator
                          sizeOptionId={selectedSizeId}
                          onShippingSelect={handleShippingSelect}
                          selectedShipping={selectedShipping}
                          initialZip={form.watch('address') ? form.watch('address').split('\n').pop()?.trim() : ''}
                        />
                      )}

                      {/* Add to Cart Button */}
                      {!paymentMethod && !clientSecret && !showBitcoinPayment && selectedShipping && (
                        <div className="space-y-4">
                          <Button
                            type="button"
                            onClick={handleAddToCart}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
                            disabled={!selectedSizeId || isAddingToCart}
                          >
                            <ShoppingCart className="mr-2" size={20} />
                            {isAddingToCart 
                              ? "ADDING..." 
                              : `ADD TO CART - $${selectedSize ? (parseFloat(selectedSize.price) + (selectedShipping?.price || 0)).toFixed(0) : "0"}`}
                          </Button>
                          
                          <div className="text-center">
                            <p className="text-gray-400 font-mono text-sm mb-4">
                              OR
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Payment Method Selection */}
                      {!paymentMethod && !clientSecret && !showBitcoinPayment && selectedShipping && (
                        <div className="space-y-6">
                          <PaymentMethodSelector
                            onSelect={handlePaymentMethodSelect}
                            selectedMethod={paymentMethod}
                          />
                        </div>
                      )}

                      {/* Stripe Payment */}
                      {paymentMethod === 'stripe' && !clientSecret && (
                        <Button
                          type="submit"
                          className="w-full py-4 bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
                          disabled={
                            createPaymentIntentMutation.isPending ||
                            !selectedSizeId
                          }
                        >
                          <CreditCard className="mr-2" size={20} />
                          {createPaymentIntentMutation.isPending
                            ? "PREPARING..."
                            : `PAY WITH STRIPE - $${selectedSize ? (parseFloat(selectedSize.price) + (selectedShipping?.price || 0)).toFixed(0) : "0"}`}
                        </Button>
                      )}

                      {clientSecret && paymentMethod === 'stripe' && (
                        <Elements
                          stripe={stripePromise}
                          options={{ clientSecret }}
                        >
                          <StripeCheckoutForm
                            onSuccess={handlePaymentSuccess}
                            amount={
                              selectedSize
                                ? (parseFloat(selectedSize.price) + (selectedShipping?.price || 0)).toFixed(0)
                                : "0"
                            }
                            designTitle={design.title}
                            sizeName={selectedSize?.name || ""}
                          />
                        </Elements>
                      )}

                      {/* Bitcoin Payment */}
                      {paymentMethod === 'bitcoin' && !showBitcoinPayment && (
                        <Button
                          type="button"
                          onClick={async () => {
                            const isValid = await form.trigger();
                            if (isValid) {
                              setShowBitcoinPayment(true);
                            }
                          }}
                          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
                          disabled={!selectedSizeId}
                        >
                          <Bitcoin className="mr-2" size={20} />
                          PAY WITH BITCOIN - ${selectedSize ? (parseFloat(selectedSize.price) + (selectedShipping?.price || 0)).toFixed(0) : "0"}
                        </Button>
                      )}

                      {/* Change payment method button */}
                      {(paymentMethod || clientSecret || showBitcoinPayment) && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setPaymentMethod(null);
                            setClientSecret("");
                            setShowBitcoinPayment(false);
                          }}
                          className="w-full mt-4"
                        >
                          Change Payment Method
                        </Button>
                      )}

                      <p className="text-xs text-gray-500 font-mono text-center">
                        Secure payments powered by Stripe and Bitcoin Lightning Network
                      </p>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Bitcoin Payment Form Modal/Overlay */}
            {paymentMethod === 'bitcoin' && showBitcoinPayment && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="max-w-md w-full">
                  <BitcoinPaymentForm
                    designId={designId}
                    sizeOptionId={selectedSizeId!}
                    customerInfo={{
                      name: form.getValues('name'),
                      email: form.getValues('email'),
                      address: form.getValues('address'),
                      notes: form.getValues('notes'),
                    }}
                    amount={selectedSize ? (parseFloat(selectedSize.price) + (selectedShipping?.price || 0)).toFixed(2) : "0"}
                    onSuccess={handleBitcoinPaymentSuccess}
                    onCancel={() => setShowBitcoinPayment(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// Enhanced Stripe checkout form with order summary
function StripeCheckoutForm({
  onSuccess,
  amount,
  designTitle,
  sizeName,
}: {
  onSuccess: (paymentIntentId: string) => void;
  amount: string;
  designTitle: string;
  sizeName: string;
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
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="bg-darker-surface rounded-lg p-4 border border-matrix/30">
        <h3 className="text-matrix font-mono font-bold mb-3">ORDER SUMMARY</h3>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white font-mono">{designTitle}</p>
            <p className="text-gray-400 text-sm">{sizeName}</p>
          </div>
          <p className="text-matrix font-mono font-bold text-xl">${amount}</p>
        </div>
      </div>

      {/* Payment Element */}
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
        {isProcessing ? "PROCESSING..." : `COMPLETE ORDER - $${amount}`}
      </Button>
    </div>
  );
}
