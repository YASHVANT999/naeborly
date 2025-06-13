import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, TrendingUp, Mail, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

const SalesDashboard = () => {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch invitations data
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['/api/invitations'],
    enabled: !!user
  });

  // Fetch calls data
  const { data: calls, isLoading: callsLoading } = useQuery({
    queryKey: ['/api/calls'],
    enabled: !!user
  });

  if (!user || user.role !== 'sales_rep') {
    setLocation('/');
    return null;
  }

  const stats = {
    totalInvitations: Array.isArray(invitations) ? invitations.length : 0,
    acceptedInvitations: Array.isArray(invitations) ? invitations.filter((inv: any) => inv.status === 'accepted').length : 0,
    scheduledCalls: Array.isArray(calls) ? calls.filter((call: any) => call.status === 'scheduled').length : 0,
    completedCalls: Array.isArray(calls) ? calls.filter((call: any) => call.status === 'completed').length : 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">{user.role.replace('_', ' ')}</Badge>
              <Button onClick={logout} variant="outline">Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvitations}</div>
              <p className="text-xs text-muted-foreground">Sent to decision makers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.acceptedInvitations}</div>
              <p className="text-xs text-muted-foreground">Invitations accepted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Calls</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduledCalls}</div>
              <p className="text-xs text-muted-foreground">Upcoming meetings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCalls}</div>
              <p className="text-xs text-muted-foreground">Calls finished</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Invitations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Invitations</CardTitle>
                  <CardDescription>Your latest invitation activity</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Invitation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : Array.isArray(invitations) && invitations.length > 0 ? (
                <div className="space-y-4">
                  {invitations.slice(0, 5).map((invitation: any) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{invitation.recipientEmail}</p>
                        <p className="text-sm text-gray-500">{invitation.subject}</p>
                      </div>
                      <Badge 
                        variant={
                          invitation.status === 'accepted' ? 'default' :
                          invitation.status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {invitation.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No invitations sent yet</p>
                  <Button className="mt-4" size="sm">Send Your First Invitation</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Calls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Calls</CardTitle>
                  <CardDescription>Your scheduled meetings</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Call
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {callsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : Array.isArray(calls) && calls.length > 0 ? (
                <div className="space-y-4">
                  {calls.filter((call: any) => call.status === 'scheduled').slice(0, 5).map((call: any) => (
                    <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{call.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(call.scheduledAt).toLocaleDateString()} at {new Date(call.scheduledAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Phone className="h-4 w-4 mr-2" />
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming calls</p>
                  <Button className="mt-4" size="sm" variant="outline">Schedule Your First Call</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;