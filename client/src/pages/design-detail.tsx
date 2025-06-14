import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Design, SizeOption } from "@shared/schema";
import { useCart } from "@/lib/cart";

export default function DesignDetail() {
  const params = useParams();
  const designId = parseInt(params.id || "0");
  const { toast } = useToast();
  const { addToCart, totalItems } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { data: design, isLoading: designLoading } = useQuery<Design>({
    queryKey: [`/api/designs/${designId}`],
    enabled: !!designId,
  });

  const { data: sizeOptions, isLoading: sizesLoading } = useQuery<SizeOption[]>(
    {
      queryKey: ["/api/size-options"],
    },
  );

  const handleAddToCart = async (sizeOptionId: number) => {
    if (!design || !sizeOptions) return;

    const selectedSize = sizeOptions.find(s => s.id === sizeOptionId);
    if (!selectedSize) return;

    setIsAddingToCart(true);
    
    try {
      addToCart({
        designId: design.id,
        sizeOptionId: selectedSize.id,
        designTitle: design.title,
        designImage: design.imageUrl || "/placeholder-image.jpg",
        sizeOptionName: selectedSize.name,
        price: selectedSize.price,
        quantity: 1,
      });

      toast({
        title: "Added to Cart!",
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

  if (designLoading || sizesLoading) {
    return (
      <main className="min-h-screen bg-dark-surface text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-700 rounded w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="h-96 bg-gray-700 rounded"></div>
              <div className="space-y-6">
                <div className="h-12 bg-gray-700 rounded"></div>
                <div className="h-24 bg-gray-700 rounded"></div>
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!design) {
    return (
      <main className="min-h-screen bg-dark-surface text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-display font-bold text-electric">
              DESIGN NOT FOUND
            </h1>
            <p className="text-gray-400 font-mono text-lg">
              The design you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105">
                <ArrowLeft className="mr-2" size={20} />
                BACK TO GALLERY
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-matrix hover:text-electric">
              <ArrowLeft className="mr-2" size={20} />
              Back to Gallery
            </Button>
          </Link>
          
          {totalItems > 0 && (
            <Link to="/cart">
              <Button className="bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105">
                <ShoppingCart className="mr-2" size={20} />
                VIEW CART ({totalItems})
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Design Image */}
          <div className="relative">
            <img
              src={design.imageUrl || "/placeholder-image.jpg"}
              alt={design.title}
              className="w-full h-auto rounded-lg border border-matrix/30 shadow-cyber"
            />
            <div className="absolute top-4 left-4">
              <Badge variant="outline" className="bg-dark-surface/80 text-matrix border-matrix">
                PREMIUM GLASS ART
              </Badge>
            </div>
          </div>

          {/* Design Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-display font-bold text-electric mb-4">
                {design.title}
              </h1>
              <p className="text-gray-300 font-mono text-lg leading-relaxed">
                {design.description}
              </p>
            </div>

            {/* Size Options */}
            <div className="space-y-6">
              <h2 className="text-2xl font-display font-bold text-white">
                SELECT SIZE
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {sizeOptions?.map((sizeOption) => (
                  <Card
                    key={sizeOption.id}
                    className="glass-morphism border-matrix/30 hover:border-matrix transition-all cursor-pointer group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="text-xl font-mono font-bold text-white group-hover:text-matrix transition-colors">
                            {sizeOption.name}
                          </h3>
                          <p className="text-gray-400 font-mono text-sm">
                            {sizeOption.size}
                          </p>
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="text-matrix border-matrix">
                              ${sizeOption.price}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleAddToCart(sizeOption.id)}
                          disabled={isAddingToCart}
                          className="bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105 px-6 py-3"
                        >
                          <Plus className="mr-2" size={20} />
                          {isAddingToCart ? "ADDING..." : "ADD TO CART"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Cart Navigation */}
            {totalItems > 0 && (
              <Card className="glass-morphism border-matrix/50">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <ShoppingCart className="text-matrix" size={24} />
                    <span className="text-white font-mono text-lg">
                      {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
                    </span>
                  </div>
                  
                  <Link to="/cart">
                    <Button className="w-full py-4 bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105">
                      <ShoppingCart className="mr-2" size={20} />
                      PROCEED TO CHECKOUT
                    </Button>
                  </Link>
                  
                  <p className="text-gray-400 font-mono text-sm">
                    Secure checkout with shipping calculation
                  </p>
                </CardContent>
              </Card>
            )}

            
          </div>
        </div>
      </div>
    </main>
  );
}