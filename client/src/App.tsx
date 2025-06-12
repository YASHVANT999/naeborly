import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import SalesDashboard from "@/pages/sales-dashboard";
import DecisionDashboard from "@/pages/decision-dashboard";
import CallFeedback from "@/pages/call-feedback";
import PostCallEvaluation from "@/pages/post-call-evaluation";
import AdminDashboard from "@/pages/admin-dashboard";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      {user?.role === 'sales_rep' && <Route path="/sales-dashboard" component={SalesDashboard} />}
      {user?.role === 'decision_maker' && <Route path="/decision-dashboard" component={DecisionDashboard} />}
      {user?.role === 'admin' && <Route path="/admin-dashboard" component={AdminDashboard} />}
      <Route path="/call-feedback" component={CallFeedback} />
      <Route path="/post-call-evaluation" component={PostCallEvaluation} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
