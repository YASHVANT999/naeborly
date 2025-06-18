import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Star, ArrowRight, Clock, Shield, Zap } from "lucide-react";
import DMInviteSystem from "./dm-invite-system";

export default function DMInviteLanding() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [, setLocation] = useLocation();

  const handleInviteComplete = (data) => {
    // Redirect to dashboard after successful invites
    setTimeout(() => {
      setLocation("/sales-dashboard");
    }, 2000);
  };

  if (showInviteForm) {
    return <DMInviteSystem onComplete={handleInviteComplete} />;
  }

  const benefits = [
    {
      icon: Users,
      title: "Unlock DM Database",
      description: "Get access to verified decision makers when at least 1 invite is accepted",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: Star,
      title: "Earn Call Credits",
      description: "Receive 1 credit for each DM who completes onboarding (max 3 per DM monthly)",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: Clock,
      title: "Quality Introductions",
      description: "All meetings are pre-qualified with mutual interest confirmation",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      icon: Shield,
      title: "Verified Profiles",
      description: "All decision makers go through LinkedIn verification and profile validation",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    }
  ];

  const requirements = [
    "Minimum 3 decision maker invitations required",
    "Invites must be to verified business email domains", 
    "Each DM must have decision-making authority",
    "LinkedIn verification completed for your profile"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
            <Users className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Invite Decision Makers to Unlock Access
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Build the community by contributing verified decision makers. The more you contribute, 
            the more opportunities you unlock.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <Card key={index} className="border-2 hover:border-purple-300 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${benefit.bgColor} rounded-lg flex items-center justify-center`}>
                      <IconComponent className={benefit.color} size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <Card className="mb-8 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Zap className="mr-3 text-blue-600" size={24} />
              How the Credit System Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  1
                </div>
                <h4 className="font-semibold mb-2">Invite DMs</h4>
                <p className="text-sm text-gray-600">Send invitations to qualified decision makers</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  2
                </div>
                <h4 className="font-semibold mb-2">DM Onboards</h4>
                <p className="text-sm text-gray-600">They complete profile and calendar setup</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  3
                </div>
                <h4 className="font-semibold mb-2">Earn Credits</h4>
                <p className="text-sm text-gray-600">Get 1 credit to book intro calls</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="mb-8 border-2 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Requirements & Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requirements.map((requirement, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="text-amber-600" size={20} />
                  <span className="text-gray-700">{requirement}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button
            onClick={() => setShowInviteForm(true)}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-semibold"
          >
            Start Inviting Decision Makers
            <ArrowRight className="ml-2" size={20} />
          </Button>
          
          <div className="text-sm text-gray-500">
            Need help finding decision makers? 
            <Button 
              variant="link" 
              className="text-purple-600 hover:text-purple-700 p-0 ml-1"
              onClick={() => setLocation("/help/finding-dms")}
            >
              View our guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}