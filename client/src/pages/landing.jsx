import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserCheck, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Mail, 
  Users,
  Check,
  ArrowRight,
  LogIn,
  User
} from "lucide-react";


export default function Landing() {
  const [, setLocation] = useLocation();
  const features = [
    {
      icon: UserCheck,
      title: "Verified Decision-Makers",
      description: "Access a growing database of verified executives and decision-makers",
      color: "purple"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling", 
      description: "Automated 15-minute intro calls with integrated calendar booking",
      color: "blue"
    },
    {
      icon: TrendingUp,
      title: "AI-Powered Insights",
      description: "Custom call preparation and performance analysis for better outcomes",
      color: "green"
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "Traffic light validation system ensures top-quality experiences",
      color: "indigo"
    },
    {
      icon: Mail,
      title: "Email Access",
      description: "Premium access to decision-maker email addresses with approval",
      color: "yellow"
    },
    {
      icon: Users,
      title: "Pro Teams",
      description: "Enterprise solutions for entire sales teams with advanced guides",
      color: "purple"
    }
  ];

  const plans = [
    {
      name: "Basic",
      price: "Free",
      features: [
        "Invite 3 decision-makers",
        "Access to calls only", 
        "Basic analytics"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline"
    },
    {
      name: "Premium", 
      price: "$29",
      period: "/month",
      popular: true,
      features: [
        "Everything in Basic",
        "Access to email addresses",
        "50 emails per month",
        "Advanced analytics"
      ],
      buttonText: "Upgrade to Premium",
      buttonVariant: "default"
    },
    {
      name: "Pro Team",
      price: "$99", 
      period: "/month",
      features: [
        "Everything in Premium",
        "Up to 10 team members",
        "5 calls per rep/month",
        "Team analytics dashboard"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline"
    }
  ];

  const getIconColor = (color) => {
    const colors = {
      purple: "text-purple-600",
      blue: "text-blue-600", 
      green: "text-green-600",
      indigo: "text-indigo-600",
      yellow: "text-yellow-600"
    };
    return colors[color] || "text-purple-600";
  };

  const getBgColor = (color) => {
    const colors = {
      purple: "bg-purple-100",
      blue: "bg-blue-100",
      green: "bg-green-100", 
      indigo: "bg-indigo-100",
      yellow: "bg-yellow-100"
    };
    return colors[color] || "bg-purple-100";
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-purple-700">Naeberly</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <a href="#features" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
                  <a href="#how-it-works" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">How It Works</a>
                  <a href="#pricing" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Pricing</a>
                </div>
              </div>
              <Link href="/admin-dashboard">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <LogIn className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-purple-600">Warm Intros</span>
            <br />
            to Decision-Makers
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect sales reps with verified executives through a community-driven platform. 
            Contribute decision-makers, earn credits, book quality intro calls.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/sales-dashboard">
              <Button 
                size="lg" 
                className="bg-purple-600 text-white px-8 py-4 text-lg font-semibold hover:bg-purple-700 transform hover:scale-105 transition-all shadow-lg"
              >
                I'm a Sales Rep <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
            <Link href="/decision-dashboard">
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-purple-600 text-purple-600 px-8 py-4 text-lg font-semibold hover:bg-purple-50"
              >
                I'm a Decision Maker ✓
              </Button>
            </Link>
            <Link href="/admin-dashboard">
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-red-600 text-red-600 px-8 py-4 text-lg font-semibold hover:bg-red-50"
              >
                Admin Panel 🔐
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How Naeberly Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How Naeberly Works</h2>
            <p className="text-xl text-gray-600">
              A contribution-based community where quality connections drive mutual success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="hover:shadow-xl transition-all border border-gray-100">
                  <CardContent className="p-8">
                    <div className={`w-12 h-12 ${getBgColor(feature.color)} rounded-xl flex items-center justify-center mb-6`}>
                      <IconComponent className={`${getIconColor(feature.color)} text-xl`} size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-600">Flexible options for individuals and teams</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-2 border-purple-600 shadow-xl' : 'border border-gray-200 shadow-lg'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-purple-600 mb-1">{plan.price}</div>
                    {plan.period && <div className="text-gray-500">{plan.period}</div>}
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-600">
                        <Check className="text-green-600 mr-3" size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.buttonVariant}
                    className={`w-full py-3 font-semibold ${
                      plan.buttonVariant === 'default' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : plan.name === 'Pro Team'
                        ? 'border-blue-600 text-blue-600 hover:bg-blue-50'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Connecting?</h2>
          <p className="text-xl text-purple-100 mb-10">
            Join the community of sales professionals and decision-makers building meaningful business relationships
          </p>
          <Link href="/sales-dashboard">
            <Button 
              size="lg"
              className="bg-white text-purple-600 px-8 py-4 text-lg font-bold hover:bg-gray-100 transform hover:scale-105 transition-all shadow-lg"
            >
              Get Started as Sales Rep
            </Button>
          </Link>
        </div>
      </section>


    </div>
  );
}
