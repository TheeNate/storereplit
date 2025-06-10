import { Brain, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Create() {
  return (
    <main className="pt-20 py-20 px-6 bg-gradient-to-b from-deep-black to-darker-surface">
      <div className="container mx-auto max-w-4xl text-center">
        <Card className="glass-morphism">
          <CardContent className="p-12">
            <Brain className="text-6xl text-electric mb-8 animate-pulse-neon mx-auto" />
            <h2 className="text-5xl font-display font-bold mb-8">
              <span className="text-cyber-pink">CUSTOM DESIGN</span> 
            </h2>
            <div className="bg-darker-surface rounded-xl p-8 font-mono text-left max-w-2xl mx-auto">
              <p className="text-matrix text-lg mb-4">
                <i className="fas fa-terminal mr-2"></i>btc-glass@-studio:~$ initialize_custom_designer
              </p>
              <p className="text-white mb-4">
                🧠 Coming Soon: Design your own Custom Piece! 
              </p>
              <p className="text-gray-400 mb-4">
                &gt; Loading neural networks...
              </p>
              <p className="text-gray-400 mb-4">
                &gt; Calibrating glass synthesis algorithms...
              </p>
              <p className="text-electric">
                &gt; Making more stuff with bitcoin on it...
              </p>
              <p className="text-electric">
                &gt; Have your own design? Shoot us an email, we can make it!
              </p>
              
          
              <div className="mt-6 flex items-center">
                <span className="text-matrix mr-2">●</span>
                <span className="text-white animate-pulse">System initializing...</span>
              </div>
            </div>
            
            <Button 
              className="mt-8 px-8 py-4 cyber-border hover:shadow-neon-pink transition-all font-mono" 
              disabled
            >
              <Lock className="mr-2" size={20} />
              NOTIFY ME WHEN READY
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
