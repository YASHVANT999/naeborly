import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Users, 
  Calendar, 
  Plus, 
  TrendingUp,
  Lock,
  CalendarPlus,
  Mail,
  Building
} from "lucide-react";

export default function SalesDashboard() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [databaseUnlocked, setDatabaseUnlocked] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    decisionMakerName: "",
    decisionMakerEmail: "",
    message: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch invitations from API
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ['/api/invitations'],
    queryFn: () => fetch('/api/invitations?userId=1').then(res => res.json())
  });

  // Fetch calls from API
  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['/api/calls'],
    queryFn: () => fetch('/api/calls?userId=1').then(res => res.json())
  });

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: (invitationData) => 
      fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invitationData,
          salesRepId: 1
        })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/invitations']);
      setShowInviteModal(false);
      setInviteForm({ decisionMakerName: "", decisionMakerEmail: "", message: "" });
      toast({
        title: "Invitation sent!",
        description: "Your invitation has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    createInvitationMutation.mutate(inviteForm);
  };

  const getStatusBadge = (status) => {
    if (status === "accepted") {
      return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const simulateAcceptance = () => {
    setDatabaseUnlocked(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Rep Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, John!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800">Free • 1 DM/month</Badge>
              <Badge className="bg-blue-100 text-blue-800">Good Standing</Badge>
              <Button variant="ghost" size="sm">
                <TrendingUp className="mr-2" size={16} />
                Analytics
              </Button>
              <Button variant="ghost" size="sm">
                <Users className="mr-2" size={16} />
                Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Call Credits</p>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-purple-100 text-xs">this month</p>
                </div>
                <Phone className="text-purple-200" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">DM SMS</p>
                  <p className="text-3xl font-bold">1/1</p>
                </div>
                <Users className="text-green-200" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Upcoming Calls</p>
                  <p className="text-3xl font-bold text-gray-900">1</p>
                </div>
                <Calendar className="text-gray-400" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">DM Invitations</p>
                  <p className="text-3xl font-bold text-gray-900">1/3</p>
                </div>
                <Plus className="text-gray-400" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900">-</p>
                </div>
                <TrendingUp className="text-gray-400" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Database Access Section */}
          <div className="lg:col-span-2">
            {!databaseUnlocked ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="text-purple-500 mr-3" size={24} />
                    Database Access Locked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Lock className="text-gray-400" size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Waiting for DM Acceptance</h3>
                    <p className="text-gray-600 mb-8">
                      At least one of your invited decision makers must accept to unlock the database.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-6 mb-8">
                      <h4 className="font-semibold text-gray-900 mb-4">Invitation Status:</h4>
                      
                      <div className="space-y-4">
                        {mockInvitations.map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                invitation.status === 'accepted' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                              }`}>
                                {getInitials(invitation.name)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{invitation.name}</p>
                                <p className="text-sm text-gray-500">{invitation.email}</p>
                              </div>
                            </div>
                            {getStatusBadge(invitation.status)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={simulateAcceptance}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Simulate DM Acceptance (Demo)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="text-green-500 mr-3" size={24} />
                    Database Access Unlocked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="text-green-600" size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to the Database!</h3>
                    <p className="text-gray-600 mb-8">
                      You now have access to verified decision makers. Start booking your intro calls.
                    </p>
                    <Button className="bg-green-600 hover:bg-green-700">
                      Browse Decision Makers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Calls */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="text-blue-500 mr-3" size={20} />
                  Upcoming Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CalendarPlus className="text-gray-300 mx-auto mb-4" size={48} />
                  <p className="text-gray-500">No calls scheduled yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
