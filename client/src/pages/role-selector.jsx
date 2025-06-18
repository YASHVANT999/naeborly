import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Building } from "lucide-react";

export default function RoleSelector() {
  const [, setLocation] = useLocation();

  const roles = [
    {
      id: "sales_rep",
      title: "I'm a Sales Rep",
      description: "Connect with decision makers and book intro calls",
      icon: Briefcase,
      color: "from-purple-600 to-pink-600",
      route: "/sales-rep/onboarding"
    },
    {
      id: "decision_maker", 
      title: "I'm a Decision Maker",
      description: "Get introduced to relevant sales professionals",
      icon: Users,
      color: "from-violet-500 to-purple-600",
      route: "/decision-maker/onboarding"
    },
    {
      id: "enterprise_admin",
      title: "I'm an Enterprise Admin",
      description: "Manage team access and company settings",
      icon: Building,
      color: "from-green-500 to-green-600",
      route: "/enterprise/onboarding"
    }
  ];

  const handleRoleSelect = (route) => {
    setLocation(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-violet-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Naeborly</h1>
          <p className="text-xl text-gray-600">Choose your role to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card 
                key={role.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 hover:border-blue-300"
                onClick={() => handleRoleSelect(role.route)}
              >
                <CardHeader className="text-center">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${role.color} flex items-center justify-center`}>
                    <IconComponent className="text-white" size={32} />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {role.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-6">{role.description}</p>
                  <Button 
                    className={`w-full bg-gradient-to-r ${role.color} hover:opacity-90 text-white`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRoleSelect(role.route);
                    }}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500">
            Already have an account? 
            <Button 
              variant="link" 
              className="text-blue-600 hover:text-blue-700 p-0 ml-1"
              onClick={() => setLocation("/login")}
            >
              Sign In
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}