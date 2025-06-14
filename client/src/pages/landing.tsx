import { useQuery } from "@tanstack/react-query";
import { Rocket, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesignCard } from "@/components/design-card";
import type { Design } from "@shared/schema";

export default function Landing() {
  const { data: designs, isLoading } = useQuery<Design[]>({
    queryKey: ["/api/designs"],
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
          <h2
            className="text-6xl md:text-8xl font-display font-black mb-6 glitch-text animate-float"
            data-text="BTC GLASS"
          >
            <span className="text-white">BTC</span>
            <span className="text-matrix"> GLASS</span>
          </h2>
          <h3 className="text-2xl md:text-4xl font-mono text-electric mb-8">
            FOR THE <span className="text-cyber-pink">DIGITAL</span> REVOLUTION
          </h3>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Stained Glass Style Wall or Window Hangings. Bringing image generation off of the screen and into reality!
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              className="px-8 py-4 bg-[#00FF88] text-black font-mono font-bold rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"

              onClick={() =>
                document
                  .getElementById("designs")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Rocket className="mr-2" size={20} />
              BROWSE DESIGNS
            </Button>
            <Button className="px-8 py-4 cyber-border hover:shadow-neon-green font-mono">
              <Palette className="mr-2" size={20} />
              CUSTOM DESIGN
            </Button>
          </div>
  
        </div>

        {/* Floating geometric elements */}
        <div className="absolute top-1/4 left-10 w-16 h-16 border border-electric rotate-45 animate-float opacity-30" />
        <div
          className="absolute bottom-1/4 right-10 w-12 h-12 border border-cyber-pink rotate-12 animate-float opacity-30"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-8 h-8 border border-matrix rotate-45 animate-float opacity-30"
          style={{ animationDelay: "4s" }}
        />
      </section>

      {/* Designs Gallery Section */}
      <section id="designs" className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-display font-bold mb-6">
              <span className="text-matrix">DESIGN</span> COLLECTION
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-mono">
              
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="glass-morphism rounded-xl p-6 animate-pulse"
                >
                  <div className="w-full h-64 bg-gray-700 rounded-lg mb-6" />
                  <div className="h-6 bg-gray-700 rounded mb-4" />
                  <div className="h-4 bg-gray-700 rounded mb-4" />
                  <div className="h-8 bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          ) : designs && designs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {designs.map((design, index) => (
                  <DesignCard
                    key={design.id}
                    design={design}
                    hoverColor={getHoverColor(index)}
                  />
                ))}
              </div>

              {/* Call to Action */}
              <div className="text-center mt-16">
                <h3 className="text-3xl font-display font-bold text-white mb-4">
                  Don't see what you're looking for?
                </h3>
                <p className="text-gray-400 font-mono mb-8">
                  New designs added weekly. Check back soon for more!
                  Think you have a cooler design? You probably do. Email us, we can make it!
                </p>
                <p className="text-gray-400 font-mono mb-8">
                   Custom generation coming soon! I'm vibe coding, not a dev, gimme a minute!
                </p>
                {/* <Button className="px-8 py-4 cyber-border hover:shadow-neon-pink font-mono">
                  <Palette className="mr-2" size={20} />
                  NOTIFY ME - CUSTOM DESIGNS
                </Button> */}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-3xl font-display font-bold text-matrix mb-4">
                No Designs Available
              </h3>
              <p className="text-pink-400 font-mono mb-8">
                Designs are being uploaded. Check back soon for our amazing
                collection!
              </p>
              <Button className="cyber-border font-mono">REFRESH PAGE</Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
