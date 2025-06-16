import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TeamManagement from "@/components/TeamManagement";
import CreditsOverview from "@/components/CreditsOverview";
import DMTracking from "@/components/DMTracking";
import CallActivityLog from "@/components/CallActivityLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Building2, 
  Users, 
  Shield, 
  TrendingUp, 
  Calendar, 
  Mail, 
  Settings,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  BarChart3,
  Globe,
  Lock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

// Enterprise user management schema
const enterpriseUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["sales_rep", "decision_maker"], {
    required_error: "Role is required"
  }),
  jobTitle: z.string().optional(),
  department: z.string().optional()
});

export default function EnterpriseAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // Fetch enterprise analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/enterprise-admin/analytics'],
    retry: false,
  });

  // Fetch company users
  const { data: companyUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/enterprise-admin/users'],
    retry: false,
  });

  // Fetch domain settings
  const { data: domainSettings, isLoading: domainLoading } = useQuery({
    queryKey: ['/api/enterprise-admin/domain-settings'],
    retry: false,
  });

  // Create user form
  const form = useForm({
    resolver: zodResolver(enterpriseUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "sales_rep",
      jobTitle: "",
      department: ""
    }
  });

  // Create enterprise user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      return await apiRequest('/api/enterprise-admin/create-user', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "Enterprise user has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise-admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise-admin/analytics'] });
      setIsCreateUserOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }) => {
      return await apiRequest(`/api/enterprise-admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive })
      });
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User status has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise-admin/users'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data) => {
    createUserMutation.mutate(data);
  };

  const handleStatusToggle = (userId, currentStatus) => {
    updateUserStatusMutation.mutate({
      userId,
      isActive: !currentStatus
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="text-purple-600 mr-3" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Enterprise Admin</h1>
                <p className="text-sm text-gray-600">Manage company users and settings</p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-800">
              <Shield className="mr-1 h-3 w-3" />
              Enterprise Access
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="team">Team Management</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="dms">DM Tracking</TabsTrigger>
            <TabsTrigger value="calls">Call Activity</TabsTrigger>
            <TabsTrigger value="domains">Domain Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Company Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics?.newUsersThisMonth || 0} from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sales Reps</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.activeSalesReps || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.salesRepGrowth || 0}% growth rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Meetings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.monthlyMeetings || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.meetingTrend || 0}% vs last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="text-blue-500 mr-3" size={20} />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-16 flex flex-col items-center justify-center space-y-2">
                        <UserPlus size={20} />
                        <span>Add Company User</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Enterprise User</DialogTitle>
                        <DialogDescription>
                          Add a new user to your company domain
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Email</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="sales_rep">Sales Representative</SelectItem>
                                    <SelectItem value="decision_maker">Decision Maker</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="jobTitle"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Job Title (Optional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="department"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Department (Optional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={createUserMutation.isPending}
                          >
                            {createUserMutation.isPending ? "Creating..." : "Create User"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
                    <Settings size={20} />
                    <span>Domain Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="text-green-500 mr-3" size={20} />
                  Company Users
                </CardTitle>
                <CardDescription>
                  Manage users from your verified company domain
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : companyUsers.length > 0 ? (
                  <div className="space-y-4">
                    {companyUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.role === 'sales_rep' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                            <div className="text-xs text-gray-500">{user.jobTitle} • {user.department}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={user.role === 'sales_rep' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                            {user.role === 'sales_rep' ? 'Sales Rep' : 'Decision Maker'}
                          </Badge>
                          <Button
                            variant={user.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleStatusToggle(user.id, user.isActive)}
                            disabled={updateUserStatusMutation.isPending}
                          >
                            {user.isActive ? (
                              <>
                                <XCircle className="mr-1 h-3 w-3" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="text-gray-300 mx-auto mb-4" size={48} />
                    <p className="text-gray-500">No company users found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Start by creating users for your verified domain
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Management Tab */}
          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits">
            <CreditsOverview />
          </TabsContent>

          {/* DM Tracking Tab */}
          <TabsContent value="dms">
            <DMTracking />
          </TabsContent>

          {/* Call Activity Log Tab */}
          <TabsContent value="calls">
            <CallActivityLog />
          </TabsContent>

          {/* Domain Settings Tab */}
          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="text-orange-500 mr-3" size={20} />
                  Domain Verification
                </CardTitle>
                <CardDescription>
                  Manage verified company domains for enterprise access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {domainLoading ? (
                  <div className="text-center py-8">Loading domain settings...</div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-green-900">Verified Domain</div>
                          <div className="text-sm text-green-700">{domainSettings?.verifiedDomain || 'company.com'}</div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Domain Verification Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Auto-approve users</span>
                            <Badge className="bg-blue-100 text-blue-800">Enabled</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Users with verified company email domains are automatically approved
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Domain restrictions</span>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Only users from verified domains can access enterprise features
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="text-blue-500 mr-3" size={20} />
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Sales Representatives</span>
                      <span className="font-medium">{analytics?.salesReps || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Decision Makers</span>
                      <span className="font-medium">{analytics?.decisionMakers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Users</span>
                      <span className="font-medium">{analytics?.activeUsers || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="text-green-500 mr-3" size={20} />
                    Platform Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Invitations</span>
                      <span className="font-medium">{analytics?.totalInvitations || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scheduled Meetings</span>
                      <span className="font-medium">{analytics?.scheduledMeetings || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <span className="font-medium">{analytics?.completionRate || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}