import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Bitcoin, Zap } from "lucide-react";

interface PaymentMethodSelectorProps {
  onSelect: (method: 'stripe' | 'bitcoin') => void;
  selectedMethod?: 'stripe' | 'bitcoin';
}

export function PaymentMethodSelector({ onSelect, selectedMethod }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-mono text-white mb-4">Choose Payment Method</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stripe Option */}
        <Card 
          className={`cursor-pointer transition-all hover:scale-105 ${
            selectedMethod === 'stripe' 
              ? 'border-matrix bg-matrix/10' 
              : 'border-gray-600 hover:border-electric'
          }`}
          onClick={() => onSelect('stripe')}
        >
          <CardContent className="p-6 text-center">
            <CreditCard size={40} className="mx-auto mb-3 text-matrix" />
            <h4 className="font-mono font-bold text-white mb-2">Credit Card</h4>
            <p className="text-sm text-gray-400 mb-4">
              Pay with Visa, Mastercard, or other credit cards
            </p>
            <div className="flex justify-center items-center gap-2">
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">VISA</span>
              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">MC</span>
              <span className="text-xs bg-blue-800 text-white px-2 py-1 rounded">AMEX</span>
            </div>
          </CardContent>
        </Card>

        {/* Bitcoin Option */}
        <Card 
          className={`cursor-pointer transition-all hover:scale-105 ${
            selectedMethod === 'bitcoin' 
              ? 'border-amber-500 bg-amber-500/10' 
              : 'border-gray-600 hover:border-amber-500'
          }`}
          onClick={() => onSelect('bitcoin')}
        >
          <CardContent className="p-6 text-center">
            <Bitcoin size={40} className="mx-auto mb-3 text-amber-500" />
            <h4 className="font-mono font-bold text-white mb-2">Bitcoin</h4>
            <p className="text-sm text-gray-400 mb-4">
              Pay with Bitcoin Lightning or on-chain
            </p>
            <div className="flex justify-center items-center gap-2">
              <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded flex items-center gap-1">
                <Zap size={12} />
                Lightning
              </span>
              <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded flex items-center gap-1">
                <Bitcoin size={12} />
                On-chain
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedMethod && (
        <div className="text-center mt-6">
          <Button
            className="bg-gradient-to-r from-matrix to-electric text-black font-mono font-bold px-8"
            onClick={() => {}}
          >
            Continue with {selectedMethod === 'stripe' ? 'Credit Card' : 'Bitcoin'}
          </Button>
        </div>
      )}
    </div>
  );
}