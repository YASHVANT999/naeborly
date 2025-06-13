import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Linkedin, CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { salesRepPersonalInfoSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function SalesRepPersonalInfo() {
  const [, setLocation] = useLocation();
  const [linkedinVerified, setLinkedinVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(salesRepPersonalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      linkedinUrl: "",
      password: "",
      confirmPassword: ""
    }
  });

  const linkedinVerifyMutation = useMutation({
    mutationFn: async (linkedinUrl) => {
      const response = await apiRequest('POST', '/api/verify-linkedin', { linkedinUrl });
      return await response.json();
    },
    onSuccess: () => {
      setLinkedinVerified(true);
      toast({
        title: "LinkedIn Verified",
        description: "Your LinkedIn profile has been successfully verified."
      });
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Unable to verify LinkedIn profile. Please check the URL.",
        variant: "destructive"
      });
    }
  });

  const savePersonalInfoMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest('POST', '/api/sales-rep/personal-info', { ...data, linkedinVerified });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Information Saved",
        description: "Your personal information has been saved successfully."
      });
      setLocation("/signup/sales-rep/professional");
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save information. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleLinkedinVerify = () => {
    const linkedinUrl = form.getValues("linkedinUrl");
    if (!linkedinUrl) {
      toast({
        title: "LinkedIn URL Required",
        description: "Please enter your LinkedIn profile URL first.",
        variant: "destructive"
      });
      return;
    }
    linkedinVerifyMutation.mutate(linkedinUrl);
  };

  const onSubmit = (data) => {
    if (!linkedinVerified) {
      toast({
        title: "LinkedIn Verification Required",
        description: "Please verify your LinkedIn profile before proceeding.",
        variant: "destructive"
      });
      return;
    }
    savePersonalInfoMutation.mutate(data);
  };

  const isFormValid = form.formState.isValid && linkedinVerified;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600">Step 1 of 4</span>
            <span className="text-sm font-medium text-gray-600">25% Complete</span>
          </div>
          <Progress value={25} className="h-2" />
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Information</h1>
              <p className="text-gray-600">Let's start with your basic details and LinkedIn verification</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          First Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your first name"
                            {...field}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Last Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your last name"
                            {...field}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Email Address *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          {...field}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* LinkedIn Verification */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                      <Linkedin className="text-white" size={16} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">LinkedIn Verification Required</h3>
                      <p className="text-sm text-gray-600">
                        We verify all users through LinkedIn to maintain platform quality
                      </p>
                    </div>
                    {linkedinVerified && (
                      <CheckCircle className="text-green-600" size={20} />
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          LinkedIn Profile URL *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://linkedin.com/in/yourprofile"
                            {...field}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {linkedinVerified ? (
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <CheckCircle className="mr-2" size={16} />
                      LinkedIn Verified
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleLinkedinVerify}
                      disabled={!form.getValues("linkedinUrl") || linkedinVerifyMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {linkedinVerifyMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Linkedin className="mr-2" size={16} />
                          Verify LinkedIn Profile
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Password *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a secure password"
                              {...field}
                              className="mt-1 pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Confirm Password *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              {...field}
                              className="mt-1 pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Errors */}
                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertCircle size={16} />
                      <span className="font-medium">Please fix the following errors:</span>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button variant="ghost" onClick={() => setLocation("/")} className="text-gray-600">
            <ArrowLeft className="mr-2" size={16} />
            Back
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={!isFormValid || savePersonalInfoMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 px-8"
          >
            {savePersonalInfoMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}