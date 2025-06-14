import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, CreditCard, Bitcoin } from "lucide-react";
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
import { ShippingCalculator } from "@/components/shipping-calculator";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

const checkoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(1, "Address is required"),
  zipCode: z.string().min(5, "Valid zip code is required"),
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
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-4 bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
      >
        <CreditCard className="mr-2" size={20} />
        {isProcessing ? "PROCESSING..." : `COMPLETE PAYMENT - $${totalAmount}`}
      </Button>
    </form>
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

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      zipCode: "",
      notes: "",
    },
  });

  const handleShippingSelect = (shippingOption: any) => {
    setSelectedShipping(shippingOption);
    setShippingCost(shippingOption.price);
  };

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
          ...data,
          shippingMethod: selectedShipping?.service,
          shippingRate: selectedShipping?.price,
        },
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
        description: "Please select a shipping method before proceeding",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'stripe') {
      createPaymentIntentMutation.mutate(data);
    } else if (paymentMethod === 'bitcoin') {
      // Store form data for Bitcoin payment
      setShowBitcoinPayment(true);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setLocation("/success");
  };

  const handleBitcoinPaymentSuccess = (invoiceId: string) => {
    clearCart();
    setLocation("/success");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <ShoppingCart className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h1 className="text-4xl font-display font-bold text-matrix mb-4">
              EMPTY CART
            </h1>
            <p className="text-gray-400 font-mono mb-8">
              Your cart is currently empty. Browse our designs to add items.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono px-8 py-3">
                <ArrowLeft className="mr-2" size={20} />
                BROWSE DESIGNS
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2" size={16} />
              Back to Designs
            </Button>
          </Link>
          <h1 className="text-4xl font-display font-bold text-matrix mb-2">
            SHOPPING CART
          </h1>
          <p className="text-gray-400 font-mono">
            {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={`${item.designId}-${item.sizeOptionId}`} className="glass-morphism">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.designImage}
                      alt={item.designTitle}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">
                        {item.designTitle}
                      </h3>
                      <p className="text-gray-400 font-mono text-sm">
                        {item.sizeOptionName}
                      </p>
                      <p className="text-matrix font-mono font-bold text-lg">
                        ${parseFloat(item.price).toFixed(0)} each
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.designId, item.sizeOptionId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="text-white font-mono font-bold px-3">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.designId, item.sizeOptionId, item.quantity + 1)}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-matrix font-mono font-bold text-xl">
                        ${(parseFloat(item.price) * item.quantity).toFixed(0)}
                      </p>
                      <Button
                        variant="ghost"
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
                    {selectedShipping ? `$${shippingCost.toFixed(2)}` : "Calculate below"}
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
                      <div className="grid grid-cols-1 gap-4">
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
                                  className="bg-darker-surface border-matrix/30 text-white font-mono"
                                  placeholder="123 Bitcoin Blvd, Crypto City, CC"
                                  rows={3}
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
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-matrix font-mono text-sm">
                                ORDER NOTES (OPTIONAL)
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  className="bg-darker-surface border-matrix/30 text-white font-mono"
                                  placeholder="Special delivery instructions..."
                                  rows={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Shipping Calculator */}
                      {items.length > 0 && (
                        <ShippingCalculator
                          sizeOptionId={items[0].sizeOptionId}
                          onShippingSelect={handleShippingSelect}
                          selectedShipping={selectedShipping}
                          initialZip={form.watch('zipCode') || ''}
                        />
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
                          disabled={createPaymentIntentMutation.isPending}
                        >
                          <CreditCard className="mr-2" size={20} />
                          {createPaymentIntentMutation.isPending
                            ? "PREPARING..."
                            : `PAY WITH STRIPE - $${finalTotal.toFixed(0)}`}
                        </Button>
                      )}

                      {clientSecret && paymentMethod === 'stripe' && (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                          <StripeCheckoutForm
                            onSuccess={handlePaymentSuccess}
                            totalAmount={totalPrice.toFixed(0)}
                            cartItems={items}
                          />
                        </Elements>
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
          </div>
        </div>

        {/* Bitcoin Payment Modal */}
        {paymentMethod === 'bitcoin' && showBitcoinPayment && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="max-w-md w-full">
              <BitcoinPaymentForm
                designId={items[0]?.designId || 0}
                sizeOptionId={items[0]?.sizeOptionId || 0}
                customerInfo={{
                  name: form.getValues('name'),
                  email: form.getValues('email'),
                  address: form.getValues('address'),
                  notes: form.getValues('notes'),
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
  );
}