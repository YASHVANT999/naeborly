import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Calendar, 
  Star, 
  TrendingUp,
  Clock,
  User,
  Settings,
  Repeat,
  ExternalLink,
  Phone,
  AlertTriangle,
  MessageCircle,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DecisionDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch decision maker's calls
  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['/api/decision-maker/calls'],
    enabled: !!user?.id
  });

  // Fetch decision maker's metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/decision-maker/metrics'],
    enabled: !!user?.id
  });
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
        size={16} 
      />
    ));
  };

  const getCallColor = (index) => {
    return index % 2 === 0 ? 'blue' : 'purple';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const rateCallMutation = useMutation({
    mutationFn: async ({ callId, rating, feedback }) => {
      return await apiRequest(`/api/decision-maker/calls/${callId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating, feedback }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/decision-maker/calls'] });
      queryClient.invalidateQueries({ queryKey: ['/api/decision-maker/metrics'] });
      toast({
        title: "Call Rated",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to rate call",
        variant: "destructive",
      });
    }
  });

  if (!user || metricsLoading || callsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const upcomingCalls = calls.filter(call => call.status === 'scheduled');
  const recentCalls = calls.filter(call => call.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Decision Maker Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800">
                {metrics?.standing === 'good' ? 'Excellent Standing' : 'Standing: ' + metrics?.standing}
              </Badge>
              <Button variant="ghost" size="sm">
                <Settings className="mr-2" size={16} />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Calls Completed</p>
                  <p className="text-3xl font-bold">{metrics?.completedCalls || 0}</p>
                </div>
                <CheckCircle className="text-purple-200" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Remaining Calls</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics?.remainingCalls || 0}</p>
                </div>
                <Calendar className="text-gray-400" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Avg Call Rating</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics?.avgRating ? metrics.avgRating.toFixed(1) : '-'}</p>
                </div>
                <Star className="text-yellow-400" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Quality Score</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics?.qualityScore ? `${metrics.qualityScore}%` : '-'}</p>
                </div>
                <TrendingUp className="text-green-500" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Calls */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="text-blue-500 mr-3" size={24} />
                  Upcoming Calls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {upcomingCalls.length > 0 ? upcomingCalls.map((call, index) => {
                  const color = getCallColor(index);
                  return (
                    <div 
                      key={call._id || call.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        color === 'blue' 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-purple-50 border-purple-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          <User className={color === 'blue' ? 'text-blue-600' : 'text-purple-600'} size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{call.salesRepName || 'Sales Rep'}</h3>
                          <p className={`font-medium ${color === 'blue' ? 'text-blue-600' : 'text-purple-600'}`}>
                            {call.company || 'Company'}
                          </p>
                          <p className="text-sm text-gray-600">{call.industry || 'Industry'}</p>
                          <p className={`text-sm font-medium italic ${color === 'blue' ? 'text-blue-600' : 'text-purple-600'}`}>
                            "{call.pitch || 'Scheduled call'}"
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${color === 'blue' ? 'text-blue-600' : 'text-purple-600'}`}>
                          {call.scheduledAt ? formatDate(call.scheduledAt) : 'TBD'}
                        </p>
                        <p className="text-sm text-gray-500">15 min</p>
                        <div className="mt-2 space-x-2">
                          <Button variant="outline" size="sm">
                            <Repeat className="mr-1" size={12} />
                            Reschedule
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={color === 'blue' ? 'border-blue-200 text-blue-600' : 'border-purple-200 text-purple-600'}
                          >
                            <ExternalLink className="mr-1" size={12} />
                            View Rep Profile
                          </Button>
                          <Button 
                            size="sm"
                            className={color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}
                          >
                            <Phone className="mr-1" size={12} />
                            Join Call
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No upcoming calls scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Calls */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="text-green-500 mr-3" size={24} />
                  Recent Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentCalls.length > 0 ? recentCalls.map((call) => (
                  <div key={call._id || call.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{call.salesRepName || 'Sales Rep'}</h3>
                        <p className="text-green-600 font-medium">{call.company || 'Company'}</p>
                        <p className="text-sm text-gray-600">{call.industry || 'Industry'}</p>
                        <p className="text-sm text-green-600 font-medium italic">"{call.feedback || 'Call completed'}"</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {call.completedAt ? new Date(call.completedAt).toLocaleDateString() : 'Recently'}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="flex">
                          {renderStars(call.rating || 0)}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 mt-2">
                        Completed
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No completed calls yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Commitment Status */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="text-purple-500 mr-3" size={20} />
                  Commitment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Calls Completed</span>
                    <span className="text-sm font-bold text-gray-900">
                      {metrics?.completedCalls || 0}/{metrics?.totalCallLimit || 3}
                    </span>
                  </div>
                  <Progress value={metrics?.completionPercentage || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Remaining</span>
                    <span className="text-sm font-bold text-gray-900">
                      {metrics?.remainingCalls || 0}/{metrics?.totalCallLimit || 3}
                    </span>
                  </div>
                  <Progress 
                    value={metrics?.remainingCalls ? (metrics.remainingCalls / (metrics.totalCallLimit || 3)) * 100 : 0} 
                    className="h-2 bg-purple-200" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="text-blue-500 mr-3" size={20} />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600 mb-4">
                  <CheckCircle className="mr-2" size={16} />
                  <span className="text-sm font-medium">Google Calendar Connected</span>
                </div>
                <Button variant="outline" className="w-full">
                  <Settings className="mr-2" size={16} />
                  Manage Availability
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start p-3">
                  <Star className="text-yellow-500 mr-3" size={16} />
                  <span className="text-sm font-medium">Rate Last Call</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start p-3">
                  <AlertTriangle className="text-red-500 mr-3" size={16} />
                  <span className="text-sm font-medium">Report Issue</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start p-3">
                  <MessageCircle className="text-blue-500 mr-3" size={16} />
                  <span className="text-sm font-medium">View Feedback</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
