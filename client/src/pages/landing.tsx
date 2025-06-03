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
            data-text="GLASS ART"
          >
            <span className="text-white">GLASS</span>
            <span className="text-matrix"> ART</span>
          </h2>
          <h3 className="text-2xl md:text-4xl font-mono text-electric mb-8">
            FOR THE <span className="text-cyber-pink">DIGITAL</span> REVOLUTION
          </h3>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Choose from our curated collection of Bitcoin and
            blockchain-inspired designs. Each piece is available in three
            premium sizes and handcrafted to perfection.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              className="px-8 py-4 bg-matrix text-black font-mono font-bold rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
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

          {/* Size & Pricing Preview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-darker-surface rounded-lg p-6 border border-matrix/30 hover:border-matrix transition-all">
              <h4 className="text-matrix font-mono font-bold text-lg mb-2">
                6" COMPACT
              </h4>
              <p className="text-3xl font-bold text-white mb-2">$149</p>
              <p className="text-gray-400 text-sm">Perfect for desk display</p>
            </div>
            <div className="bg-darker-surface rounded-lg p-6 border border-electric/30 hover:border-electric transition-all">
              <h4 className="text-electric font-mono font-bold text-lg mb-2">
                12" MEDIUM
              </h4>
              <p className="text-3xl font-bold text-white mb-2">$299</p>
              <p className="text-gray-400 text-sm">Great for wall mounting</p>
            </div>
            <div className="bg-darker-surface rounded-lg p-6 border border-cyber-pink/30 hover:border-cyber-pink transition-all">
              <h4 className="text-cyber-pink font-mono font-bold text-lg mb-2">
                15" STATEMENT
              </h4>
              <p className="text-3xl font-bold text-white mb-2">$449</p>
              <p className="text-gray-400 text-sm">Large centerpiece</p>
            </div>
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
              Each design tells a story of the digital revolution. Choose your
              favorite and select your perfect size.
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
                  Our AI-powered custom design tool is coming soon. Get notified
                  when it launches!
                </p>
                <Button className="px-8 py-4 cyber-border hover:shadow-neon-pink font-mono">
                  <Palette className="mr-2" size={20} />
                  NOTIFY ME - CUSTOM DESIGNS
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-3xl font-display font-bold text-matrix mb-4">
                No Designs Available
              </h3>
              <p className="text-gray-400 font-mono mb-8">
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
