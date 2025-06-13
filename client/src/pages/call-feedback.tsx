import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const CallFeedback = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState({
    overall: "",
    salesRepRating: 5,
    wouldRecommend: "",
    followUpInterest: false,
    improvementAreas: [] as string[],
    additionalComments: ""
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      const urlParams = new URLSearchParams(window.location.search);
      const callId = urlParams.get('callId');
      
      if (!callId) {
        throw new Error('Call ID not found');
      }
      
      return apiRequest('POST', `/api/calls/${callId}/feedback`, feedbackData);
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calls'] });
      setLocation('/decision-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide an overall rating",
        variant: "destructive"
      });
      return;
    }

    const feedbackData = {
      ...feedback,
      overallRating: rating,
      submittedAt: new Date().toISOString()
    };

    submitFeedbackMutation.mutate(feedbackData);
  };

  const handleImprovementAreaChange = (area: string, checked: boolean) => {
    setFeedback(prev => ({
      ...prev,
      improvementAreas: checked 
        ? [...prev.improvementAreas, area]
        : prev.improvementAreas.filter(a => a !== area)
    }));
  };

  const improvementOptions = [
    "Better preparation by sales rep",
    "More relevant product information",
    "Better time management",
    "More interactive discussion",
    "Clearer next steps",
    "Better technical setup"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/decision-dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Call Feedback</h1>
              <p className="text-gray-600">Help us improve the experience</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Overall Rating */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Experience</CardTitle>
              <CardDescription>How would you rate your overall call experience?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-4 text-lg font-medium">
                  {rating > 0 && (
                    rating === 5 ? 'Excellent' :
                    rating === 4 ? 'Good' :
                    rating === 3 ? 'Average' :
                    rating === 2 ? 'Poor' : 'Very Poor'
                  )}
                </span>
              </div>

              <div>
                <Label htmlFor="overall-feedback">What went well? What could be improved?</Label>
                <Textarea
                  id="overall-feedback"
                  placeholder="Share your thoughts about the call..."
                  value={feedback.overall}
                  onChange={(e) => setFeedback(prev => ({ ...prev, overall: e.target.value }))}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sales Rep Rating */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Representative</CardTitle>
              <CardDescription>How would you rate the sales representative?</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={feedback.salesRepRating.toString()}
                onValueChange={(value) => setFeedback(prev => ({ ...prev, salesRepRating: parseInt(value) }))}
                className="space-y-3"
              >
                {[
                  { value: "5", label: "Excellent - Very knowledgeable and professional" },
                  { value: "4", label: "Good - Knowledgeable and prepared" },
                  { value: "3", label: "Average - Adequate preparation" },
                  { value: "2", label: "Poor - Lacked preparation or knowledge" },
                  { value: "1", label: "Very Poor - Unprofessional or unprepared" }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`rep-${option.value}`} />
                    <Label htmlFor={`rep-${option.value}`} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendation</CardTitle>
              <CardDescription>Would you recommend this sales rep to others?</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={feedback.wouldRecommend}
                onValueChange={(value) => setFeedback(prev => ({ ...prev, wouldRecommend: value }))}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="recommend-yes" />
                  <Label htmlFor="recommend-yes">Yes, I would recommend them</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="maybe" id="recommend-maybe" />
                  <Label htmlFor="recommend-maybe">Maybe, with some improvements</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="recommend-no" />
                  <Label htmlFor="recommend-no">No, I would not recommend them</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Follow-up Interest */}
          <Card>
            <CardHeader>
              <CardTitle>Follow-up</CardTitle>
              <CardDescription>Are you interested in further discussions?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="follow-up"
                  checked={feedback.followUpInterest}
                  onCheckedChange={(checked) => 
                    setFeedback(prev => ({ ...prev, followUpInterest: checked === true }))
                  }
                />
                <Label htmlFor="follow-up">
                  Yes, I'm interested in scheduling a follow-up meeting
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Improvement Areas */}
          <Card>
            <CardHeader>
              <CardTitle>Areas for Improvement</CardTitle>
              <CardDescription>What could make future calls better?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {improvementOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`improvement-${option}`}
                      checked={feedback.improvementAreas.includes(option)}
                      onCheckedChange={(checked) => 
                        handleImprovementAreaChange(option, checked === true)
                      }
                    />
                    <Label htmlFor={`improvement-${option}`} className="cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Comments</CardTitle>
              <CardDescription>Any other feedback you'd like to share?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Additional thoughts or suggestions..."
                value={feedback.additionalComments}
                onChange={(e) => setFeedback(prev => ({ ...prev, additionalComments: e.target.value }))}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/decision-dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitFeedbackMutation.isPending || rating === 0}
            >
              {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CallFeedback;