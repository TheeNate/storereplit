import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Truck, Zap, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShippingOption {
  service: string;
  description: string;
  price: number;
  deliveryDays: string;
  icon: string;
}

interface ShippingCalculatorProps {
  sizeOptionId: number;
  onShippingSelect: (option: ShippingOption) => void;
  selectedShipping?: ShippingOption | null;
  initialZip?: string;
}

export function ShippingCalculator({ 
  sizeOptionId, 
  onShippingSelect, 
  selectedShipping,
  initialZip = "" 
}: ShippingCalculatorProps) {
  const [zipCode, setZipCode] = useState(initialZip);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const { toast } = useToast();

  const validateZipCode = (zip: string): boolean => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  };

  const calculateShipping = async () => {
    if (!zipCode || !validateZipCode(zipCode)) {
      toast({
        title: "Invalid Zip Code",
        description: "Please enter a valid 5-digit zip code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasCalculated(false);

    try {
      console.log("Calculating shipping rates for:", { zipCode, sizeOptionId });

      const response = await apiRequest("POST", "/api/shipping/calculate", {
        destinationZip: zipCode,
        sizeOptionId: sizeOptionId,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to calculate shipping' }));
        throw new Error(errorData.message || 'Failed to calculate shipping rates');
      }

      const data = await response.json();
      console.log("Shipping calculation response:", data);

      setShippingOptions(data.shippingOptions || []);
      setHasCalculated(true);

      if (data.shippingOptions && data.shippingOptions.length > 0) {
        toast({
          title: "Shipping Rates Calculated",
          description: `Found ${data.shippingOptions.length} shipping options for ${zipCode}`,
        });
      } else {
        toast({
          title: "No Shipping Options",
          description: "No shipping options available for this location",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Shipping calculation error:", error);
      toast({
        title: "Shipping Calculation Failed",
        description: error.message || "Unable to calculate shipping rates",
        variant: "destructive",
      });
      setShippingOptions([]);
      setHasCalculated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShippingSelect = (option: ShippingOption) => {
    onShippingSelect(option);
    toast({
      title: "Shipping Method Selected",
      description: `${option.description} - $${option.price.toFixed(2)}`,
    });
  };

  const getShippingIcon = (service: string) => {
    if (service === 'PRIORITY_MAIL_EXPRESS') return <Zap className="w-4 h-4" />;
    return <Truck className="w-4 h-4" />;
  };

  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle className="text-xl font-display font-bold text-electric flex items-center">
          <MapPin className="mr-2" size={20} />
          SHIPPING CALCULATOR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter ZIP code (e.g., 12345)"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            className="bg-darker-surface border-matrix/30 text-white font-mono"
            maxLength={10}
          />
          <Button
            onClick={calculateShipping}
            disabled={isLoading || !zipCode}
            className="bg-gradient-to-r from-matrix to-electric text-black font-mono font-bold px-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "CALCULATE"
            )}
          </Button>
        </div>

        {hasCalculated && (
          <div className="space-y-3">
            {shippingOptions.length > 0 ? (
              <>
                <h4 className="text-matrix font-mono font-bold text-sm">
                  SHIPPING OPTIONS TO {zipCode}:
                </h4>
                {shippingOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedShipping?.service === option.service
                        ? "border-matrix bg-matrix/10"
                        : "border-gray-700 hover:border-matrix/50"
                    }`}
                    onClick={() => handleShippingSelect(option)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getShippingIcon(option.service)}
                        <div>
                          <p className="text-white font-mono font-bold text-sm">
                            {option.description.split('(')[0].trim()}
                          </p>
                          <p className="text-gray-400 font-mono text-xs">
                            {option.deliveryDays}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-matrix font-mono font-bold text-lg">
                          ${option.price.toFixed(2)}
                        </p>
                        {selectedShipping?.service === option.service && (
                          <Badge variant="secondary" className="text-xs">
                            SELECTED
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 font-mono">
                  No shipping options available for {zipCode}
                </p>
                <p className="text-gray-500 font-mono text-sm mt-1">
                  Please try a different zip code or contact support
                </p>
              </div>
            )}
          </div>
        )}

        {!hasCalculated && !isLoading && (
          <div className="text-center py-6">
            <p className="text-gray-400 font-mono text-sm">
              Enter your zip code to see shipping options and rates
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}