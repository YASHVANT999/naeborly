import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import SalesDashboard from "@/pages/sales-dashboard";
import DecisionDashboard from "@/pages/decision-dashboard";
import CallFeedback from "@/pages/call-feedback";
import PostCallEvaluation from "@/pages/post-call-evaluation";
import AdminDashboard from "@/pages/admin-dashboard";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/sales-dashboard" component={SalesDashboard} />
          <Route path="/decision-dashboard" component={DecisionDashboard} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/call-feedback" component={CallFeedback} />
          <Route path="/post-call-evaluation" component={PostCallEvaluation} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
