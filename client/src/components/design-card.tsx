import { Link } from "wouter";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Design, SizeOption } from "@shared/schema";

interface DesignCardProps {
  design: Design;
  hoverColor?: "green" | "pink" | "blue";
}

export function DesignCard({ design, hoverColor = "green" }: DesignCardProps) {
  const hoverClasses = {
    green:
      "hover:shadow-neon-green group-hover:text-matrix group-hover:border-matrix",
    pink: "hover:shadow-neon-pink group-hover:text-cyber-pink group-hover:border-cyber-pink",
    blue: "hover:shadow-neon-blue group-hover:text-electric group-hover:border-electric",
  };

  const { data: sizeOptions } = useQuery<SizeOption[]>({
    queryKey: ["/api/size-options"],
  });



  return (
    <Link href={`/design/${design.id}`} className="block">
      <Card
        className={`group glass-morphism ${hoverClasses[hoverColor]} transition-all duration-500 transform hover:-translate-y-2 cursor-pointer`}
      >
        <CardContent className="p-6">
        <div className="relative mb-6">
          <img
            src={design.imageUrl}
            alt={design.title}
            className="w-full h-64 object-cover rounded-lg group-hover:scale-105 transition-transform"
          />

        </div>

        <div className="space-y-4">
          <h3
            className={`text-2xl font-display font-bold text-white ${hoverClasses[hoverColor].split(" ")[1]} transition-colors`}
          >
            {design.title}
          </h3>
          <p className="text-gray-400 font-mono text-sm line-clamp-3">
            {design.description}
          </p>

          {/* Pricing Preview */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {sizeOptions && sizeOptions.length > 0 ? (
              sizeOptions.map((sizeOption, index) => {
                const colorClasses = [
                  "bg-darker-surface text-electric",    // 6" - blue text (visible)
                  "bg-darker-surface text-matrix",      // 12" - green text (visible)
                  "bg-darker-surface text-electric",      // 15" - blue text (visible)  
                  "bg-darker-surface text-matrix"     // 10" - green text (visible)
                ];
                const colorClass = colorClasses[index] || "bg-darker-surface text-white";
                
                return (
                  <div key={sizeOption.id} className={`${colorClass} rounded p-2`}>
                    <p className="font-mono text-sm font-bold">{sizeOption.size}</p>
                    <p className="text-xs">${sizeOption.price}</p>
                  </div>
                );
              })
            ) : (
              // Loading fallback showing 4 placeholder boxes
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-darker-surface rounded p-2">
                  <p className="text-gray-400 font-mono text-sm font-bold">--</p>
                  <p className="text-gray-400 text-xs">Loading...</p>
                </div>
              ))
            )}
          </div>

        </div>
        </CardContent>
      </Card>
    </Link>
  );
}
