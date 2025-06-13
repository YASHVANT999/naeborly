import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ArrowLeft, TrendingUp, Users, Target } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const PostCallEvaluation = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [evaluation, setEvaluation] = useState({
    callOutcome: "",
    nextSteps: "",
    followUpRequired: false,
    followUpDate: "",
    leadQuality: 5,
    meetingEffectiveness: 5,
    decisionMakerEngagement: 5,
    productInterest: "",
    budgetDiscussion: false,
    timelineDiscussion: false,
    decisionProcess: "",
    competitors: "",
    challenges: "",
    opportunities: "",
    salesRepNotes: "",
    internalNotes: ""
  });

  const submitEvaluationMutation = useMutation({
    mutationFn: async (evaluationData: any) => {
      const urlParams = new URLSearchParams(window.location.search);
      const callId = urlParams.get('callId');
      
      if (!callId) {
        throw new Error('Call ID not found');
      }
      
      return apiRequest('POST', `/api/calls/${callId}/evaluation`, evaluationData);
    },
    onSuccess: () => {
      toast({
        title: "Evaluation submitted",
        description: "Post-call evaluation has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calls'] });
      setLocation('/sales-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit evaluation",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const evaluationData = {
      ...evaluation,
      submittedAt: new Date().toISOString(),
      submittedBy: user?.id
    };

    submitEvaluationMutation.mutate(evaluationData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/sales-dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Post-Call Evaluation</h1>
              <p className="text-gray-600">Document call outcomes and next steps</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Call Outcome */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Call Outcome
              </CardTitle>
              <CardDescription>Summarize the main outcome of this call</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={evaluation.callOutcome}
                onValueChange={(value) => setEvaluation(prev => ({ ...prev, callOutcome: value }))}
                className="space-y-3"
              >
                {[
                  { value: "qualified", label: "Qualified Lead - High Interest" },
                  { value: "interested", label: "Interested - Needs Nurturing" },
                  { value: "neutral", label: "Neutral - Information Gathering" },
                  { value: "not-interested", label: "Not Interested" },
                  { value: "not-qualified", label: "Not Qualified" }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`outcome-${option.value}`} />
                    <Label htmlFor={`outcome-${option.value}`} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>What are the agreed next actions?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="next-steps">Action Items</Label>
                <Textarea
                  id="next-steps"
                  placeholder="List the specific next steps agreed upon..."
                  value={evaluation.nextSteps}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, nextSteps: e.target.value }))}
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="follow-up-required"
                  checked={evaluation.followUpRequired}
                  onCheckedChange={(checked) => 
                    setEvaluation(prev => ({ ...prev, followUpRequired: checked === true }))
                  }
                />
                <Label htmlFor="follow-up-required">Follow-up meeting required</Label>
              </div>

              {evaluation.followUpRequired && (
                <div>
                  <Label htmlFor="follow-up-date">Follow-up Date</Label>
                  <Input
                    id="follow-up-date"
                    type="date"
                    value={evaluation.followUpDate}
                    onChange={(e) => setEvaluation(prev => ({ ...prev, followUpDate: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Ratings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Performance Assessment
              </CardTitle>
              <CardDescription>Rate different aspects of the meeting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Lead Quality (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={evaluation.leadQuality}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, leadQuality: parseInt(e.target.value) }))}
                  className="mt-2 w-32"
                />
              </div>

              <div>
                <Label>Meeting Effectiveness (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={evaluation.meetingEffectiveness}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, meetingEffectiveness: parseInt(e.target.value) }))}
                  className="mt-2 w-32"
                />
              </div>

              <div>
                <Label>Decision Maker Engagement (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={evaluation.decisionMakerEngagement}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, decisionMakerEngagement: parseInt(e.target.value) }))}
                  className="mt-2 w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Discussion Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Discussion Details
              </CardTitle>
              <CardDescription>What topics were covered during the call?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product-interest">Product/Service Interest</Label>
                <Textarea
                  id="product-interest"
                  placeholder="Which products or services showed the most interest?"
                  value={evaluation.productInterest}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, productInterest: e.target.value }))}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="budget-discussion"
                    checked={evaluation.budgetDiscussion}
                    onCheckedChange={(checked) => 
                      setEvaluation(prev => ({ ...prev, budgetDiscussion: checked === true }))
                    }
                  />
                  <Label htmlFor="budget-discussion">Budget discussed</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="timeline-discussion"
                    checked={evaluation.timelineDiscussion}
                    onCheckedChange={(checked) => 
                      setEvaluation(prev => ({ ...prev, timelineDiscussion: checked === true }))
                    }
                  />
                  <Label htmlFor="timeline-discussion">Timeline discussed</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="decision-process">Decision Making Process</Label>
                <Textarea
                  id="decision-process"
                  placeholder="Who else is involved in the decision? What's their process?"
                  value={evaluation.decisionProcess}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, decisionProcess: e.target.value }))}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Competitive Intelligence */}
          <Card>
            <CardHeader>
              <CardTitle>Competitive Intelligence</CardTitle>
              <CardDescription>Information about competitors and market challenges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="competitors">Competitors Mentioned</Label>
                <Textarea
                  id="competitors"
                  placeholder="Which competitors were discussed?"
                  value={evaluation.competitors}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, competitors: e.target.value }))}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="challenges">Challenges & Pain Points</Label>
                <Textarea
                  id="challenges"
                  placeholder="What challenges is the prospect facing?"
                  value={evaluation.challenges}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, challenges: e.target.value }))}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="opportunities">Opportunities Identified</Label>
                <Textarea
                  id="opportunities"
                  placeholder="What opportunities did you identify?"
                  value={evaluation.opportunities}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, opportunities: e.target.value }))}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>Any other important information from the call</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sales-notes">Sales Rep Notes</Label>
                <Textarea
                  id="sales-notes"
                  placeholder="Your observations and insights from the call..."
                  value={evaluation.salesRepNotes}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, salesRepNotes: e.target.value }))}
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="internal-notes">Internal Notes</Label>
                <Textarea
                  id="internal-notes"
                  placeholder="Private notes for internal team use only..."
                  value={evaluation.internalNotes}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, internalNotes: e.target.value }))}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/sales-dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitEvaluationMutation.isPending}
            >
              {submitEvaluationMutation.isPending ? 'Submitting...' : 'Submit Evaluation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostCallEvaluation;