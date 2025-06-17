import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Building,
  Phone,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  Loader2,
  Plus
} from "lucide-react";

export default function CalendarBooking() {
  const { toast } = useToast();
  const [selectedDM, setSelectedDM] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('week'); // 'week' or 'month'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    agenda: '',
    notes: ''
  });

  // Get available DMs
  const { data: availableDMs = [], isLoading: dmsLoading } = useQuery({
    queryKey: ['/api/calendar/available-dms'],
    retry: false,
  });

  // Get DM availability for selected DM and date range
  const { data: availability = {}, isLoading: availabilityLoading, refetch: refetchAvailability } = useQuery({
    queryKey: ['/api/calendar/dm-availability', selectedDM?.id, getDateRange()],
    enabled: !!selectedDM,
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      return await apiRequest(`/api/calendar/dm-availability/${selectedDM.id}?startDate=${startDate}&endDate=${endDate}`);
    },
    retry: false,
  });

  // Get user's meetings
  const { data: myMeetings = [], refetch: refetchMeetings } = useQuery({
    queryKey: ['/api/calendar/my-meetings', getDateRange()],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      return await apiRequest(`/api/calendar/my-meetings?startDate=${startDate}&endDate=${endDate}`);
    },
    retry: false,
  });

  // Book meeting mutation
  const bookMeetingMutation = useMutation({
    mutationFn: async (bookingData) => {
      return await apiRequest('/api/calendar/book-slot', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Meeting Booked Successfully",
        description: `Meeting with ${selectedSlot.dmName} scheduled for ${formatDateTime(selectedSlot.startTime)}`,
      });
      setIsBookingDialogOpen(false);
      setSelectedSlot(null);
      setBookingForm({ agenda: '', notes: '' });
      refetchAvailability();
      refetchMeetings();
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book the meeting slot",
        variant: "destructive",
      });
    },
  });

  function getDateRange() {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewType === 'week') {
      // Get start of week (Monday)
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      
      // Get end of week (Sunday)
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // Get start of month
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      // Get end of month
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }

  function navigateDate(direction) {
    const newDate = new Date(currentDate);
    if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  }

  function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function formatTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function getWeekDays() {
    const start = new Date(currentDate);
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }

  function getTimeSlots() {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  }

  function getSlotForDateTime(date, time) {
    if (!availability.availabilitySlots) return null;
    
    const [hour, minute] = time.split(':').map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hour, minute, 0, 0);
    
    return availability.availabilitySlots.find(slot => {
      const slotTime = new Date(slot.startTime);
      return Math.abs(slotTime.getTime() - slotDateTime.getTime()) < 60000; // 1 minute tolerance
    });
  }

  function handleSlotClick(slot) {
    if (!slot || !slot.available) return;
    
    setSelectedSlot(slot);
    setIsBookingDialogOpen(true);
  }

  function handleBookingSubmit() {
    if (!selectedSlot) return;

    bookMeetingMutation.mutate({
      dmId: selectedSlot.dmId,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      agenda: bookingForm.agenda || 'Business Meeting',
      notes: bookingForm.notes
    });
  }

  function getSlotClassName(slot) {
    if (!slot) return "bg-gray-100 cursor-not-allowed";
    if (slot.available) return "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer border-green-300";
    if (slot.booked) return "bg-red-100 text-red-800 cursor-not-allowed border-red-300";
    return "bg-gray-100 cursor-not-allowed";
  }

  function getSlotContent(slot) {
    if (!slot) return "";
    if (slot.available) return "✅";
    if (slot.booked) return "❌";
    return "";
  }

  // Skip weekends
  const weekDays = getWeekDays().filter(day => day.getDay() !== 0 && day.getDay() !== 6);
  const timeSlots = getTimeSlots();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <CalendarIcon className="text-blue-600 mr-3" size={28} />
            Meeting Calendar
          </h2>
          <p className="text-gray-600 mt-1">
            Book meetings with decision makers
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="month">Month View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DM Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="text-blue-600 mr-2" size={20} />
            Select Decision Maker
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dmsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
              <span className="ml-2">Loading decision makers...</span>
            </div>
          ) : availableDMs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableDMs.map((dm) => (
                <div
                  key={dm.id}
                  onClick={() => setSelectedDM(dm)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedDM?.id === dm.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{dm.name}</h4>
                      <p className="text-sm text-gray-600">{dm.title}</p>
                      <p className="text-xs text-gray-500">{dm.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="text-gray-300 mx-auto mb-4" size={48} />
              <p className="text-gray-500">No decision makers available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar View */}
      {selectedDM && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="text-blue-600 mr-2" size={20} />
                Availability for {selectedDM.name}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[200px] text-center">
                  {viewType === 'week' 
                    ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                    : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  }
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {availabilityLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                <span className="ml-2">Loading availability...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                    <span>Unavailable</span>
                  </div>
                </div>

                {/* Week View Calendar */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-6 gap-0">
                    {/* Time column header */}
                    <div className="p-3 bg-gray-50 border-b font-medium text-sm text-center">
                      Time
                    </div>
                    {/* Day headers */}
                    {weekDays.map((day) => (
                      <div key={day.toISOString()} className="p-3 bg-gray-50 border-b border-l font-medium text-sm text-center">
                        <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-lg font-bold">{day.getDate()}</div>
                      </div>
                    ))}
                    
                    {/* Time slots */}
                    {timeSlots.map((time) => (
                      <div key={time} className="contents">
                        {/* Time label */}
                        <div className="p-2 border-b border-r bg-gray-50 text-sm font-medium text-center">
                          {time}
                        </div>
                        {/* Day slots */}
                        {weekDays.map((day) => {
                          const slot = getSlotForDateTime(day, time);
                          return (
                            <div
                              key={`${day.toISOString()}-${time}`}
                              onClick={() => handleSlotClick(slot)}
                              className={`p-2 border-b border-l h-12 flex items-center justify-center text-sm font-medium transition-colors ${getSlotClassName(slot)}`}
                            >
                              {getSlotContent(slot)}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Confirmation Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="text-blue-600 mr-2" size={20} />
              Book Meeting Slot
            </DialogTitle>
            <DialogDescription>
              Confirm your meeting details with {selectedSlot?.dmName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSlot && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="font-medium">{selectedSlot.dmName}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-blue-600" />
                  <span>{formatDateTime(selectedSlot.startTime)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  <span>30 minutes</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="agenda">Meeting Agenda</Label>
                  <Input
                    id="agenda"
                    placeholder="e.g., Product Demo, Partnership Discussion"
                    value={bookingForm.agenda}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, agenda: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information or preparation notes"
                    rows={3}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBookingSubmit}
              disabled={bookMeetingMutation.isPending}
            >
              {bookMeetingMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}