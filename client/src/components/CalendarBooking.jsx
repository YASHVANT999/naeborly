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
  DialogTrigger,
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
  const [viewType, setViewType] = useState('week'); // 'week', 'month', or 'agenda'
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isDMSelectionOpen, setIsDMSelectionOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    agenda: '',
    notes: ''
  });

  // Responsive screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      // Auto-switch to agenda view on mobile for better UX
      if (isMobile && viewType === 'week') {
        setViewType('agenda');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [viewType]);

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
      {/* Responsive Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <CalendarIcon className="text-blue-600 mr-2 sm:mr-3 flex-shrink-0" size={isMobileView ? 20 : 28} />
            <span className="truncate">Meeting Calendar</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Book meetings with decision makers
          </p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-full sm:w-32 min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agenda">Agenda View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="month">Month View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Responsive DM Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center min-w-0">
              <User className="text-blue-600 mr-2 flex-shrink-0" size={20} />
              <span className="truncate">Decision Maker Selection</span>
            </div>
            <Dialog open={isDMSelectionOpen} onOpenChange={setIsDMSelectionOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto sm:ml-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Select Decision Maker
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] sm:max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-base sm:text-lg">
                    <User className="text-blue-600 mr-2 flex-shrink-0" size={20} />
                    <span className="truncate">Select Decision Maker</span>
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Choose a decision maker to view their availability and schedule a meeting.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
                  {dmsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                      <span className="ml-3">Loading decision makers...</span>
                    </div>
                  ) : availableDMs.length > 0 ? (
                    <div className="space-y-3">
                      {availableDMs.map((dm) => (
                        <div
                          key={dm.id}
                          onClick={() => {
                            setSelectedDM(dm);
                            setIsDMSelectionOpen(false);
                          }}
                          className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            selectedDM?.id === dm.id
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{dm.name}</h4>
                              <p className="text-sm text-gray-600">{dm.title}</p>
                              <p className="text-xs text-gray-500">{dm.company}</p>
                              {dm.industry && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {dm.industry}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Available
                              </Badge>
                              {selectedDM?.id === dm.id && (
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="text-gray-400" size={32} />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No decision makers available</h3>
                      <p className="text-gray-500 text-sm">
                        There are currently no decision makers available for booking. Please check back later.
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDM ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">{selectedDM.name}</h4>
                  <p className="text-sm text-blue-700">{selectedDM.title}</p>
                  <p className="text-xs text-blue-600">{selectedDM.company}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDMSelectionOpen(true)}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Decision Maker Selected</h3>
              <p className="text-gray-500 mb-4 text-sm">
                Please select a decision maker to view their availability and schedule meetings.
              </p>
              <Button 
                onClick={() => setIsDMSelectionOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Select Decision Maker
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar View */}
      {selectedDM && (
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="flex items-center min-w-0">
                <Calendar className="text-blue-600 mr-2 flex-shrink-0" size={20} />
                <span className="truncate">Availability for {selectedDM.name}</span>
              </CardTitle>
              <div className="flex items-center justify-between sm:justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')} className="flex-shrink-0">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
                <span className="font-medium text-sm sm:text-base text-center min-w-0 flex-1 sm:min-w-[200px] sm:flex-none px-2">
                  {viewType === 'week' || viewType === 'agenda'
                    ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  }
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')} className="flex-shrink-0">
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next</span>
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
                {/* Responsive Legend */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-100 border border-gray-300 rounded"></div>
                    <span>Unavailable</span>
                  </div>
                </div>

                {/* Responsive Calendar Views */}
                {viewType === 'agenda' ? (
                  <div className="space-y-3">
                    {weekDays.map((day) => (
                      <Card key={day.toISOString()} className="border border-gray-200">
                        <CardHeader className="pb-3">
                          <h3 className="text-base font-semibold text-gray-900">
                            {day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </h3>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {timeSlots.map((time) => {
                              const slot = getSlotForDateTime(day, time);
                              return (
                                <button
                                  key={`${day.toISOString()}-${time}`}
                                  onClick={() => handleSlotClick(slot)}
                                  disabled={!slot || !slot.available}
                                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[48px] flex items-center justify-center ${getSlotClassName(slot)} ${slot && slot.available ? 'hover:scale-105 active:scale-95' : ''}`}
                                >
                                  <div className="text-center">
                                    <div className="text-xs">{time}</div>
                                    <div className="text-lg">{getSlotContent(slot)}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <div className="min-w-[640px] lg:min-w-0">
                        <div className={`grid ${isMobileView ? 'grid-cols-3' : 'grid-cols-6'} gap-0`}>
                          <div className="p-2 sm:p-3 bg-gray-50 border-b font-medium text-xs sm:text-sm text-center">
                            Time
                          </div>
                          {(isMobileView ? weekDays.slice(0, 2) : weekDays).map((day) => (
                            <div key={day.toISOString()} className="p-2 sm:p-3 bg-gray-50 border-b border-l font-medium text-xs sm:text-sm text-center">
                              <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                              <div className="text-sm sm:text-lg font-bold">{day.getDate()}</div>
                            </div>
                          ))}
                          
                          {timeSlots.map((time) => (
                            <div key={time} className="contents">
                              <div className="p-1 sm:p-2 border-b border-r bg-gray-50 text-xs sm:text-sm font-medium text-center">
                                {time}
                              </div>
                              {(isMobileView ? weekDays.slice(0, 2) : weekDays).map((day) => {
                                const slot = getSlotForDateTime(day, time);
                                return (
                                  <div
                                    key={`${day.toISOString()}-${time}`}
                                    onClick={() => handleSlotClick(slot)}
                                    className={`p-1 sm:p-2 border-b border-l h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-200 ${getSlotClassName(slot)} ${slot && slot.available ? 'hover:scale-105 active:scale-95' : ''}`}
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
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Responsive Booking Confirmation Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg mx-auto">
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