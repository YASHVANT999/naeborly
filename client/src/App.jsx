import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import SalesDashboard from "@/pages/sales-dashboard";
import DecisionDashboard from "@/pages/decision-dashboard";
import PostCallEvaluation from "@/pages/post-call-evaluation";
import CallFeedback from "@/pages/call-feedback";
import AdminPanel from "@/pages/admin-panel";
import SuperAdminLogin from "@/pages/super-admin-login";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import EnterpriseAdmin from "@/pages/enterprise-admin";
import EnterpriseProtectedRoute from "@/components/EnterpriseProtectedRoute";
import PersonalInfo from "@/pages/signup/personal-info";
import ProfessionalBackground from "@/pages/signup/professional-background";
import AvailabilityPreferences from "@/pages/signup/availability-preferences";
import NominateSalesRep from "@/pages/signup/nominate-sales-rep";
import ChoosePackage from "@/pages/signup/choose-package";
import SalesRepPersonalInfo from "@/pages/signup/sales-rep/personal-info";
import SalesRepProfessionalInfo from "@/pages/signup/sales-rep/professional-info";
import InviteDecisionMakers from "@/pages/signup/sales-rep/invite-decision-makers";
import SalesRepChoosePackage from "@/pages/signup/sales-rep/choose-package";
import DecisionMakerPersonalInfo from "@/pages/signup/decision-maker/personal-info";
import DecisionMakerProfessionalInfo from "@/pages/signup/decision-maker/professional-info";
import DecisionMakerAvailability from "@/pages/signup/decision-maker/availability";
import DecisionMakerNominate from "@/pages/signup/decision-maker/nominate";
import DecisionMakerChoosePackage from "@/pages/signup/decision-maker/package";
import TestSignup from "@/pages/test-signup";
import FlagsManagement from "@/pages/flags-management";
import RoleSelector from "@/pages/role-selector";
import SalesRepOnboarding from "@/pages/sales-rep-onboarding";
import DecisionMakerOnboarding from "@/pages/decision-maker-onboarding";
import DMInviteLanding from "@/pages/dm-invite-landing";
import DMInviteSystem from "@/pages/dm-invite-system";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/role-selector" component={RoleSelector} />
      <Route path="/sales-rep/onboarding" component={SalesRepOnboarding} />
      <Route path="/decision-maker/onboarding" component={DecisionMakerOnboarding} />
      <Route path="/invite-decision-makers" component={DMInviteLanding} />
      <Route path="/sales-dashboard">
        <ProtectedRoute requiredRole="sales_rep">
          <SalesDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/decision-dashboard">
        <ProtectedRoute requiredRole="decision_maker">
          <DecisionDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          <AdminPanel />
        </ProtectedRoute>
      </Route>
      <Route path="/super-admin/login" component={SuperAdminLogin} />
      <Route path="/super-admin/dashboard">
        <ProtectedRoute requiredRole="super_admin">
          <SuperAdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/enterprise-admin">
        <EnterpriseProtectedRoute>
          <EnterpriseAdmin />
        </EnterpriseProtectedRoute>
      </Route>
      <Route path="/evaluation/rep" component={PostCallEvaluation} />
      <Route path="/evaluation/dm" component={CallFeedback} />
      <Route path="/flags">
        <ProtectedRoute>
          <FlagsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/signup/personal" component={PersonalInfo} />
      <Route path="/signup/professional" component={ProfessionalBackground} />
      <Route path="/signup/availability" component={AvailabilityPreferences} />
      <Route path="/signup/nominate" component={NominateSalesRep} />
      <Route path="/signup/package" component={ChoosePackage} />
      <Route path="/signup/sales-rep/personal-info" component={SalesRepPersonalInfo} />
      <Route path="/signup/sales-rep/professional-info" component={SalesRepProfessionalInfo} />
      <Route path="/signup/sales-rep/invites" component={InviteDecisionMakers} />
      <Route path="/signup/sales-rep/package" component={SalesRepChoosePackage} />
      <Route path="/signup/decision-maker/personal-info" component={DecisionMakerPersonalInfo} />
      <Route path="/signup/decision-maker/professional-info" component={DecisionMakerProfessionalInfo} />
      <Route path="/signup/decision-maker/availability" component={DecisionMakerAvailability} />
      <Route path="/signup/decision-maker/nominate" component={DecisionMakerNominate} />
      <Route path="/signup/decision-maker/package" component={DecisionMakerChoosePackage} />
      <Route path="/test-signup" component={TestSignup} />
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
