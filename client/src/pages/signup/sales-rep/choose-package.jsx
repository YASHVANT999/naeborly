import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, User, Users, Crown, Shield } from "lucide-react";

export default function SalesRepChoosePackage() {
  const [, setLocation] = useLocation();
  const [selectedPackage, setSelectedPackage] = useState("free");

  const handleBack = () => {
    setLocation("/signup/sales-rep/invite-decision-makers");
  };

  const handleComplete = () => {
    // Complete registration and redirect to sales dashboard
    setLocation("/sales-dashboard");
  };

  const packages = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      description: "Get started for free",
      icon: User,
      features: [
        "1 DM per month",
        "1 call credit/month",
        "Basic matching"
      ],
      color: "gray",
      selected: selectedPackage === "free"
    },
    {
      id: "basic",
      name: "Basic",
      price: "$17.99",
      period: "per month",
      description: "Essential features for growing sales",
      icon: Users,
      features: [
        "3 DMs per month",
        "5 call credits/month",
        "Email access",
        "Priority matching"
      ],
      color: "blue",
      selected: selectedPackage === "basic"
    },
    {
      id: "premium",
      name: "Premium",
      price: "$49.99",
      period: "per month",
      badge: "Popular",
      description: "Advanced tools for serious sales professionals",
      icon: Crown,
      features: [
        "10 DMs per month",
        "15 call credits/month",
        "Unlimited email access",
        "Advanced analytics"
      ],
      color: "purple",
      selected: selectedPackage === "premium"
    },
    {
      id: "pro-team",
      name: "Pro Team",
      price: "$99.99",
      period: "per month",
      description: "Enterprise solution for sales teams",
      icon: Shield,
      features: [
        "25 DMs per month",
        "50 call credits/month",
        "Team management",
        "Priority support"
      ],
      color: "green",
      selected: selectedPackage === "pro-team"
    }
  ];

  const getColorClasses = (color, selected) => {
    const colors = {
      gray: selected ? "border-gray-600 bg-gray-50" : "border-gray-200",
      blue: selected ? "border-blue-600 bg-blue-50" : "border-gray-200",
      purple: selected ? "border-purple-600 bg-purple-50" : "border-gray-200",
      green: selected ? "border-green-600 bg-green-50" : "border-gray-200"
    };
    return colors[color] || colors.gray;
  };

  const getIconColor = (color) => {
    const colors = {
      gray: "text-gray-600",
      blue: "text-blue-600",
      purple: "text-purple-600",
      green: "text-green-600"
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600">Step 4 of 4</span>
            <span className="text-sm font-medium text-gray-600">100% Complete</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Package</h1>
          <p className="text-gray-600">Select the plan that fits your needs</p>
        </div>

        {/* Package Options */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {packages.map((pkg) => {
            const IconComponent = pkg.icon;
            return (
              <Card
                key={pkg.id}
                className={`relative cursor-pointer transition-all border-2 ${
                  getColorClasses(pkg.color, pkg.selected)
                } ${pkg.selected ? "shadow-xl" : "shadow-lg hover:shadow-xl"}`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white">
                      {pkg.badge}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                      pkg.color === 'gray' ? 'bg-gray-100' :
                      pkg.color === 'blue' ? 'bg-blue-100' :
                      pkg.color === 'purple' ? 'bg-purple-100' : 'bg-green-100'
                    }`}>
                      <IconComponent 
                        className={getIconColor(pkg.color)} 
                        size={24} 
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{pkg.price}</div>
                    {pkg.period && <div className="text-sm text-gray-500">{pkg.period}</div>}
                  </div>

                  <div className="space-y-2 mb-6">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="text-green-600 mr-2 flex-shrink-0" size={14} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {pkg.selected && (
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        pkg.color === 'gray' ? 'bg-gray-100 text-gray-700' :
                        pkg.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        pkg.color === 'purple' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                      }`}>
                        <CheckCircle className="mr-1" size={12} />
                        Selected
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={handleBack} className="text-gray-600">
            <ArrowLeft className="mr-2" size={16} />
            Back
          </Button>
          <Button
            onClick={handleComplete}
            className="bg-purple-600 hover:bg-purple-700 px-8"
          >
            <CheckCircle className="mr-2" size={16} />
            Complete Registration
          </Button>
        </div>
      </div>
    </div>
  );
}