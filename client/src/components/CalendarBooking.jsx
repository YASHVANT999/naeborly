import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Video, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function CalendarBooking({ decisionMakers = [] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDecisionMaker, setSelectedDecisionMaker] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState({
    title: "",
    description: "",
    duration: 30
  });

  // Get current date and next 7 days for availability checking
  const startDate = new Date().toISOString();
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Check calendar integration status
  const { data: calendarStatus } = useQuery({
    queryKey: ['/api/calendar/status'],
    retry: false,
  });

  // Get available slots for selected decision maker
  const { data: availabilityData, isLoading: loadingAvailability } = useQuery({
    queryKey: ['/api/calendar/availability', selectedDecisionMaker?.id, startDate, endDate],
    enabled: !!selectedDecisionMaker,
    retry: false,
  });

  // Connect to Google Calendar
  const connectCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/auth/google/connect');
      return response;
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to connect to Google Calendar",
        variant: "destructive",
      });
    }
  });

  // Schedule meeting mutation
  const scheduleMeetingMutation = useMutation({
    mutationFn: async (meetingData) => {
      return await apiRequest('/api/calendar/schedule', {
        method: 'POST',
        body: JSON.stringify(meetingData)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Meeting Scheduled",
        description: "Your meeting has been scheduled successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/calls'] });
      setIsBookingOpen(false);
      setSelectedSlot(null);
      setMeetingDetails({ title: "", description: "", duration: 30 });
    },
    onError: (error) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule meeting",
        variant: "destructive",
      });
    }
  });

  const handleScheduleMeeting = () => {
    if (!selectedSlot || !selectedDecisionMaker) return;

    const startTime = selectedSlot.start.toISOString();
    const endTime = selectedSlot.end.toISOString();

    scheduleMeetingMutation.mutate({
      decisionMakerId: selectedDecisionMaker.id,
      startTime,
      endTime,
      title: meetingDetails.title || `Meeting with ${selectedDecisionMaker.firstName} ${selectedDecisionMaker.lastName}`,
      description: meetingDetails.description,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const formatTimeSlot = (slot) => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    const day = start.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    const timeRange = `${start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    })} - ${end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    })}`;
    
    return { day, timeRange };
  };

  const groupSlotsByDay = (slots) => {
    if (!slots) return {};
    
    return slots.reduce((groups, slot) => {
      const date = new Date(slot.start).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(slot);
      return groups;
    }, {});
  };

  // Show connection prompt if calendar not connected
  if (!calendarStatus?.connected) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="text-blue-500 mr-3" size={20} />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to view availability and schedule meetings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="text-orange-500 mx-auto mb-4" size={48} />
            <p className="text-gray-600 mb-4">
              Connect your Google Calendar to enable real-time scheduling
            </p>
            <Button 
              onClick={() => connectCalendarMutation.mutate()}
              disabled={connectCalendarMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {connectCalendarMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Status */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="text-green-500 mr-3" size={20} />
              Calendar Integration
            </div>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Decision Maker Selection */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="text-purple-500 mr-3" size={20} />
            Schedule Meeting
          </CardTitle>
          <CardDescription>
            Select a decision maker to view their availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="decision-maker">Decision Maker</Label>
              <Select onValueChange={(value) => {
                const dm = decisionMakers.find(dm => dm.id === value);
                setSelectedDecisionMaker(dm);
                setSelectedSlot(null);
              }}>
                <SelectTrigger id="decision-maker">
                  <SelectValue placeholder="Select a decision maker" />
                </SelectTrigger>
                <SelectContent>
                  {decisionMakers.map((dm) => (
                    <SelectItem key={dm.id} value={dm.id}>
                      {dm.firstName} {dm.lastName} - {dm.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDecisionMaker && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">
                  {selectedDecisionMaker.firstName} {selectedDecisionMaker.lastName}
                </h4>
                <p className="text-sm text-blue-700">
                  {selectedDecisionMaker.jobTitle} at {selectedDecisionMaker.company}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Time Slots */}
      {selectedDecisionMaker && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="text-blue-500 mr-3" size={20} />
              Available Times
            </CardTitle>
            <CardDescription>
              Select an available time slot for your meeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAvailability ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading availability...</p>
              </div>
            ) : availabilityData?.availableSlots?.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupSlotsByDay(availabilityData.availableSlots)).map(([date, slots]) => (
                  <div key={date} className="space-y-2">
                    <h4 className="font-medium text-gray-900">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {slots.map((slot, index) => {
                        const { timeRange } = formatTimeSlot(slot);
                        const isSelected = selectedSlot === slot;
                        
                        return (
                          <Button
                            key={index}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSlot(slot)}
                            className={`text-xs ${isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                          >
                            {timeRange}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {selectedSlot && (
                  <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Video className="mr-2 h-4 w-4" />
                        Book Selected Time
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Meeting</DialogTitle>
                        <DialogDescription>
                          Confirm your meeting details
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="font-medium">
                            {selectedDecisionMaker.firstName} {selectedDecisionMaker.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTimeSlot(selectedSlot).day} at {formatTimeSlot(selectedSlot).timeRange}
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="meeting-title">Meeting Title</Label>
                          <Input
                            id="meeting-title"
                            value={meetingDetails.title}
                            onChange={(e) => setMeetingDetails(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Sales Discussion"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="meeting-description">Description (Optional)</Label>
                          <Input
                            id="meeting-description"
                            value={meetingDetails.description}
                            onChange={(e) => setMeetingDetails(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Discuss partnership opportunities..."
                          />
                        </div>
                        
                        <Button 
                          onClick={handleScheduleMeeting}
                          disabled={scheduleMeetingMutation.isPending}
                          className="w-full"
                        >
                          {scheduleMeetingMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Scheduling...
                            </>
                          ) : (
                            "Confirm Meeting"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="text-gray-300 mx-auto mb-4" size={48} />
                <p className="text-gray-500">
                  No available time slots found for the next 7 days
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  The decision maker may not have connected their calendar or has no availability
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}