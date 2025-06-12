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

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Landing />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <NotFound />;
  }
  
  return <Component />;
}

function Router() {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={() => isAuthenticated ? (
        user?.role === 'admin' ? <AdminDashboard /> :
        user?.role === 'sales_rep' ? <SalesDashboard /> :
        <DecisionDashboard />
      ) : <Landing />} />
      <Route path="/sales-dashboard" component={() => 
        <ProtectedRoute component={SalesDashboard} allowedRoles={['sales_rep']} />
      } />
      <Route path="/decision-dashboard" component={() => 
        <ProtectedRoute component={DecisionDashboard} allowedRoles={['decision_maker']} />
      } />
      <Route path="/admin-dashboard" component={() => 
        <ProtectedRoute component={AdminDashboard} allowedRoles={['admin']} />
      } />
      <Route path="/call-feedback" component={() => 
        <ProtectedRoute component={CallFeedback} />
      } />
      <Route path="/post-call-evaluation" component={() => 
        <ProtectedRoute component={PostCallEvaluation} />
      } />
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
