import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";

export default function InviteDecisionMakers() {
  const [, setLocation] = useLocation();
  const [decisionMakers, setDecisionMakers] = useState([
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" }
  ]);

  const handleInputChange = (index, field, value) => {
    setDecisionMakers(prev => 
      prev.map((dm, i) => i === index ? { ...dm, [field]: value } : dm)
    );
  };

  const handleNext = () => {
    setLocation("/signup/sales-rep/package");
  };

  const handleBack = () => {
    setLocation("/signup/sales-rep/professional");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600">Step 3 of 4</span>
            <span className="text-sm font-medium text-gray-600">75% Complete</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Invite Decision Makers</h1>
              <p className="text-gray-600">Invite up to 3 decision makers to join your network</p>
            </div>

            <div className="space-y-6">
              {decisionMakers.map((dm, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`dmName${index}`} className="text-sm font-medium text-gray-700">
                      Decision Maker {index + 1} Name
                    </Label>
                    <Input
                      id={`dmName${index}`}
                      placeholder={index === 0 ? "34" : index === 1 ? "234" : "234"}
                      value={dm.name}
                      onChange={(e) => handleInputChange(index, "name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`dmEmail${index}`} className="text-sm font-medium text-gray-700">
                      Decision Maker {index + 1} Email
                    </Label>
                    <Input
                      id={`dmEmail${index}`}
                      type="email"
                      placeholder={index === 0 ? "34" : index === 1 ? "324" : "234"}
                      value={dm.email}
                      onChange={(e) => handleInputChange(index, "email", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button variant="ghost" onClick={handleBack} className="text-gray-600">
            <ArrowLeft className="mr-2" size={16} />
            Back
          </Button>
          <Button
            onClick={handleNext}
            className="bg-purple-600 hover:bg-purple-700 px-8"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}