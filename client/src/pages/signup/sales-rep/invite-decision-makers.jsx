import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Plus, Trash2, Loader2 } from "lucide-react";
import { salesRepInvitesSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function InviteDecisionMakers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [decisionMakers, setDecisionMakers] = useState([{ name: "", email: "" }]);

  const form = useForm({
    resolver: zodResolver(salesRepInvitesSchema),
    defaultValues: {
      decisionMakers: [{ name: "", email: "" }]
    }
  });

  const saveInvitesMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Submitting invites data:', data);
      const response = await apiRequest('POST', '/api/sales-rep/invites', data);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Invites saved successfully:', data);
      toast({
        title: "Invitations Prepared",
        description: "Your invitation list has been saved successfully."
      });
      setLocation("/signup/sales-rep/package");
    },
    onError: (error) => {
      console.error('Invites save error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save invitations. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data) => {
    // Filter out empty entries
    const validDecisionMakers = data.decisionMakers.filter(dm => dm.name || dm.email);
    saveInvitesMutation.mutate({ decisionMakers: validDecisionMakers });
  };

  const addDecisionMaker = () => {
    const newDecisionMakers = [...decisionMakers, { name: "", email: "" }];
    setDecisionMakers(newDecisionMakers);
    form.setValue("decisionMakers", newDecisionMakers);
  };

  const removeDecisionMaker = (index) => {
    if (decisionMakers.length > 1) {
      const newDecisionMakers = decisionMakers.filter((_, i) => i !== index);
      setDecisionMakers(newDecisionMakers);
      form.setValue("decisionMakers", newDecisionMakers);
    }
  };

  const skipStep = () => {
    toast({
      title: "Step Skipped",
      description: "You can add decision makers later from your dashboard."
    });
    setLocation("/signup/sales-rep/package");
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
              <p className="text-gray-600">Add decision makers you'd like to connect with (optional)</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {decisionMakers.map((_, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`decisionMakers.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Decision maker's name"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  const newDecisionMakers = [...decisionMakers];
                                  newDecisionMakers[index].name = e.target.value;
                                  setDecisionMakers(newDecisionMakers);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`decisionMakers.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="email@company.com"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  const newDecisionMakers = [...decisionMakers];
                                  newDecisionMakers[index].email = e.target.value;
                                  setDecisionMakers(newDecisionMakers);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {decisionMakers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeDecisionMaker(index)}
                        className="mb-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addDecisionMaker}
                  className="w-full flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Decision Maker
                </Button>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/signup/sales-rep/professional")}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={skipStep}
                      className="text-gray-600"
                    >
                      Skip for now
                    </Button>

                    <Button
                      type="submit"
                      disabled={saveInvitesMutation.isPending}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      {saveInvitesMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}