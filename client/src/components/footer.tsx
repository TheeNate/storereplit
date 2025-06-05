import { Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-darker-surface border-t border-matrix/30 py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-display font-bold text-matrix mb-4">BTC GLASS</h3>
            <p className="text-gray-400 font-mono mb-6 max-w-md">
              AS IF YOU DIDN'T ALREADY HAVE ENOUGHT STUFF WITH BITCOIN ON IT...
            </p>
            <div className="flex space-x-4">
              <a href="https://x.com/TheeeNate" target="_blank" rel="noopener noreferrer">
                <Twitter className="text-electric hover:text-white cursor-pointer transition-colors" size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-matrix font-mono font-bold mb-4">NAVIGATION</h4>
            <ul className="space-y-2 font-mono text-sm">
              <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Products</a></li>
              <li><a href="/create" className="text-gray-400 hover:text-white transition-colors">Custom Design</a></li>
              
              
            </ul>
          </div>

          <div>
            <h4 className="text-matrix font-mono font-bold mb-4">CONTACT</h4>
            <ul className="space-y-2 font-mono text-sm">
              <li className="text-gray-400">theee@btcglass.store</li>
              
              <li className="text-gray-400"></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-matrix/30 mt-8 pt-8 text-center">
          <p className="text-gray-500 font-mono text-xs">
             Built for the digital revolution. Code is law.
          </p>
        </div>
      </div>
    </footer>
  );
}
