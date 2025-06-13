import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Loader2, Star, Shield } from "lucide-react";
import { decisionMakerPackageSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function DecisionMakerChoosePackage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(decisionMakerPackageSchema),
    defaultValues: {
      packageType: "free"
    }
  });

  const savePackageMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Submitting decision maker package data:', data);
      const response = await apiRequest('POST', '/api/decision-maker/package', data);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Decision maker package selection saved successfully:', data);
      toast({
        title: "Account Created Successfully!",
        description: "Welcome to Naeberly! Your decision maker account is now ready."
      });
      setLocation("/decision-dashboard");
    },
    onError: (error) => {
      console.error('Decision maker package save error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to complete signup. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data) => {
    savePackageMutation.mutate(data);
  };

  const packages = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out the platform",
      features: [
        "Up to 5 intro calls per month",
        "Basic scheduling tools",
        "Email notifications",
        "Community access",
        "Standard support"
      ],
      popular: false
    },
    {
      id: "basic",
      name: "Basic",
      price: "$19",
      period: "per month",
      description: "Great for active decision makers",
      features: [
        "Up to 15 intro calls per month",
        "Advanced scheduling preferences",
        "Priority call matching",
        "Detailed call analytics",
        "Email & chat support",
        "Credit earning system"
      ],
      popular: true
    },
    {
      id: "premium",
      name: "Premium",
      price: "$49",
      period: "per month",
      description: "For executive-level networking",
      features: [
        "Unlimited intro calls",
        "Executive-only matching",
        "Custom availability settings",
        "Advanced analytics dashboard",
        "Priority support",
        "Enhanced credit multipliers",
        "Exclusive networking events",
        "Personal account manager"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600">Step 5 of 5</span>
            <span className="text-sm font-medium text-gray-600">100% Complete</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
          <p className="text-gray-600">Select the plan that best fits your networking needs</p>
        </div>

        {/* Benefits Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Verified Sales Reps Only</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5" />
              <span className="text-sm font-medium">Quality Guaranteed</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span className="text-sm font-medium">Premium Networking</span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="packageType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
                    >
                      {packages.map((pkg) => (
                        <div key={pkg.id} className="relative">
                          <RadioGroupItem
                            value={pkg.id}
                            id={pkg.id}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={pkg.id}
                            className="flex flex-col cursor-pointer"
                          >
                            <Card className="peer-checked:ring-2 peer-checked:ring-purple-500 peer-checked:border-purple-500 hover:shadow-lg transition-all duration-200 h-full">
                              <CardContent className="p-6 flex flex-col h-full">
                                {pkg.popular && (
                                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-purple-600 text-white flex items-center gap-1">
                                      <Star className="h-3 w-3" />
                                      Most Popular
                                    </Badge>
                                  </div>
                                )}
                                
                                <div className="text-center mb-6">
                                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                                  <div className="mb-2">
                                    <span className="text-3xl font-bold text-purple-600">{pkg.price}</span>
                                    <span className="text-gray-600 ml-1">/{pkg.period}</span>
                                  </div>
                                  <p className="text-gray-600 text-sm">{pkg.description}</p>
                                </div>

                                <div className="flex-1">
                                  <ul className="space-y-3">
                                    {pkg.features.map((feature, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700">{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="mt-6 peer-checked:block hidden">
                                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                                    <span className="text-sm font-medium text-purple-700">Selected</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Benefits */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                What You Get with Every Plan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>LinkedIn verification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Flexible scheduling</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Quality assurance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Call recordings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Performance metrics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Community access</span>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/signup/decision-maker/nominate")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                type="submit"
                disabled={savePackageMutation.isPending}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-8"
              >
                {savePackageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Complete Signup
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}