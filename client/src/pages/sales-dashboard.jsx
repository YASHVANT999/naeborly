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
  Loader2,
  User,
  Clock,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CalendarBooking from "@/components/CalendarBooking";
import FlagsBadge from "@/components/FlagsBadge";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Responsive Dashboard Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Rep Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome back, {user?.firstName}!</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">
                {getPackageDisplayName(user?.packageType)}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 text-xs sm:text-sm">
                {metrics?.standing === 'good' ? 'Good Standing' : 'Standing: ' + metrics?.standing}
              </Badge>
              <FlagsBadge />
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <TrendingUp className="mr-2" size={16} />
                  Analytics
                </Button>
                <Button variant="ghost" size="sm">
                  <Users className="mr-2" size={16} />
                  Profile
                </Button>
              </div>
              {/* Mobile Menu Button */}
              <div className="sm:hidden">
                <Button variant="ghost" size="sm">
                  <Menu size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
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

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Responsive Database Access Section */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {!databaseUnlocked ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="text-blue-500 mr-3" size={24} />
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
                                invitation.status === 'accepted' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
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
                      className="bg-blue-600 hover:bg-blue-700"
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

          {/* Responsive Sidebar */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Calendar Booking System */}
            <CalendarBooking />
            
            {/* Upcoming Calls Calendar View */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Calendar className="text-blue-500 mr-3" size={20} />
                    Upcoming Calls
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {calls?.length > 0 ? (
                  <div className="space-y-4">
                    {/* Today's Calls */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Today
                      </h4>
                      <div className="space-y-2">
                        {calls.filter(call => {
                          const today = new Date().toDateString();
                          const callDate = new Date(call.scheduledAt).toDateString();
                          return today === callDate;
                        }).map((call) => (
                          <div key={call.id} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                            <div className="flex-shrink-0 mr-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-green-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-green-900 truncate">
                                {call.decisionMakerName || 'Decision Maker'}
                              </p>
                              <div className="flex items-center text-sm text-green-700">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(call.scheduledAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </div>
                              {call.agenda && (
                                <p className="text-xs text-green-600 truncate mt-1">
                                  {call.agenda}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              {call.meetingLink ? (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 px-3">
                                  Join
                                </Button>
                              ) : (
                                <Badge className="bg-green-100 text-green-800">
                                  {call.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tomorrow's Calls */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Tomorrow
                      </h4>
                      <div className="space-y-2">
                        {calls.filter(call => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const tomorrowDate = tomorrow.toDateString();
                          const callDate = new Date(call.scheduledAt).toDateString();
                          return tomorrowDate === callDate;
                        }).map((call) => (
                          <div key={call.id} className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                            <div className="flex-shrink-0 mr-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-blue-900 truncate">
                                {call.decisionMakerName || 'Decision Maker'}
                              </p>
                              <div className="flex items-center text-sm text-blue-700">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(call.scheduledAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </div>
                              {call.agenda && (
                                <p className="text-xs text-blue-600 truncate mt-1">
                                  {call.agenda}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              <Badge className="bg-blue-100 text-blue-800">
                                {call.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* This Week's Calls */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        This Week
                      </h4>
                      <div className="space-y-2">
                        {calls.filter(call => {
                          const today = new Date();
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const weekEnd = new Date();
                          weekEnd.setDate(weekEnd.getDate() + 7);
                          
                          const callDate = new Date(call.scheduledAt);
                          const todayStr = today.toDateString();
                          const tomorrowStr = tomorrow.toDateString();
                          const callStr = callDate.toDateString();
                          
                          return callDate > tomorrow && callDate <= weekEnd && 
                                 callStr !== todayStr && callStr !== tomorrowStr;
                        }).map((call) => (
                          <div key={call.id} className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                            <div className="flex-shrink-0 mr-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-purple-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-purple-900 truncate">
                                {call.decisionMakerName || 'Decision Maker'}
                              </p>
                              <div className="flex items-center text-sm text-purple-700">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(call.scheduledAt).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                                <Clock className="w-3 h-3 ml-2 mr-1" />
                                {new Date(call.scheduledAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </div>
                              {call.agenda && (
                                <p className="text-xs text-purple-600 truncate mt-1">
                                  {call.agenda}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              <Badge className="bg-purple-100 text-purple-800">
                                {call.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <CalendarPlus className="w-4 h-4 mr-2" />
                          Schedule Call
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Calendar className="w-4 h-4 mr-2" />
                          View Calendar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarPlus className="text-gray-400" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No calls scheduled</h3>
                    <p className="text-gray-500 mb-6 text-sm">
                      Start booking meetings with decision makers to see your schedule here.
                    </p>
                    <div className="space-y-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Book Your First Call
                      </Button>
                      <div className="text-xs text-gray-400">
                        Use the calendar booking system to schedule meetings
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
