import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Users, 
  Calendar, 
  Plus, 
  TrendingUp,
  Lock,
  CalendarPlus,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SalesDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sales rep's invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ['/api/sales-rep/invitations'],
    enabled: !!user?.id
  });

  // Fetch sales rep's calls
  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['/api/sales-rep/calls'],
    enabled: !!user?.id
  });

  // Fetch sales rep's metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/sales-rep/metrics'],
    enabled: !!user?.id
  });

  const simulateAcceptanceMutation = useMutation({
    mutationFn: async () => {
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/invitations'] });
      toast({
        title: "Database Unlocked!",
        description: "You can now browse decision makers",
      });
    }
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-800">Declined</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPackageDisplayName = (packageType) => {
    const packageNames = {
      'free': 'Free • 1 DM/month',
      'pro': 'Pro • 10 DM/month',
      'pro-team': 'Pro Team • 50 DM/month',
      'enterprise': 'Enterprise • 500 DM/month'
    };
    return packageNames[packageType] || 'Free • 1 DM/month';
  };

  if (!user || metricsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const databaseUnlocked = metrics?.databaseUnlocked || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Rep Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800">{getPackageDisplayName(user?.packageType)}</Badge>
              <Badge className="bg-blue-100 text-blue-800">{metrics?.standing === 'good' ? 'Good Standing' : 'Standing: ' + metrics?.standing}</Badge>
              <Button variant="ghost" size="sm">
                <TrendingUp className="mr-2" size={16} />
                Analytics
              </Button>
              <Button variant="ghost" size="sm">
                <Users className="mr-2" size={16} />
                Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Call Credits</p>
                  <p className="text-3xl font-bold">{metrics?.callCredits || 0}</p>
                  <p className="text-purple-100 text-xs">this month</p>
                </div>
                <Phone className="text-purple-200" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">DM Invitations</p>
                  <p className="text-3xl font-bold">{metrics?.dmInvitations || 0}/{metrics?.maxDmInvitations || 1}</p>
                </div>
                <Users className="text-green-200" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Upcoming Calls</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics?.upcomingCalls || 0}</p>
                </div>
                <Calendar className="text-gray-400" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Accepted Invitations</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics?.acceptedInvitations || 0}</p>
                </div>
                <Plus className="text-gray-400" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics?.successRate ? `${metrics.successRate}%` : '-'}</p>
                </div>
                <TrendingUp className="text-gray-400" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Database Access Section */}
          <div className="lg:col-span-2">
            {!databaseUnlocked ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="text-purple-500 mr-3" size={24} />
                    Database Access Locked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Lock className="text-gray-400" size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Waiting for DM Acceptance</h3>
                    <p className="text-gray-600 mb-8">
                      At least one of your invited decision makers must accept to unlock the database.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-6 mb-8">
                      <h4 className="font-semibold text-gray-900 mb-4">Invitation Status:</h4>
                      
                      <div className="space-y-4">
                        {invitations.length > 0 ? invitations.map((invitation) => (
                          <div key={invitation._id || invitation.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                invitation.status === 'accepted' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                              }`}>
                                {getInitials(invitation.decisionMakerName || invitation.name || 'DM')}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{invitation.decisionMakerName || invitation.name || 'Decision Maker'}</p>
                                <p className="text-sm text-gray-500">{invitation.decisionMakerEmail || invitation.email || 'email@example.com'}</p>
                              </div>
                            </div>
                            {getStatusBadge(invitation.status)}
                          </div>
                        )) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No invitations sent yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={() => simulateAcceptanceMutation.mutate()}
                      disabled={simulateAcceptanceMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {simulateAcceptanceMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Simulating...
                        </>
                      ) : (
                        "Simulate DM Acceptance (Demo)"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="text-green-500 mr-3" size={24} />
                    Database Access Unlocked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="text-green-600" size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to the Database!</h3>
                    <p className="text-gray-600 mb-8">
                      You now have access to verified decision makers. Start booking your intro calls.
                    </p>
                    <Button className="bg-green-600 hover:bg-green-700">
                      Browse Decision Makers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Calls */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="text-blue-500 mr-3" size={20} />
                  Upcoming Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CalendarPlus className="text-gray-300 mx-auto mb-4" size={48} />
                  <p className="text-gray-500">No calls scheduled yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
