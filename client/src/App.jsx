import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Landing from "@/pages/landing";
import SalesDashboard from "@/pages/sales-dashboard";
import DecisionDashboard from "@/pages/decision-dashboard";
import PostCallEvaluation from "@/pages/post-call-evaluation";
import CallFeedback from "@/pages/call-feedback";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/sales-dashboard" component={SalesDashboard} />
      <Route path="/decision-dashboard" component={DecisionDashboard} />
      <Route path="/evaluation/rep" component={PostCallEvaluation} />
      <Route path="/evaluation/dm" component={CallFeedback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen">
          <Navigation />
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
