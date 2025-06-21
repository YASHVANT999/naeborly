import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Loader2,
  RefreshCw,
  CalendarDays,
  Video,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FlagsBadge from "@/components/FlagsBadge";

// Integrated Meeting Card Component for Calendar Integration
function IntegratedMeetingCard({ meeting }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    if (isTomorrow) return `Tomorrow, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const extractMeetingLink = (description = '') => {
    const zoomRegex = /https:\/\/[\w-]*\.?zoom\.us\/j\/[\d\w?=-]+/g;
    const meetRegex = /https:\/\/meet\.google\.com\/[\w-]+/g;
    const teamsRegex = /https:\/\/teams\.microsoft\.com\/[\w\/?=-]+/g;
    
    const zoomMatch = description.match(zoomRegex);
    const meetMatch = description.match(meetRegex);
    const teamsMatch = description.match(teamsRegex);
    
    return zoomMatch?.[0] || meetMatch?.[0] || teamsMatch?.[0] || null;
  };

  const meetingLink = extractMeetingLink(meeting.description);

  return (
    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
          <Video className="text-green-600" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">
            {meeting.summary || 'Meeting with Sales Rep'}
          </h3>
          <p className="font-medium text-green-600">
            {meeting.organizer?.email || 'Sales Rep'}
          </p>
          <p className="text-sm text-gray-600">
            {meeting.attendees?.length > 0 ? `${meeting.attendees.length} attendees` : 'Google Calendar'}
          </p>
          <p className="text-sm font-medium italic text-green-600">
            "Calendar meeting"
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-green-600">
          {formatDate(meeting.start?.dateTime || meeting.start?.date)}
        </p>
        <p className="text-sm text-gray-500">
          {meeting.status === 'confirmed' ? 'Confirmed' : 'Scheduled'}
        </p>
        <div className="mt-2 space-x-2">
          {meetingLink && (
            <Button 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              asChild
            >
              <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1" size={12} />
                Join Meeting
              </a>
            </Button>
          )}
          <Button 
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600"
            onClick={() => window.location.href = '/post-call-evaluation'}
          >
            <Star className="mr-1" size={12} />
            Rate Meeting
          </Button>
        </div>
      </div>
    </div>
  );
}

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

  // Fetch calendar integration status
  const { data: calendarStatus, isLoading: calendarStatusLoading } = useQuery({
    queryKey: ['/api/calendar/status'],
    enabled: !!user?.id
  });

  // Fetch upcoming meetings
  const { data: upcomingMeetings = [], isLoading: meetingsLoading, refetch: refetchMeetings } = useQuery({
    queryKey: ['/api/calendar/upcoming-meetings'],
    enabled: !!user?.id && !!calendarStatus?.connected,
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
    return 'blue'; // Use consistent blue theme
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
              <FlagsBadge />
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
            {/* Upcoming Calls with Calendar Integration */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="text-blue-500 mr-3" size={24} />
                    Upcoming Calls & Meetings
                  </div>
                  <div className="flex items-center gap-2">
                    {calendarStatus?.connected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetchMeetings()}
                        disabled={meetingsLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${meetingsLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    {!calendarStatus?.connected && (
                      <Button 
                        onClick={async () => {
                          try {
                            const user = await apiRequest('/api/current-user');
                            await apiRequest(`/api/users/${user._id}`, {
                              method: 'PATCH',
                              body: JSON.stringify({ calendarIntegrationEnabled: true })
                            });
                            refetchMeetings();
                            window.location.reload();
                          } catch (error) {
                            console.error('Demo connection failed:', error);
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        <Calendar className="mr-1" size={12} />
                        Connect Calendar
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Calendar Connection Status */}
                <div className="p-3 rounded-lg border">
                  {calendarStatusLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2" />
                      <span className="text-sm text-gray-600">Checking calendar connection...</span>
                    </div>
                  ) : calendarStatus?.connected ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="mr-2" size={16} />
                      <span className="text-sm font-medium">Google Calendar Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-600">
                      <AlertTriangle className="mr-2" size={16} />
                      <span className="text-sm font-medium">Calendar Not Connected - Click "Connect Calendar" to sync meetings</span>
                    </div>
                  )}
                </div>

                {/* Platform Calls */}
                {upcomingCalls.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Phone className="mr-2 text-blue-500" size={14} />
                      Platform Scheduled Calls
                    </h4>
                    <div className="space-y-3">
                      {upcomingCalls.map((call, index) => {
                        const color = getCallColor(index);
                        return (
                          <div 
                            key={call._id || call.id} 
                            className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                              color === 'blue' 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100">
                                <User className="text-blue-600" size={24} />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900">{call.salesRepName || 'Sales Rep'}</h3>
                                <p className="font-medium text-blue-600">
                                  {call.company || 'Company'}
                                </p>
                                <p className="text-sm text-gray-600">{call.industry || 'Industry'}</p>
                                <p className="text-sm font-medium italic text-blue-600">
                                  "{call.pitch || 'Scheduled call'}"
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-blue-600">
                                {call.scheduledAt ? formatDate(call.scheduledAt) : 'TBD'}
                              </p>
                              <p className="text-sm text-gray-500">15 min</p>
                              <div className="mt-2 space-x-2">
                                <Button variant="outline" size="sm">
                                  <Repeat className="mr-1" size={12} />
                                  Reschedule
                                </Button>
                                <Button 
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Phone className="mr-1" size={12} />
                                  Join Call
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="border-red-200 text-red-600"
                                  onClick={() => window.location.href = '/post-call-evaluation'}
                                >
                                  <Star className="mr-1" size={12} />
                                  Rate Call
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Calendar Meetings */}
                {calendarStatus?.connected && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <CalendarDays className="mr-2 text-green-500" size={14} />
                      Google Calendar Meetings
                    </h4>
                    {meetingsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse">
                            <div className="h-20 bg-gray-200 rounded-lg"></div>
                          </div>
                        ))}
                      </div>
                    ) : upcomingMeetings.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingMeetings.slice(0, 3).map((meeting) => (
                          <IntegratedMeetingCard key={meeting.id} meeting={meeting} />
                        ))}
                        {upcomingMeetings.length > 3 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full mt-3">
                                <CalendarDays className="mr-2" size={16} />
                                View All {upcomingMeetings.length} Meetings
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center">
                                  <Calendar className="mr-2" size={20} />
                                  All Upcoming Meetings with Sales Reps
                                </DialogTitle>
                              </DialogHeader>
                              <CalendarMeetingsView meetings={upcomingMeetings} loading={meetingsLoading} />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        <CalendarDays className="mx-auto mb-2" size={24} />
                        <p className="text-sm">No upcoming calendar meetings</p>
                      </div>
                    )}
                  </div>
                )}

                {/* No calls state */}
                {upcomingCalls.length === 0 && (!calendarStatus?.connected || upcomingMeetings.length === 0) && (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No upcoming calls scheduled</p>
                    {!calendarStatus?.connected && (
                      <p className="text-sm text-gray-400 mt-2">Connect your calendar to see Google Calendar meetings</p>
                    )}
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
                    className="h-2 bg-blue-200" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calendar Integration */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="text-blue-500 mr-3" size={20} />
                    Calendar Integration
                  </div>
                  {calendarStatus?.connected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refetchMeetings()}
                      disabled={meetingsLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${meetingsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calendarStatusLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                  </div>
                ) : calendarStatus?.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center text-green-600 mb-4">
                      <CheckCircle className="mr-2" size={16} />
                      <span className="text-sm font-medium">Google Calendar Connected</span>
                    </div>
                    
                    {/* Upcoming Meetings */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Upcoming Meetings</h4>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <CalendarDays className="mr-2" size={14} />
                              View All
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center">
                                <Calendar className="mr-2" size={20} />
                                Upcoming Meetings with Sales Reps
                              </DialogTitle>
                            </DialogHeader>
                            <CalendarMeetingsView meetings={upcomingMeetings} loading={meetingsLoading} />
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {meetingsLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                              <div className="h-12 bg-gray-200 rounded-lg"></div>
                            </div>
                          ))}
                        </div>
                      ) : upcomingMeetings.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {upcomingMeetings.slice(0, 3).map((meeting) => (
                            <MeetingCard key={meeting.id} meeting={meeting} compact={true} />
                          ))}
                          {upcomingMeetings.length > 3 && (
                            <p className="text-sm text-gray-500 text-center py-2">
                              +{upcomingMeetings.length - 3} more meetings
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <CalendarDays className="mx-auto mb-2" size={24} />
                          <p className="text-sm">No upcoming meetings</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center text-orange-600 mb-4">
                      <AlertTriangle className="mr-2" size={16} />
                      <span className="text-sm font-medium">Calendar Not Connected</span>
                    </div>
                    <div className="space-y-3">
                      <Button 
                        onClick={async () => {
                          try {
                            const user = await apiRequest('/api/current-user');
                            await apiRequest(`/api/users/${user._id}`, {
                              method: 'PATCH',
                              body: JSON.stringify({ calendarIntegrationEnabled: true })
                            });
                            refetchMeetings();
                            window.location.reload();
                          } catch (error) {
                            console.error('Demo connection failed:', error);
                          }
                        }}
                        className="w-full"
                      >
                        <Calendar className="mr-2" size={16} />
                        Connect Calendar (Demo)
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Demo mode: This will simulate calendar connection with sample meetings
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-3"
                  onClick={() => window.location.href = '/post-call-evaluation'}
                >
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

// Meeting Card Component
function MeetingCard({ meeting, compact = false }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    if (isTomorrow) return `Tomorrow, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const extractMeetingLink = (description = '') => {
    const zoomRegex = /https:\/\/[\w-]*\.?zoom\.us\/j\/[\d\w?=-]+/g;
    const meetRegex = /https:\/\/meet\.google\.com\/[\w-]+/g;
    const teamsRegex = /https:\/\/teams\.microsoft\.com\/[\w\/?=-]+/g;
    
    const zoomMatch = description.match(zoomRegex);
    const meetMatch = description.match(meetRegex);
    const teamsMatch = description.match(teamsRegex);
    
    return zoomMatch?.[0] || meetMatch?.[0] || teamsMatch?.[0] || null;
  };

  const meetingLink = extractMeetingLink(meeting.description);

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {meeting.summary || 'Meeting with Sales Rep'}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(meeting.start?.dateTime || meeting.start?.date)}
          </p>
        </div>
        {meetingLink && (
          <Button size="sm" variant="ghost" asChild>
            <a href={meetingLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Video className="text-blue-500" size={16} />
              <h4 className="font-medium text-gray-900 truncate">
                {meeting.summary || 'Meeting with Sales Rep'}
              </h4>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>{formatDate(meeting.start?.dateTime || meeting.start?.date)}</span>
              </div>
              
              {meeting.organizer?.email && (
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>Organized by: {meeting.organizer.email}</span>
                </div>
              )}
              
              {meeting.attendees && meeting.attendees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>{meeting.attendees.length} attendees</span>
                </div>
              )}
            </div>
            
            {meeting.description && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {meeting.description.replace(/https?:\/\/[^\s]+/g, '').trim()}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            {meeting.status === 'confirmed' && (
              <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
            )}
            {meetingLink && (
              <Button size="sm" asChild>
                <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1" size={14} />
                  Join
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Calendar Meetings View Component
function CalendarMeetingsView({ meetings, loading }) {
  const [filterDate, setFilterDate] = useState('');
  const [filterSalesRep, setFilterSalesRep] = useState('');

  const filteredMeetings = meetings.filter(meeting => {
    const matchesDate = !filterDate || 
      new Date(meeting.start?.dateTime || meeting.start?.date).toDateString().includes(filterDate);
    const matchesSalesRep = !filterSalesRep || 
      meeting.organizer?.email?.toLowerCase().includes(filterSalesRep.toLowerCase()) ||
      meeting.summary?.toLowerCase().includes(filterSalesRep.toLowerCase());
    
    return matchesDate && matchesSalesRep;
  });

  const groupedMeetings = filteredMeetings.reduce((groups, meeting) => {
    const date = new Date(meeting.start?.dateTime || meeting.start?.date);
    const dateKey = date.toDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(meeting);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="filter-date">Filter by Date</Label>
          <Input
            id="filter-date"
            type="text"
            placeholder="e.g., Jan 15 or Monday"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="filter-rep">Filter by Sales Rep</Label>
          <Input
            id="filter-rep"
            type="text"
            placeholder="Search by name or email"
            value={filterSalesRep}
            onChange={(e) => setFilterSalesRep(e.target.value)}
          />
        </div>
      </div>

      {/* Meetings List */}
      {Object.keys(groupedMeetings).length === 0 ? (
        <div className="text-center py-8">
          <CalendarDays className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500">No meetings found</p>
          <p className="text-sm text-gray-400 mt-2">
            {filterDate || filterSalesRep ? 'Try adjusting your filters' : 'No upcoming meetings scheduled'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMeetings)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([dateKey, dayMeetings]) => (
              <div key={dateKey}>
                <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b">
                  {new Date(dateKey).toLocaleDateString([], {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <div className="space-y-3">
                  {dayMeetings
                    .sort((a, b) => 
                      new Date(a.start?.dateTime || a.start?.date) - 
                      new Date(b.start?.dateTime || b.start?.date)
                    )
                    .map(meeting => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
