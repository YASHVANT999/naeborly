import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Plus, Trash2, Mail, Users, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const inviteSchema = z.object({
  invites: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Must be a valid email address"),
  })).min(3, "You must invite at least 3 decision makers").max(10, "Maximum 10 invites allowed")
});

export default function DMInviteSystem({ onComplete }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      invites: [
        { name: "", email: "" },
        { name: "", email: "" },
        { name: "", email: "" }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "invites"
  });

  const sendInvitesMutation = useMutation({
    mutationFn: async (data) => {
      return apiRequest("POST", "/api/sales-rep/invite-decision-makers", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Invitations Sent!",
        description: `Successfully sent ${data.invitesSent} invitations. You'll earn credits when they complete onboarding.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/invitations'] });
      if (onComplete) onComplete(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitations",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await sendInvitesMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addInvite = () => {
    if (fields.length < 10) {
      append({ name: "", email: "" });
    }
  };

  const removeInvite = (index) => {
    if (fields.length > 3) {
      remove(index);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
            <Users className="text-white" size={32} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Invite Decision Makers
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Invite at least 3 decision makers to unlock database access and start earning call credits
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-blue-600 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900">How it works:</h3>
                <ul className="text-blue-800 text-sm mt-2 space-y-1">
                  <li>• Each decision maker who completes onboarding earns you 1 call credit</li>
                  <li>• Once 1+ DMs complete onboarding, you unlock the DM database</li>
                  <li>• Maximum 3 credits per DM per month</li>
                  <li>• Invites must be to verified business email domains</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Decision Maker Invitations</Label>
                <Badge variant="outline" className="text-sm">
                  {fields.length} / 10 invites
                </Badge>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`invites.${index}.name`}>Full Name *</Label>
                          <Input
                            id={`invites.${index}.name`}
                            {...form.register(`invites.${index}.name`)}
                            placeholder="e.g., John Smith"
                          />
                          {form.formState.errors.invites?.[index]?.name && (
                            <p className="text-red-500 text-sm mt-1">
                              {form.formState.errors.invites[index].name.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`invites.${index}.email`}>Business Email *</Label>
                          <Input
                            id={`invites.${index}.email`}
                            type="email"
                            {...form.register(`invites.${index}.email`)}
                            placeholder="john.smith@company.com"
                          />
                          {form.formState.errors.invites?.[index]?.email && (
                            <p className="text-red-500 text-sm mt-1">
                              {form.formState.errors.invites[index].email.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {fields.length > 3 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeInvite(index)}
                          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {form.formState.errors.invites && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.invites.message}
                </p>
              )}
            </div>

            {fields.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={addInvite}
                className="w-full border-dashed border-2 border-gray-300 hover:border-purple-400 text-gray-600 hover:text-purple-600"
              >
                <Plus className="mr-2" size={16} />
                Add Another Invite
              </Button>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">What happens next?</h3>
              <div className="text-green-800 text-sm space-y-1">
                <p>• Invitations will be sent via email with a secure onboarding link</p>
                <p>• You'll be notified when each DM completes their profile</p>
                <p>• Credits are automatically added to your account</p>
                <p>• Database access unlocks after first DM acceptance</p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || sendInvitesMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting || sendInvitesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Invitations...
                </>
              ) : (
                <>
                  <Mail className="mr-2" size={16} />
                  Send Invitations
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}