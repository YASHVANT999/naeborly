import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

const DecisionDashboard = () => {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch calls data for decision maker
  const { data: calls, isLoading: callsLoading } = useQuery({
    queryKey: ['/api/calls', { userId: user?.id }],
    enabled: !!user
  });

  if (!user || user.role !== 'decision_maker') {
    setLocation('/');
    return null;
  }

  const stats = {
    totalCalls: Array.isArray(calls) ? calls.length : 0,
    upcomingCalls: Array.isArray(calls) ? calls.filter((call: any) => call.status === 'scheduled').length : 0,
    completedCalls: Array.isArray(calls) ? calls.filter((call: any) => call.status === 'completed').length : 0,
    pendingFeedback: Array.isArray(calls) ? calls.filter((call: any) => call.status === 'completed' && !call.feedback).length : 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Decision Maker Dashboard</h1>
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
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalls}</div>
              <p className="text-xs text-muted-foreground">All time meetings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingCalls}</div>
              <p className="text-xs text-muted-foreground">Scheduled meetings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCalls}</div>
              <p className="text-xs text-muted-foreground">Finished calls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingFeedback}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Calls */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Calls</CardTitle>
              <CardDescription>Your scheduled meetings with sales representatives</CardDescription>
            </CardHeader>
            <CardContent>
              {callsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : Array.isArray(calls) && calls.filter((call: any) => call.status === 'scheduled').length > 0 ? (
                <div className="space-y-4">
                  {calls.filter((call: any) => call.status === 'scheduled').map((call: any) => (
                    <div key={call.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{call.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{call.description}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(call.scheduledAt).toLocaleDateString()}
                            <Clock className="h-4 w-4 ml-3 mr-1" />
                            {new Date(call.scheduledAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            Join Call
                          </Button>
                          <Button size="sm" variant="outline">
                            Reschedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming calls scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Calls & Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
              <CardDescription>Your call history and feedback opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              {callsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : Array.isArray(calls) && calls.filter((call: any) => call.status === 'completed').length > 0 ? (
                <div className="space-y-4">
                  {calls.filter((call: any) => call.status === 'completed').slice(0, 5).map((call: any) => (
                    <div key={call.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{call.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Completed on {new Date(call.completedAt || call.scheduledAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center mt-2">
                            <Badge variant={call.feedback ? "default" : "secondary"}>
                              {call.feedback ? "Feedback Submitted" : "Feedback Pending"}
                            </Badge>
                          </div>
                        </div>
                        {!call.feedback && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setLocation(`/call-feedback?callId=${call.id}`)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Feedback
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No completed calls yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your participation in the Naeberly platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="p-6 h-auto flex-col space-y-2" variant="outline">
                <Calendar className="h-8 w-8" />
                <span>Update Availability</span>
                <span className="text-xs text-gray-500">Manage your meeting schedule</span>
              </Button>
              <Button className="p-6 h-auto flex-col space-y-2" variant="outline">
                <MessageSquare className="h-8 w-8" />
                <span>Provide Feedback</span>
                <span className="text-xs text-gray-500">Help improve call quality</span>
              </Button>
              <Button className="p-6 h-auto flex-col space-y-2" variant="outline">
                <Phone className="h-8 w-8" />
                <span>Contact Support</span>
                <span className="text-xs text-gray-500">Get help when needed</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DecisionDashboard;