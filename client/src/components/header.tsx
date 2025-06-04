import { Link, useLocation } from "wouter";
import { ShoppingCart, Bitcoin, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

export function Header() {
  const [location] = useLocation();
  const [cartItems] = useState<any[]>([]); // This would normally come from a cart context/store

  const navigation = [
    { name: "PRODUCTS", href: "/" },
    { name: "CUSTOM", href: "/create" },
  ];

  const CartDropdown = () => (
    <div className="w-80 max-h-96 overflow-y-auto">
      {cartItems.length === 0 ? (
        <div className="p-6 text-center">
          <ShoppingCart className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-400 font-mono">Your cart is empty</p>
          <p className="text-gray-500 font-mono text-sm mt-2">
            Browse our glass art collection to get started
          </p>
        </div>
      ) : (
        <div className="p-4">
          <div className="space-y-4 mb-4">
            {cartItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-darker-surface rounded-lg">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="text-white font-mono text-sm">{item.name}</h4>
                  <p className="text-gray-400 font-mono text-xs">{item.size}</p>
                </div>
                <div className="text-right">
                  <p className="text-matrix font-mono text-sm">${item.price}</p>
                  <p className="text-gray-400 font-mono text-xs">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-matrix/30 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-mono">Total:</span>
              <span className="text-matrix font-mono text-lg font-bold">
                ${cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
              </span>
            </div>
            <Button className="w-full cyber-border text-matrix border-matrix hover:bg-matrix hover:text-black font-mono">
              CHECKOUT
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="fixed top-0 w-full z-50 glass-morphism border-b border-matrix/30">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-4">
            <h1 className="text-3xl font-display font-bold text-matrix glitch-text" data-text="BTC GLASS">
              BTC GLASS
            </h1>
            <Bitcoin className="text-electric animate-pulse-neon" size={24} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`hover:text-matrix transition-colors font-mono ${
                  location === item.href ? "text-matrix" : "text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button className="cyber-border hover:shadow-neon-green font-mono relative">
                  <ShoppingCart className="mr-2" size={16} />
                  CART
                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-matrix text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="glass-morphism border-matrix/30" align="end">
                <CartDropdown />
              </PopoverContent>
            </Popover>
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-matrix">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-dark-surface border-matrix/30">
              <div className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-white hover:text-matrix transition-colors font-mono text-lg"
                  >
                    {item.name}
                  </Link>
                ))}
                <Button className="cyber-border hover:shadow-neon-green font-mono mt-4">
                  <ShoppingCart className="mr-2" size={16} />
                  CART
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
