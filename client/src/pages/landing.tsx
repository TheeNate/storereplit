import { useQuery } from "@tanstack/react-query";
import { Rocket, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@shared/schema";

export default function Landing() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const getHoverColor = (index: number) => {
    const colors = ["green", "pink", "blue"] as const;
    return colors[index % 3];
  };

  return (
    <main className="pt-20">
      {/* Matrix Background Effect */}
      <div className="matrix-bg" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Cyberpunk background */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-matrix/5 to-transparent" />
        </div>
        
        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          <h2 className="text-6xl md:text-8xl font-display font-black mb-6 glitch-text animate-float" data-text="GLASS ART">
            <span className="text-white">GLASS</span>
            <span className="text-matrix"> ART</span>
          </h2>
          <h3 className="text-2xl md:text-4xl font-mono text-electric mb-8">
            FOR THE <span className="text-cyber-pink">DIGITAL</span> REVOLUTION
          </h3>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Custom handcrafted glass pieces inspired by Bitcoin, blockchain technology, and the cypherpunk movement. 
            Each piece is a unique artifact of the digital age.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              className="px-8 py-4 bg-matrix text-black font-mono font-bold rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Rocket className="mr-2" size={20} />
              EXPLORE COLLECTION
            </Button>
            <Button className="px-8 py-4 cyber-border hover:shadow-neon-green font-mono">
              <Palette className="mr-2" size={20} />
              CUSTOM DESIGN
            </Button>
          </div>
        </div>

        {/* Floating geometric elements */}
        <div className="absolute top-1/4 left-10 w-16 h-16 border border-electric rotate-45 animate-float opacity-30" />
        <div className="absolute bottom-1/4 right-10 w-12 h-12 border border-cyber-pink rotate-12 animate-float opacity-30" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/4 w-8 h-8 border border-matrix rotate-45 animate-float opacity-30" style={{ animationDelay: '4s' }} />
      </section>

      {/* Products Grid Section */}
      <section id="products" className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-display font-bold mb-6">
              <span className="text-matrix">DIGITAL</span> ARTIFACTS
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-mono">
              Each piece represents a moment in crypto history, crafted with precision and encoded with meaning.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-morphism rounded-xl p-6 animate-pulse">
                  <div className="w-full h-64 bg-gray-700 rounded-lg mb-6" />
                  <div className="h-6 bg-gray-700 rounded mb-4" />
                  <div className="h-4 bg-gray-700 rounded mb-4" />
                  <div className="h-8 bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products?.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  hoverColor={getHoverColor(index)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
