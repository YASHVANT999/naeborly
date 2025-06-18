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
import { CheckCircle, ArrowRight, ArrowLeft, Loader2, ExternalLink, User, Briefcase, Globe, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  linkedinUrl: z.string()
    .url("Must be a valid URL")
    .refine(url => url.includes("linkedin.com"), "Must be a LinkedIn URL"),
  email: z.string().email("Must be a valid email address"),
});

const professionalInfoSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  industry: z.string().min(1, "Industry is required"),
  companySize: z.string().min(1, "Company size is required"),
  yearsInRole: z.string().min(1, "Years in role is required"),
});

const salesInfoSchema = z.object({
  icpDescription: z.string().min(10, "Please provide at least 10 characters"),
  productType: z.string().min(1, "Product type is required"),
  salesRegion: z.string().min(1, "Sales region is required"),
  targetIndustries: z.string().min(1, "Target industries are required"),
});

export default function SalesRepOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [linkedinVerified, setLinkedinVerified] = useState(false);
  const [formData, setFormData] = useState({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Step 1: Personal Information
  const personalForm = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      linkedinUrl: "",
      email: "",
    }
  });

  // Step 2: Professional Information  
  const professionalForm = useForm({
    resolver: zodResolver(professionalInfoSchema),
    defaultValues: {
      company: "",
      jobTitle: "",
      industry: "",
      companySize: "",
      yearsInRole: "",
    }
  });

  // Step 3: Sales Information
  const salesForm = useForm({
    resolver: zodResolver(salesInfoSchema),
    defaultValues: {
      icpDescription: "",
      productType: "",
      salesRegion: "",
      targetIndustries: "",
    }
  });

  const submitOnboardingMutation = useMutation({
    mutationFn: async (data) => {
      return apiRequest("POST", "/api/sales-rep/onboarding", data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your onboarding is complete. Next step: invite decision makers...",
      });
      setTimeout(() => setLocation("/invite-decision-makers"), 2000);
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

  const handleSalesSubmit = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(4);
  };

  const handleLinkedinVerification = () => {
    const linkedinUrl = formData.linkedinUrl;
    if (linkedinUrl) {
      window.open(linkedinUrl, '_blank');
      setTimeout(() => {
        setLinkedinVerified(true);
        setCurrentStep(5);
      }, 3000);
    }
  };

  const handleFinalSubmit = () => {
    const completeData = {
      ...formData,
      linkedinVerified,
      packageType: "free",
      role: "sales_rep"
    };
    submitOnboardingMutation.mutate(completeData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={personalForm.handleSubmit(handlePersonalSubmit)} className="space-y-6">
            <div className="text-center mb-6">
              <User className="mx-auto text-purple-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600">Let's start with your basic details</p>
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
              <Label htmlFor="email">Company Email *</Label>
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
              <Label htmlFor="linkedinUrl">LinkedIn Profile URL *</Label>
              <Input
                id="linkedinUrl"
                {...personalForm.register("linkedinUrl")}
                placeholder="https://linkedin.com/in/your-profile"
              />
              {personalForm.formState.errors.linkedinUrl && (
                <p className="text-red-500 text-sm mt-1">{personalForm.formState.errors.linkedinUrl.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              Continue <ArrowRight className="ml-2" size={16} />
            </Button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={professionalForm.handleSubmit(handleProfessionalSubmit)} className="space-y-6">
            <div className="text-center mb-6">
              <Briefcase className="mx-auto text-purple-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-900">Professional Information</h2>
              <p className="text-gray-600">Tell us about your company and role</p>
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
                  placeholder="e.g., Sales Manager"
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
                <Label htmlFor="yearsInRole">Years in Sales Role *</Label>
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

            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                <ArrowLeft className="mr-2" size={16} />
                Back
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                Continue <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={salesForm.handleSubmit(handleSalesSubmit)} className="space-y-6">
            <div className="text-center mb-6">
              <Target className="mx-auto text-purple-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-900">Sales Information</h2>
              <p className="text-gray-600">Help us understand your sales focus</p>
            </div>

            <div>
              <Label htmlFor="icpDescription">Ideal Customer Profile (ICP) *</Label>
              <Textarea
                id="icpDescription"
                {...salesForm.register("icpDescription")}
                placeholder="Describe your ideal customer profile..."
                rows={4}
              />
              {salesForm.formState.errors.icpDescription && (
                <p className="text-red-500 text-sm mt-1">{salesForm.formState.errors.icpDescription.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productType">Product Type *</Label>
                <Select onValueChange={(value) => salesForm.setValue("productType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SaaS">Software as a Service (SaaS)</SelectItem>
                    <SelectItem value="Hardware">Hardware/Physical Products</SelectItem>
                    <SelectItem value="Services">Professional Services</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {salesForm.formState.errors.productType && (
                  <p className="text-red-500 text-sm mt-1">{salesForm.formState.errors.productType.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="salesRegion">Sales Region *</Label>
                <Select onValueChange={(value) => salesForm.setValue("salesRegion", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="North America">North America</SelectItem>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                    <SelectItem value="Latin America">Latin America</SelectItem>
                    <SelectItem value="Global">Global</SelectItem>
                  </SelectContent>
                </Select>
                {salesForm.formState.errors.salesRegion && (
                  <p className="text-red-500 text-sm mt-1">{salesForm.formState.errors.salesRegion.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="targetIndustries">Target Industries *</Label>
              <Input
                id="targetIndustries"
                {...salesForm.register("targetIndustries")}
                placeholder="e.g., Technology, Healthcare, Finance"
              />
              {salesForm.formState.errors.targetIndustries && (
                <p className="text-red-500 text-sm mt-1">{salesForm.formState.errors.targetIndustries.message}</p>
              )}
            </div>

            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                <ArrowLeft className="mr-2" size={16} />
                Back
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                Continue <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </form>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <Globe className="mx-auto text-purple-600 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900">LinkedIn Verification</h2>
            <p className="text-gray-600">
              We need to verify your LinkedIn profile to ensure authenticity.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Verification Steps:</h3>
              <ol className="text-left text-blue-800 space-y-1">
                <li>1. Click the button below to open your LinkedIn profile</li>
                <li>2. Verify that the profile information matches your form data</li>
                <li>3. Return to this page and click "I've Verified"</li>
              </ol>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => window.open(formData.linkedinUrl, '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="mr-2" size={16} />
                Open LinkedIn Profile
              </Button>

              <Button
                onClick={handleLinkedinVerification}
                variant="outline"
                className="w-full border-green-600 text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="mr-2" size={16} />
                I've Verified My Profile
              </Button>
            </div>

            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setCurrentStep(3)} 
              className="text-gray-500"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Previous Step
            </Button>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Registration</h2>
            <p className="text-gray-600">
              Great! Your LinkedIn profile has been verified. Click below to complete your onboarding.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-4">What's Next?</h3>
              <div className="text-left text-green-800 space-y-2">
                <p>• Access to the sales rep dashboard</p>
                <p>• Ability to invite decision makers</p>
                <p>• Start earning call credits</p>
                <p>• Book intro calls with verified DMs</p>
              </div>
            </div>

            <Button
              onClick={handleFinalSubmit}
              disabled={submitOnboardingMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {submitOnboardingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing Registration...
                </>
              ) : (
                <>
                  Complete Registration
                  <CheckCircle className="ml-2" size={16} />
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Sales Rep Onboarding</h1>
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