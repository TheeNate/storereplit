import { Link, useLocation } from "wouter";
import { ShoppingCart, Bitcoin, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const [location] = useLocation();

  const navigation = [
    { name: "PRODUCTS", href: "/" },
    { name: "CUSTOM", href: "/create" },
    { name: "ADMIN", href: "/admin" },
  ];

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
            <Button className="cyber-border hover:shadow-neon-green font-mono">
              <ShoppingCart className="mr-2" size={16} />
              CART
            </Button>
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
