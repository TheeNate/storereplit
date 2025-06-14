import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, CheckCircle, Clock, Bitcoin, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BitcoinPaymentFormProps {
  cartItems?: Array<{
    designId: number;
    sizeOptionId: number;
    quantity: number;
  }>;
  designId?: number; // Legacy single item support
  sizeOptionId?: number; // Legacy single item support
  customerInfo: {
    name: string;
    email: string;
    address: string;
    notes?: string;
    shippingCost?: number;
    shippingMethod?: string;
  };
  amount: string;
  onSuccess: (invoiceId: string) => void;
  onCancel: () => void;
}

interface BitcoinInvoice {
  id: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  amount: number;
  btcAmount: string;
  lightningInvoice: string;
  onchainAddress: string;
  qrCode: string;
  expiresAt: string;
  paymentUrl: string;
}

export function BitcoinPaymentForm({
  cartItems,
  designId,
  sizeOptionId,
  customerInfo,
  amount,
  onSuccess,
  onCancel,
}: BitcoinPaymentFormProps) {
  const [invoice, setInvoice] = useState<BitcoinInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'lightning' | 'onchain'>('lightning');
  const { toast } = useToast();

  // Create Bitcoin invoice
  const createInvoice = async () => {
    setIsLoading(true);
    try {
      const requestData = cartItems && cartItems.length > 0 ? {
        // Cart-based order
        cartItems,
        customerInfo,
        amount: parseFloat(amount),
        shippingCost: customerInfo.shippingCost || 0,
        shippingMethod: customerInfo.shippingMethod,
      } : {
        // Legacy single-item order
        designId,
        sizeOptionId,
        customerInfo,
        amount: parseFloat(amount),
        shippingCost: customerInfo.shippingCost || 0,
        shippingMethod: customerInfo.shippingMethod,
      };

      const response = await apiRequest("POST", "/api/create-bitcoin-invoice", requestData);
      
      if (!response.ok) {
        throw new Error('Failed to create Bitcoin invoice');
      }
      
      const responseData: BitcoinInvoice = await response.json();
      
      // Redirect to Zaprite checkout URL
      if (responseData.paymentUrl) {
        window.location.href = responseData.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error: any) {
      console.error("Bitcoin invoice creation failed:", error);
      toast({
        title: "Bitcoin Payment Unavailable",
        description: "Bitcoin payment service is currently unavailable. Please use credit card payment instead.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Poll for payment status
  const startPaymentPolling = (invoiceId: string) => {
    const poll = async () => {
      try {
        const response = await apiRequest("GET", `/api/bitcoin-invoice/${invoiceId}`, {});
        const updatedInvoice: BitcoinInvoice = await response.json();
        
        setInvoice(updatedInvoice);
        
        if (updatedInvoice.status === 'paid') {
          toast({
            title: "Payment Confirmed",
            description: "Your Bitcoin payment has been confirmed!",
          });
          onSuccess(invoiceId);
          return;
        }
        
        if (updatedInvoice.status === 'expired' || updatedInvoice.status === 'cancelled') {
          toast({
            title: "Payment Expired",
            description: "The Bitcoin invoice has expired. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        // Continue polling if still pending
        if (updatedInvoice.status === 'pending') {
          setTimeout(poll, 3000); // Poll every 3 seconds
        }
      } catch (error: any) {
        console.error("Payment polling error:", error);
      }
    };
    
    poll();
  };

  // Calculate time remaining
  useEffect(() => {
    if (!invoice?.expiresAt) return;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(invoice.expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setInvoice(prev => prev ? { ...prev, status: 'expired' } : null);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [invoice?.expiresAt]);

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Format time remaining
  const formatTimeLeft = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Create invoice on mount
  useEffect(() => {
    createInvoice();
  }, []);

  if (isLoading || !invoice) {
    return (
      <Card className="glass-morphism border-matrix">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-matrix border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-300 font-mono">Creating Bitcoin invoice...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-morphism border-matrix max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-matrix font-mono">
          <Bitcoin size={24} />
          Bitcoin Payment
        </CardTitle>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="border-electric text-electric">
            ${amount}
          </Badge>
          <Badge variant="outline" className="border-matrix text-matrix">
            {invoice.btcAmount} BTC
          </Badge>
        </div>
        {timeLeft > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Clock size={16} />
            Expires in {formatTimeLeft(timeLeft)}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Method Selector */}
        <div className="flex gap-2">
          <Button
            variant={paymentMethod === 'lightning' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPaymentMethod('lightning')}
            className="flex-1"
          >
            <Zap size={16} className="mr-1" />
            Lightning
          </Button>
          <Button
            variant={paymentMethod === 'onchain' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPaymentMethod('onchain')}
            className="flex-1"
          >
            <Bitcoin size={16} className="mr-1" />
            On-chain
          </Button>
        </div>

        {/* QR Code */}
        <div className="text-center">
          <div className="bg-white p-4 rounded-lg inline-block">
            <img 
              src={invoice.qrCode} 
              alt="Bitcoin Payment QR Code"
              className="w-48 h-48 mx-auto"
            />
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-4">
          {paymentMethod === 'lightning' ? (
            <div>
              <label className="text-sm font-mono text-gray-400 mb-2 block">
                Lightning Invoice
              </label>
              <div className="flex gap-2">
                <div className="bg-darker-surface rounded p-3 flex-1 font-mono text-xs break-all">
                  {invoice.lightningInvoice.substring(0, 50)}...
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(invoice.lightningInvoice, 'Lightning invoice')}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-mono text-gray-400 mb-2 block">
                Bitcoin Address
              </label>
              <div className="flex gap-2">
                <div className="bg-darker-surface rounded p-3 flex-1 font-mono text-xs break-all">
                  {invoice.onchainAddress}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(invoice.onchainAddress, 'Bitcoin address')}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Status */}
        <div className="text-center">
          {invoice.status === 'pending' && (
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <Clock size={16} className="animate-pulse" />
              <span className="font-mono">Waiting for payment...</span>
            </div>
          )}
          {invoice.status === 'paid' && (
            <div className="flex items-center justify-center gap-2 text-matrix">
              <CheckCircle size={16} />
              <span className="font-mono">Payment confirmed!</span>
            </div>
          )}
          {(invoice.status === 'expired' || invoice.status === 'cancelled') && (
            <div className="text-red-400 font-mono">
              Payment expired
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={invoice.status === 'paid'}
          >
            Cancel
          </Button>
          <Button
            onClick={() => window.open(invoice.paymentUrl, '_blank')}
            className="flex-1 bg-gradient-to-r from-matrix to-electric text-black font-mono"
            disabled={invoice.status !== 'pending'}
          >
            Open Wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}