import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Building, Star, X } from 'lucide-react';

const BookingModal = ({ isOpen, onClose, decisionMaker, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate available time slots (9 AM to 5 PM in 15-minute intervals)
  const generateTimeSlots = (date) => {
    const slots = [];
    const today = new Date();
    const selectedDay = new Date(date);
    const isToday = selectedDay.toDateString() === today.toDateString();
    
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const slotTime = new Date(selectedDay);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Skip past time slots if it's today
        const isPast = isToday && slotTime <= today;
        
        const timeString = slotTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        slots.push({
          time: timeString,
          value: slotTime,
          disabled: isPast
        });
      }
    }
    return slots;
  };

  // Get days in month for calendar
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isPast = currentDate < today;
      const isToday = currentDate.toDateString() === today.toDateString();
      
      days.push({
        date: currentDate,
        day: currentDate.getDate(),
        isCurrentMonth,
        isPast,
        isToday,
        disabled: isPast || !isCurrentMonth
      });
    }
    return days;
  };

  const handleDateSelect = (day) => {
    if (day.disabled) return;
    setSelectedDate(day.date);
    setSelectedTimeSlot(null); // Reset time slot when date changes
  };

  const handleTimeSlotSelect = (slot) => {
    if (slot.disabled) return;
    setSelectedTimeSlot(slot);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTimeSlot) {
      onConfirm({
        decisionMaker,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        formattedDateTime: `${selectedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })} at ${selectedTimeSlot.time}`
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    onClose();
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const days = getDaysInMonth(currentMonth);
  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900">Book a Call</DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
          {/* Decision Maker Info */}
          <div className="space-y-6">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Decision Maker</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{decisionMaker?.name}</h4>
                    <p className="text-gray-600">{decisionMaker?.jobTitle}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{decisionMaker?.company}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-gray-700">{decisionMaker?.engagementScore}% engagement</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">15 Minutes</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    This will be a brief introduction call to discuss potential collaboration opportunities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar and Time Selection */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
                </div>
                
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  {days.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(day)}
                      disabled={day.disabled}
                      className={`
                        text-center py-2 px-1 text-sm rounded-lg transition-colors
                        ${day.disabled 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-700 hover:bg-blue-50 cursor-pointer'
                        }
                        ${day.isToday ? 'font-bold text-blue-600' : ''}
                        ${selectedDate && selectedDate.toDateString() === day.date.toDateString() 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : ''
                        }
                      `}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Slots */}
            {selectedDate && (
              <Card className="border border-gray-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Select Time</h3>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {timeSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleTimeSlotSelect(slot)}
                        disabled={slot.disabled}
                        className={`
                          py-2 px-3 text-sm rounded-lg border transition-colors
                          ${slot.disabled 
                            ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed' 
                            : 'text-gray-700 bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-300 cursor-pointer'
                          }
                          ${selectedTimeSlot && selectedTimeSlot.time === slot.time 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : ''
                          }
                        `}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTimeSlot}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Book Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;