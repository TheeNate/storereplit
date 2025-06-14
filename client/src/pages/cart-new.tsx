import { useState, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, CreditCard, Bitcoin, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PaymentMethodSelector } from "@/components/payment-method-selector";
import { BitcoinPaymentForm } from "@/components/bitcoin-payment-form";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

const checkoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  aptSuite: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code"),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const StripeCheckoutForm = ({ 
  onSuccess, 
  totalAmount, 
  cartItems 
}: { 
  onSuccess: () => void; 
  totalAmount: string;
  cartItems: any[];
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
    console.log("Starting cart payment confirmation...");

    try {
      // First, submit the payment element to collect payment method
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error("Error submitting payment element:", submitError);
        toast({
          title: "Payment Error",
          description: submitError.message || "Error submitting payment information",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      console.log("Payment element submitted successfully");

      // Then confirm the payment with redirect disabled
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: "if_required", // This prevents automatic redirect
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
        console.log("Payment successful:", paymentIntent.id, "Status:", paymentIntent.status);

        if (paymentIntent.status === "succeeded") {
          console.log("Cart payment succeeded, creating order...");
          
          // Create the order in the database and send emails
          try {
            const orderResponse = await apiRequest("POST", "/api/complete-stripe-order", {
              paymentIntentId: paymentIntent.id
            });
            
            const orderData = await orderResponse.json();
            
            if (orderData.success) {
              console.log("Order created successfully:", orderData.orderId);
              toast({
                title: "Payment Successful",
                description: "Your order has been placed successfully!",
              });
              onSuccess();
            } else {
              throw new Error("Order creation failed");
            }
          } catch (orderError) {
            console.error("Error creating order:", orderError);
            toast({
              title: "Payment Processed",
              description: "Payment successful, but there was an issue processing your order. Please contact support.",
              variant: "destructive",
            });
            onSuccess(); // Still navigate to success page since payment went through
          }
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
      console.error("Unexpected error during cart payment:", err);
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
            console.log("Cart PaymentElement is ready");
          }}
          onChange={(event) => {
            console.log("Cart PaymentElement changed:", event);
            if (event.error) {
              console.error("Cart PaymentElement error:", event.error);
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
        <CreditCard className="mr-2" size={20} />
        {isProcessing ? "PROCESSING..." : `COMPLETE PAYMENT - $${totalAmount}`}
      </Button>
    </div>
  );
};

export default function Cart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { 
    items, 
    totalItems, 
    totalPrice, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bitcoin' | undefined>(undefined);
  const [clientSecret, setClientSecret] = useState("");
  const [showBitcoinPayment, setShowBitcoinPayment] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string>("");

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      email: "",
      streetAddress: "",
      aptSuite: "",
      city: "",
      state: "",
      zipCode: "",
      notes: "",
    },
  });

  const handleShippingSelect = (shippingOption: any) => {
    setSelectedShipping(shippingOption);
    setShippingCost(shippingOption.price);
  };

  // Auto-calculate shipping when ZIP code is entered
  const calculateShipping = useCallback(async (zipCode: string) => {
    if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode) || items.length === 0) {
      setShippingOptions([]);
      setSelectedShipping(null);
      setShippingCost(0);
      return;
    }

    setIsCalculatingShipping(true);
    setShippingError("");

    try {
      const response = await apiRequest("POST", "/api/shipping/calculate", {
        destinationZip: zipCode,
        sizeOptionId: items[0].sizeOptionId,
      });

      if (!response.ok) {
        throw new Error('Failed to calculate shipping');
      }

      const data = await response.json();
      setShippingOptions(data.shippingOptions);
      
      // Auto-select Priority Mail as default
      if (data.shippingOptions.length > 0) {
        const defaultShipping = data.shippingOptions.find((opt: any) => opt.service === 'PRIORITY_MAIL') || data.shippingOptions[0];
        setSelectedShipping(defaultShipping);
        setShippingCost(defaultShipping.price);
      }
    } catch (error) {
      console.error("Shipping calculation error:", error);
      setShippingError("Unable to calculate shipping rates. Please try again.");
      setShippingOptions([]);
      setSelectedShipping(null);
      setShippingCost(0);
    } finally {
      setIsCalculatingShipping(false);
    }
  }, [items]);

  // Watch ZIP code changes and auto-calculate shipping
  const zipCode = form.watch('zipCode');
  useEffect(() => {
    const timer = setTimeout(() => {
      if (zipCode) {
        calculateShipping(zipCode);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [zipCode, calculateShipping]);

  const finalTotal = totalPrice + shippingCost;

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: parseFloat(finalTotal.toFixed(2)),
        items: items.map(item => ({
          designId: item.designId,
          sizeOptionId: item.sizeOptionId,
          quantity: item.quantity,
        })),
        customerInfo: {
          name: data.name,
          email: data.email,
          address: `${data.streetAddress}${data.aptSuite ? '\n' + data.aptSuite : ''}\n${data.city}, ${data.state} ${data.zipCode}`,
          notes: data.notes,
        },
        customerZip: data.zipCode,
        shippingMethod: selectedShipping?.service,
        shippingRate: selectedShipping?.price,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create payment intent",
        variant: "destructive",
      });
    },
  });

  const handlePaymentMethodSelect = (method: 'stripe' | 'bitcoin') => {
    setPaymentMethod(method);
    if (method === 'bitcoin') {
      setClientSecret("");
      setShowBitcoinPayment(true);
    } else {
      setShowBitcoinPayment(false);
    }
  };

  const onCheckoutSubmit = (data: CheckoutForm) => {
    if (!selectedShipping) {
      toast({
        title: "Shipping Required",
        description: "Please enter your ZIP code to calculate shipping",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'stripe') {
      createPaymentIntentMutation.mutate(data);
    } else if (paymentMethod === 'bitcoin') {
      setShowBitcoinPayment(true);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setLocation("/success");
  };

  const handleBitcoinPaymentSuccess = (invoiceId: string) => {
    clearCart();
    setLocation(`/success?invoiceId=${invoiceId}`);
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-dark-surface text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <ShoppingCart className="mx-auto text-matrix" size={64} />
            <h1 className="text-4xl font-display font-bold text-electric">
              EMPTY CART
            </h1>
            <p className="text-gray-400 font-mono text-lg">
              Your cart is empty. Start shopping to add items.
            </p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105">
                <ArrowLeft className="mr-2" size={20} />
                CONTINUE SHOPPING
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-dark-surface text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-matrix hover:text-electric">
              <ArrowLeft className="mr-2" size={20} />
              Back to Shop
            </Button>
          </Link>
          <h1 className="text-4xl font-display font-bold text-electric">
            SHOPPING CART ({totalItems})
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={`${item.designId}-${item.sizeOptionId}`} className="glass-morphism">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-6">
                    <img
                      src={item.designImage}
                      alt={item.designTitle}
                      className="w-20 h-20 object-cover rounded-lg border border-matrix/30"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-mono font-bold text-white">
                        {item.designTitle}
                      </h3>
                      <p className="text-gray-400 font-mono">{item.sizeOptionName}</p>
                      <Badge variant="outline" className="text-matrix border-matrix">
                        ${item.price}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.designId, item.sizeOptionId, Math.max(1, item.quantity - 1))}
                        className="border-matrix text-matrix hover:bg-matrix/20"
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="text-white font-mono w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.designId, item.sizeOptionId, item.quantity + 1)}
                        className="border-matrix text-matrix hover:bg-matrix/20"
                      >
                        <Plus size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.designId, item.sizeOptionId)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checkout Summary */}
          <div className="space-y-6">
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-bold text-electric">
                  ORDER SUMMARY
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-mono">Items ({totalItems})</span>
                  <span className="text-white font-mono">${totalPrice.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-mono">Shipping</span>
                  <span className="text-matrix font-mono">
                    {selectedShipping ? `$${shippingCost.toFixed(2)}` : "Enter ZIP below"}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-mono font-bold text-lg">Total</span>
                    <span className="text-matrix font-mono font-bold text-2xl">
                      ${finalTotal.toFixed(0)}
                    </span>
                  </div>
                  {selectedShipping && (
                    <p className="text-gray-400 font-mono text-xs mt-1">
                      Includes {selectedShipping.description}
                    </p>
                  )}
                </div>
                
                {!showCheckoutForm && (
                  <Button
                    onClick={() => setShowCheckoutForm(true)}
                    className="w-full py-3 bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
                  >
                    PROCEED TO CHECKOUT
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Checkout Form */}
            {showCheckoutForm && (
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="text-2xl font-display font-bold text-electric">
                    CHECKOUT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCheckoutSubmit)} className="space-y-6">
                      {/* Customer Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white font-mono">CUSTOMER INFORMATION</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    className="bg-darker-surface border-matrix/30 text-white font-mono"
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
                                    className="bg-darker-surface border-matrix/30 text-white font-mono"
                                    placeholder="satoshi@bitcoin.org"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Shipping Address Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="text-matrix" size={20} />
                          <h3 className="text-lg font-bold text-white font-mono">SHIPPING ADDRESS</h3>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="streetAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-matrix font-mono text-sm">
                                STREET ADDRESS *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-darker-surface border-matrix/30 text-white font-mono"
                                  placeholder="123 Blockchain Avenue"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="aptSuite"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-matrix font-mono text-sm">
                                APT/SUITE (Optional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-darker-surface border-matrix/30 text-white font-mono"
                                  placeholder="Apt 2B, Suite 100, etc."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-matrix font-mono text-sm">
                                  CITY *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-darker-surface border-matrix/30 text-white font-mono"
                                    placeholder="Crypto City"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-matrix font-mono text-sm">
                                  STATE *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-darker-surface border-matrix/30 text-white font-mono"
                                    placeholder="CA"
                                    maxLength={2}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-matrix font-mono text-sm">
                                  ZIP CODE *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-darker-surface border-matrix/30 text-white font-mono"
                                    placeholder="12345"
                                    maxLength={10}
                                  />
                                </FormControl>
                                <FormMessage />
                                {isCalculatingShipping && (
                                  <div className="flex items-center gap-2 text-matrix text-sm font-mono mt-2">
                                    <Loader2 className="animate-spin" size={16} />
                                    Calculating shipping...
                                  </div>
                                )}
                                {shippingError && (
                                  <p className="text-red-400 text-sm font-mono mt-2">{shippingError}</p>
                                )}
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Real-time Shipping Options */}
                      {shippingOptions.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="text-matrix">📦</div>
                            <h3 className="text-lg font-bold text-white font-mono">SHIPPING OPTIONS</h3>
                          </div>
                          
                          <div className="space-y-3">
                            {shippingOptions.map((option, index) => (
                              <div
                                key={index}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                  selectedShipping?.service === option.service
                                    ? "border-matrix bg-matrix/10"
                                    : "border-gray-600 hover:border-matrix/50"
                                }`}
                                onClick={() => handleShippingSelect(option)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`w-4 h-4 rounded-full border-2 ${
                                        selectedShipping?.service === option.service
                                          ? "border-matrix bg-matrix"
                                          : "border-gray-600"
                                      }`}
                                    />
                                    <div>
                                      <p className="text-white font-mono font-bold">
                                        {option.icon} {option.description}
                                      </p>
                                      <p className="text-gray-400 text-sm font-mono">
                                        {option.deliveryDays}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-matrix font-mono font-bold text-lg">
                                    ${option.price.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-matrix font-mono text-sm">
                              ORDER NOTES (Optional)
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="bg-darker-surface border-matrix/30 text-white font-mono"
                                placeholder="Special instructions for your order..."
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                          disabled={createPaymentIntentMutation.isPending}
                        >
                          <CreditCard className="mr-2" size={20} />
                          {createPaymentIntentMutation.isPending
                            ? "PREPARING..."
                            : `PAY WITH STRIPE - $${finalTotal.toFixed(0)}`}
                        </Button>
                      )}



                      {/* Bitcoin Payment */}
                      {paymentMethod === 'bitcoin' && !showBitcoinPayment && (
                        <Button
                          type="submit"
                          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
                        >
                          <Bitcoin className="mr-2" size={20} />
                          PAY WITH BITCOIN - ${finalTotal.toFixed(0)}
                        </Button>
                      )}

                      {/* Change payment method button */}
                      {(paymentMethod || clientSecret || showBitcoinPayment) && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setPaymentMethod(undefined);
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

            {/* Stripe Payment Form (Outside main form to avoid nesting) */}
            {clientSecret && paymentMethod === 'stripe' && (
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle className="text-2xl font-display font-bold text-electric">
                    STRIPE PAYMENT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripeCheckoutForm
                      onSuccess={handlePaymentSuccess}
                      totalAmount={finalTotal.toFixed(0)}
                      cartItems={items}
                    />
                  </Elements>
                </CardContent>
              </Card>
            )}

            {/* Bitcoin Payment Form Modal/Overlay */}
            {paymentMethod === 'bitcoin' && showBitcoinPayment && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="max-w-md w-full">
                  <BitcoinPaymentForm
                    cartItems={items.map(item => ({
                      designId: item.designId,
                      sizeOptionId: item.sizeOptionId,
                      quantity: item.quantity,
                    }))}
                    customerInfo={{
                      name: form.getValues('name'),
                      email: form.getValues('email'),
                      address: `${form.getValues('streetAddress')}${form.getValues('aptSuite') ? '\n' + form.getValues('aptSuite') : ''}\n${form.getValues('city')}, ${form.getValues('state')} ${form.getValues('zipCode')}`,
                      notes: form.getValues('notes'),
                      shippingCost: shippingCost,
                      shippingMethod: selectedShipping?.service,
                    }}
                    amount={finalTotal.toFixed(2)}
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