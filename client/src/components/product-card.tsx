import { Link } from "wouter";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  hoverColor?: "green" | "pink" | "blue";
}

export function ProductCard({ product, hoverColor = "green" }: ProductCardProps) {
  const hoverClasses = {
    green: "hover:shadow-neon-green group-hover:text-matrix group-hover:border-matrix",
    pink: "hover:shadow-neon-pink group-hover:text-cyber-pink group-hover:border-cyber-pink",
    blue: "hover:shadow-neon-blue group-hover:text-electric group-hover:border-electric",
  };

  const priceColor = {
    green: "text-matrix",
    pink: "text-cyber-pink", 
    blue: "text-electric",
  };

  return (
    <Card className={`group glass-morphism ${hoverClasses[hoverColor]} transition-all duration-500 transform hover:-translate-y-2`}>
      <CardContent className="p-6">
        <img 
          src={product.imageUrl} 
          alt={product.title}
          className="w-full h-64 object-cover rounded-lg mb-6 group-hover:scale-105 transition-transform"
        />
        
        <div className="space-y-4">
          <h3 className={`text-2xl font-display font-bold text-white ${hoverClasses[hoverColor].split(' ')[1]} transition-colors`}>
            {product.title}
          </h3>
          <p className="text-gray-400 font-mono text-sm line-clamp-3">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-3xl font-bold font-mono ${priceColor[hoverColor]}`}>
              ${parseFloat(product.price).toFixed(2)}
            </span>
            <span className="text-lg text-gray-400 font-mono">
              USD
            </span>
          </div>
          <Link href={`/product/${product.id}`}>
            <Button className={`w-full cyber-border ${hoverClasses[hoverColor]} font-mono`}>
              <Eye className="mr-2" size={16} />
              VIEW DETAILS
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
