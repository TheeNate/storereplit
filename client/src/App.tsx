import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Landing from "@/pages/landing";
import ProductDetail from "@/pages/product-detail";
import DesignDetail from "@/pages/design-detail";
import Success from "@/pages/success";
import Create from "@/pages/create";
import Admin from "@/pages/admin";
import Cart from "@/pages/cart";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-deep-black text-white flex flex-col">
      <Header />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/design/:id" component={DesignDetail} />
          <Route path="/cart" component={Cart} />
          <Route path="/success" component={Success} />
          <Route path="/create" component={Create} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
