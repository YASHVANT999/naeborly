import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Calendar, TrendingUp, Shield, Star } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const Landing = () => {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickLogin = async (role: string) => {
    setIsLoading(true);
    try {
      let email = "";
      if (role === "admin") email = "admin@naeberly.com";
      else if (role === "sales") email = "sales@naeberly.com";
      else email = "decision@naeberly.com";
      
      await login(email, "password");
      
      // Navigate based on role
      if (role === "admin") setLocation("/admin-dashboard");
      else if (role === "sales") setLocation("/sales-dashboard");
      else setLocation("/decision-dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    // Auto-redirect based on role
    if (user.role === "admin") setLocation("/admin-dashboard");
    else if (user.role === "sales_rep") setLocation("/sales-dashboard");
    else setLocation("/decision-dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Naeberly</h1>
              <Badge variant="secondary" className="ml-2">Sales Platform</Badge>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl lg:text-6xl">
            Transform Your Sales Process
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Connect sales representatives with decision makers through intelligent matching, 
            streamlined scheduling, and comprehensive analytics.
          </p>
          
          {/* Demo Login Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => handleQuickLogin("admin")} 
              disabled={isLoading}
              className="px-8 py-3 text-lg"
            >
              <Shield className="mr-2 h-5 w-5" />
              Demo Admin Access
            </Button>
            <Button 
              onClick={() => handleQuickLogin("sales")} 
              disabled={isLoading}
              variant="outline"
              className="px-8 py-3 text-lg"
            >
              <Users className="mr-2 h-5 w-5" />
              Demo Sales Rep
            </Button>
            <Button 
              onClick={() => handleQuickLogin("decision")} 
              disabled={isLoading}
              variant="outline"
              className="px-8 py-3 text-lg"
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Demo Decision Maker
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-gray-900">
              Everything You Need to Succeed
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Powerful tools designed to streamline your sales operations
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600" />
                <CardTitle>Smart Matching</CardTitle>
                <CardDescription>
                  AI-powered matching between sales reps and decision makers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Industry-specific matching
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Skill-based recommendations
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Success rate optimization
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-blue-600" />
                <CardTitle>Easy Scheduling</CardTitle>
                <CardDescription>
                  Seamless calendar integration and appointment management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Automated scheduling
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Time zone handling
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Reminder notifications
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>
                  Comprehensive reporting and performance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Real-time dashboards
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Conversion tracking
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Performance metrics
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">Naeberly</h4>
              <p className="text-gray-400">
                Transforming sales through intelligent connections and streamlined processes.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Product</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Enterprise</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Community</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Naeberly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;