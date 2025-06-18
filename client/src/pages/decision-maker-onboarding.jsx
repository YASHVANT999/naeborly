import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, ArrowRight, ArrowLeft, Loader2, User, Briefcase, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Must be a valid email address"),
  phone: z.string().optional(),
});

const professionalInfoSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  industry: z.string().min(1, "Industry is required"),
  companySize: z.string().min(1, "Company size is required"),
  yearsInRole: z.string().min(1, "Years in role is required"),
  decisionAreas: z.string().min(1, "Decision areas are required"),
});

const availabilitySchema = z.object({
  preferredMeetingTimes: z.array(z.string()).min(1, "Select at least one time slot"),
  timezone: z.string().min(1, "Timezone is required"),
  meetingDuration: z.string().min(1, "Meeting duration is required"),
  meetingPreference: z.string().min(1, "Meeting preference is required"),
});

const termsSchema = z.object({
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  acceptPrivacy: z.boolean().refine(val => val === true, "You must accept the privacy policy"),
});

export default function DecisionMakerOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const personalForm = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    }
  });

  const professionalForm = useForm({
    resolver: zodResolver(professionalInfoSchema),
    defaultValues: {
      company: "",
      jobTitle: "",
      industry: "",
      companySize: "",
      yearsInRole: "",
      decisionAreas: "",
    }
  });

  const availabilityForm = useForm({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      preferredMeetingTimes: [],
      timezone: "",
      meetingDuration: "",
      meetingPreference: "",
    }
  });

  const termsForm = useForm({
    resolver: zodResolver(termsSchema),
    defaultValues: {
      acceptTerms: false,
      acceptPrivacy: false,
    }
  });

  const submitOnboardingMutation = useMutation({
    mutationFn: async (data) => {
      return apiRequest("POST", "/api/decision-maker/onboarding", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome to Naeberly!",
        description: "Your profile is complete. Redirecting to dashboard...",
      });
      setTimeout(() => setLocation("/decision-dashboard"), 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    },
  });

  const handlePersonalSubmit = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleProfessionalSubmit = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleAvailabilitySubmit = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(4);
  };

  const handleFinalSubmit = (data) => {
    const completeData = {
      ...formData,
      ...data,
      role: "decision_maker",
      invitationStatus: "accepted",
      engagementScore: 50,
    };
    submitOnboardingMutation.mutate(completeData);
  };

  const timeSlots = [
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM", 
    "11:00 AM - 12:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
    "4:00 PM - 5:00 PM"
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={personalForm.handleSubmit(handlePersonalSubmit)} className="space-y-6">
            <div className="text-center mb-6">
              <User className="mx-auto text-blue-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600">Let's get to know you better</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...personalForm.register("firstName")}
                  placeholder="Enter your first name"
                />
                {personalForm.formState.errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{personalForm.formState.errors.firstName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...personalForm.register("lastName")}
                  placeholder="Enter your last name"
                />
                {personalForm.formState.errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{personalForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Business Email *</Label>
              <Input
                id="email"
                type="email"
                {...personalForm.register("email")}
                placeholder="your.email@company.com"
              />
              {personalForm.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">{personalForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                {...personalForm.register("phone")}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Continue <ArrowRight className="ml-2" size={16} />
            </Button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={professionalForm.handleSubmit(handleProfessionalSubmit)} className="space-y-6">
            <div className="text-center mb-6">
              <Briefcase className="mx-auto text-blue-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-900">Professional Background</h2>
              <p className="text-gray-600">Help us understand your role and responsibilities</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  {...professionalForm.register("company")}
                  placeholder="Your company name"
                />
                {professionalForm.formState.errors.company && (
                  <p className="text-red-500 text-sm mt-1">{professionalForm.formState.errors.company.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  {...professionalForm.register("jobTitle")}
                  placeholder="e.g., VP of Sales, Director"
                />
                {professionalForm.formState.errors.jobTitle && (
                  <p className="text-red-500 text-sm mt-1">{professionalForm.formState.errors.jobTitle.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Select onValueChange={(value) => professionalForm.setValue("industry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {professionalForm.formState.errors.industry && (
                <p className="text-red-500 text-sm mt-1">{professionalForm.formState.errors.industry.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companySize">Company Size *</Label>
                <Select onValueChange={(value) => professionalForm.setValue("companySize", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10 employees">1-10 employees</SelectItem>
                    <SelectItem value="11-50 employees">11-50 employees</SelectItem>
                    <SelectItem value="51-200 employees">51-200 employees</SelectItem>
                    <SelectItem value="201-1000 employees">201-1000 employees</SelectItem>
                    <SelectItem value="1000+ employees">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
                {professionalForm.formState.errors.companySize && (
                  <p className="text-red-500 text-sm mt-1">{professionalForm.formState.errors.companySize.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="yearsInRole">Years in Current Role *</Label>
                <Select onValueChange={(value) => professionalForm.setValue("yearsInRole", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Less than 1 year">Less than 1 year</SelectItem>
                    <SelectItem value="1-2 years">1-2 years</SelectItem>
                    <SelectItem value="3-5 years">3-5 years</SelectItem>
                    <SelectItem value="6-10 years">6-10 years</SelectItem>
                    <SelectItem value="10+ years">10+ years</SelectItem>
                  </SelectContent>
                </Select>
                {professionalForm.formState.errors.yearsInRole && (
                  <p className="text-red-500 text-sm mt-1">{professionalForm.formState.errors.yearsInRole.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="decisionAreas">Decision Areas *</Label>
              <Textarea
                id="decisionAreas"
                {...professionalForm.register("decisionAreas")}
                placeholder="What types of business decisions do you make? (e.g., Technology procurement, vendor selection, budget allocation)"
                rows={3}
              />
              {professionalForm.formState.errors.decisionAreas && (
                <p className="text-red-500 text-sm mt-1">{professionalForm.formState.errors.decisionAreas.message}</p>
              )}
            </div>

            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                <ArrowLeft className="mr-2" size={16} />
                Back
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Continue <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={availabilityForm.handleSubmit(handleAvailabilitySubmit)} className="space-y-6">
            <div className="text-center mb-6">
              <Calendar className="mx-auto text-blue-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-900">Meeting Preferences</h2>
              <p className="text-gray-600">Set your availability for intro calls</p>
            </div>

            <div>
              <Label>Preferred Meeting Times *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {timeSlots.map((slot) => (
                  <div key={slot} className="flex items-center space-x-2">
                    <Checkbox
                      id={slot}
                      onCheckedChange={(checked) => {
                        const current = availabilityForm.getValues("preferredMeetingTimes") || [];
                        if (checked) {
                          availabilityForm.setValue("preferredMeetingTimes", [...current, slot]);
                        } else {
                          availabilityForm.setValue("preferredMeetingTimes", current.filter(t => t !== slot));
                        }
                      }}
                    />
                    <Label htmlFor={slot} className="text-sm">{slot}</Label>
                  </div>
                ))}
              </div>
              {availabilityForm.formState.errors.preferredMeetingTimes && (
                <p className="text-red-500 text-sm mt-1">{availabilityForm.formState.errors.preferredMeetingTimes.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone *</Label>
                <Select onValueChange={(value) => availabilityForm.setValue("timezone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                    <SelectItem value="CST">Central Time (CST)</SelectItem>
                    <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                    <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                    <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                  </SelectContent>
                </Select>
                {availabilityForm.formState.errors.timezone && (
                  <p className="text-red-500 text-sm mt-1">{availabilityForm.formState.errors.timezone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="meetingDuration">Preferred Meeting Duration *</Label>
                <Select onValueChange={(value) => availabilityForm.setValue("meetingDuration", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 minutes">15 minutes</SelectItem>
                    <SelectItem value="30 minutes">30 minutes</SelectItem>
                    <SelectItem value="45 minutes">45 minutes</SelectItem>
                    <SelectItem value="60 minutes">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
                {availabilityForm.formState.errors.meetingDuration && (
                  <p className="text-red-500 text-sm mt-1">{availabilityForm.formState.errors.meetingDuration.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="meetingPreference">Meeting Preference *</Label>
              <Select onValueChange={(value) => availabilityForm.setValue("meetingPreference", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Video Call">Video Call (Zoom/Teams)</SelectItem>
                  <SelectItem value="Phone Call">Phone Call</SelectItem>
                  <SelectItem value="In Person">In Person (if local)</SelectItem>
                  <SelectItem value="Any">Any of the above</SelectItem>
                </SelectContent>
              </Select>
              {availabilityForm.formState.errors.meetingPreference && (
                <p className="text-red-500 text-sm mt-1">{availabilityForm.formState.errors.meetingPreference.message}</p>
              )}
            </div>

            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                <ArrowLeft className="mr-2" size={16} />
                Back
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Continue <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </form>
        );

      case 4:
        return (
          <form onSubmit={termsForm.handleSubmit(handleFinalSubmit)} className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="mx-auto text-blue-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
              <p className="text-gray-600">Please review and accept our terms</p>
            </div>

            <div className="bg-gray-50 border rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="acceptTerms"
                    {...termsForm.register("acceptTerms")}
                  />
                  <div>
                    <Label htmlFor="acceptTerms" className="text-sm font-medium">
                      I accept the Terms and Conditions *
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      By checking this box, you agree to our platform's terms of service and user guidelines.
                    </p>
                  </div>
                </div>
                {termsForm.formState.errors.acceptTerms && (
                  <p className="text-red-500 text-sm">{termsForm.formState.errors.acceptTerms.message}</p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="acceptPrivacy"
                    {...termsForm.register("acceptPrivacy")}
                  />
                  <div>
                    <Label htmlFor="acceptPrivacy" className="text-sm font-medium">
                      I accept the Privacy Policy *
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      We will handle your personal information according to our privacy policy.
                    </p>
                  </div>
                </div>
                {termsForm.formState.errors.acceptPrivacy && (
                  <p className="text-red-500 text-sm">{termsForm.formState.errors.acceptPrivacy.message}</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-4">What happens next?</h3>
              <div className="text-blue-800 space-y-2 text-sm">
                <p>• Your profile will be added to our verified decision maker database</p>
                <p>• Sales reps can view your role and company information</p>
                <p>• You'll receive intro call requests based on your preferences</p>
                <p>• All meetings are voluntary - you choose which calls to accept</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(3)} className="flex-1">
                <ArrowLeft className="mr-2" size={16} />
                Back
              </Button>
              <Button
                type="submit"
                disabled={submitOnboardingMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {submitOnboardingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <CheckCircle className="ml-2" size={16} />
                  </>
                )}
              </Button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Decision Maker Onboarding</h1>
            <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}