import { Link } from "wouter";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Design } from "@shared/schema";

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

  const categoryColors = {
    bitcoin: "bg-matrix text-black",
    ethereum: "bg-electric text-black",
    blockchain: "bg-cyber-pink text-black",
    cypherpunk: "bg-white text-black",
    custom: "bg-gray-500 text-white",
  };

  const categoryColor =
    categoryColors[design.category as keyof typeof categoryColors] ||
    categoryColors.custom;

  return (
    <Card
      className={`group glass-morphism ${hoverClasses[hoverColor]} transition-all duration-500 transform hover:-translate-y-2`}
    >
      <CardContent className="p-6">
        <div className="relative mb-6">
          <img
            src={design.imageUrl}
            alt={design.title}
            className="w-full h-64 object-cover rounded-lg group-hover:scale-105 transition-transform"
          />
          <Badge
            className={`absolute top-2 right-2 font-mono text-xs ${categoryColor}`}
          >
            {design.category?.toUpperCase()}
          </Badge>
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
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-darker-surface rounded p-2">
              <p className="text-matrix font-mono text-sm font-bold">6"</p>
              <p className="text-white text-xs">$149</p>
            </div>
            <div className="bg-darker-surface rounded p-2">
              <p className="text-electric font-mono text-sm font-bold">12"</p>
              <p className="text-white text-xs">$299</p>
            </div>
            <div className="bg-darker-surface rounded p-2">
              <p className="text-cyber-pink font-mono text-sm font-bold">15"</p>
              <p className="text-white text-xs">$449</p>
            </div>
          </div>

          <Link href={`/design/${design.id}`}>
            <Button
              className={`w-full cyber-border ${hoverClasses[hoverColor]} font-mono`}
            >
              <Palette className="mr-2" size={16} />
              SELECT SIZE & ORDER
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
