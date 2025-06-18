import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Clock, Calendar, Loader2 } from "lucide-react";
import { decisionMakerAvailabilitySchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function DecisionMakerAvailability() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(decisionMakerAvailabilitySchema),
    defaultValues: {
      availabilityType: "flexible",
      preferredDays: [],
      preferredTimes: [],
      timezone: "",
      callDuration: "15"
    }
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Submitting decision maker availability data:', data);
      const response = await apiRequest('/api/decision-maker/availability', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: (data) => {
      console.log('Decision maker availability saved successfully:', data);
      toast({
        title: "Availability Preferences Saved",
        description: "Your availability preferences have been saved successfully."
      });
      setLocation("/signup/decision-maker/nominate");
    },
    onError: (error) => {
      console.error('Decision maker availability save error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save availability preferences. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data) => {
    saveAvailabilityMutation.mutate(data);
  };

  const weekdays = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" }
  ];

  const timeSlots = [
    { id: "9-11", label: "9:00 AM - 11:00 AM" },
    { id: "11-13", label: "11:00 AM - 1:00 PM" },
    { id: "13-15", label: "1:00 PM - 3:00 PM" },
    { id: "15-17", label: "3:00 PM - 5:00 PM" },
    { id: "17-19", label: "5:00 PM - 7:00 PM" }
  ];

  const timezones = [
    "America/New_York",
    "America/Chicago", 
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Kolkata",
    "Australia/Sydney"
  ];

  const availabilityType = form.watch("availabilityType");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600">Step 3 of 5</span>
            <span className="text-sm font-medium text-gray-600">60% Complete</span>
          </div>
          <Progress value={60} className="h-2" />
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Availability Preferences</h1>
              <p className="text-gray-600">Set your preferences for intro calls with sales representatives</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Availability Type */}
                <FormField
                  control={form.control}
                  name="availabilityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        How would you like to schedule calls? *
                      </FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="flexible" id="flexible" />
                            <label htmlFor="flexible" className="text-sm cursor-pointer">
                              <span className="font-medium">Flexible scheduling</span> - I'm open to various times
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="specific_times" id="specific_times" />
                            <label htmlFor="specific_times" className="text-sm cursor-pointer">
                              <span className="font-medium">Specific time slots</span> - I prefer certain days and times
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="by_appointment" id="by_appointment" />
                            <label htmlFor="by_appointment" className="text-sm cursor-pointer">
                              <span className="font-medium">By appointment only</span> - I'll schedule individually
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preferred Days - Only show if specific_times selected */}
                {availabilityType === "specific_times" && (
                  <FormField
                    control={form.control}
                    name="preferredDays"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Preferred Days *
                        </FormLabel>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {weekdays.map((day) => (
                            <FormField
                              key={day.id}
                              control={form.control}
                              name="preferredDays"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={day.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(day.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, day.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== day.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {day.label}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Preferred Times - Only show if specific_times selected */}
                {availabilityType === "specific_times" && (
                  <FormField
                    control={form.control}
                    name="preferredTimes"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Preferred Time Slots *
                        </FormLabel>
                        <div className="space-y-3 mt-2">
                          {timeSlots.map((slot) => (
                            <FormField
                              key={slot.id}
                              control={form.control}
                              name="preferredTimes"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={slot.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(slot.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, slot.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== slot.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {slot.label}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Timezone */}
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Your Timezone *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select your timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Call Duration */}
                <FormField
                  control={form.control}
                  name="callDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Preferred Call Duration
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select call duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="text-blue-600 mt-0.5" size={16} />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">About Intro Calls</h4>
                      <p className="text-xs text-blue-700">
                        These are brief introduction calls where sales reps can pitch their value proposition. 
                        You maintain full control over your schedule and can decline any calls that don't interest you.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/signup/decision-maker/professional-info")}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>

                  <Button
                    type="submit"
                    disabled={saveAvailabilityMutation.isPending}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    {saveAvailabilityMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}