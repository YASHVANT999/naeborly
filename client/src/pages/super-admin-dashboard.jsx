import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Shield, 
  Users, 
  Phone, 
  CreditCard, 
  Activity, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  LogOut,
  UserCheck,
  UserX,
  Calendar
} from "lucide-react";
import { createSubscriptionPlanSchema, updateSubscriptionPlanSchema, updateUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function SuperAdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userFilters, setUserFilters] = useState({ role: 'all', search: '', page: 1 });
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);

  // Analytics Queries
  const { data: userAnalytics } = useQuery({
    queryKey: ['/api/super-admin/analytics/users'],
    retry: false,
  });

  const { data: callAnalytics } = useQuery({
    queryKey: ['/api/super-admin/analytics/calls'],
    retry: false,
  });

  const { data: subscriptionAnalytics } = useQuery({
    queryKey: ['/api/super-admin/analytics/subscriptions'],
    retry: false,
  });

  // Users Query
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/super-admin/users', userFilters],
    retry: false,
  });

  // Subscription Plans Query
  const { data: subscriptionPlans } = useQuery({
    queryKey: ['/api/super-admin/subscription-plans'],
    retry: false,
  });

  // Activity Logs Query
  const { data: activityLogs } = useQuery({
    queryKey: ['/api/super-admin/activity-logs', { page: 1, limit: 10 }],
    retry: false,
  });

  // Edit User Form
  const editUserForm = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "",
      packageType: "",
      isActive: true,
      standing: "good"
    }
  });

  // Create Plan Form
  const createPlanForm = useForm({
    resolver: zodResolver(createSubscriptionPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      billingInterval: "monthly",
      features: [],
      maxCallCredits: 0,
      maxInvitations: 0,
      prioritySupport: false,
      bestSeller: false,
      isActive: true
    }
  });

  // Edit Plan Form
  const editPlanForm = useForm({
    resolver: zodResolver(updateSubscriptionPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      billingInterval: "monthly",
      features: [],
      maxCallCredits: 0,
      maxInvitations: 0,
      prioritySupport: false,
      bestSeller: false,
      isActive: true
    }
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      return await apiRequest(`/api/super-admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/analytics/users'] });
      setIsEditUserOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id) => {
      return await apiRequest(`/api/super-admin/users/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/analytics/users'] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData) => {
      return await apiRequest('/api/super-admin/subscription-plans', {
        method: 'POST',
        body: JSON.stringify(planData)
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Subscription plan created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      setIsCreatePlanOpen(false);
      createPlanForm.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      return await apiRequest(`/api/super-admin/subscription-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Subscription plan updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      setIsEditPlanOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id) => {
      return await apiRequest(`/api/super-admin/subscription-plans/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Subscription plan deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/logout', { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: "Logged Out", description: "You have been logged out successfully" });
      setLocation("/super-admin/login");
    }
  });

  const handleEditUser = (user) => {
    setSelectedUser(user);
    editUserForm.reset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      packageType: user.packageType,
      isActive: user.isActive,
      standing: user.standing
    });
    setIsEditUserOpen(true);
  };

  const handleDeleteUser = (userId) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const onEditUserSubmit = (data) => {
    updateUserMutation.mutate({ id: selectedUser.id, updates: data });
  };

  const onCreatePlanSubmit = (data) => {
    createPlanMutation.mutate(data);
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    editPlanForm.reset({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingInterval: plan.billingInterval,
      features: plan.features,
      maxCallCredits: plan.maxCallCredits,
      maxInvitations: plan.maxInvitations,
      prioritySupport: plan.prioritySupport,
      bestSeller: plan.bestSeller,
      isActive: plan.isActive
    });
    setIsEditPlanOpen(true);
  };

  const handleDeletePlan = (planId) => {
    if (confirm("Are you sure you want to delete this subscription plan? This action cannot be undone.")) {
      deletePlanMutation.mutate(planId);
    }
  };

  const onEditPlanSubmit = (data) => {
    updatePlanMutation.mutate({ id: selectedPlan.id, updates: data });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'sales_rep': return 'bg-blue-100 text-blue-800';
      case 'decision_maker': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
                <p className="text-sm text-gray-600">Naeberly Platform Management</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => logoutMutation.mutate()}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscription Plans</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userAnalytics?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{userAnalytics?.newUsersThisMonth || 0} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{callAnalytics?.totalCalls || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {callAnalytics?.completionRate || 0}% completion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userAnalytics?.activeUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {userAnalytics?.inactiveUsers || 0} inactive
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subscriptionAnalytics?.premiumUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {subscriptionAnalytics?.premiumPercentage || 0}% of total
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>Breakdown by user roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Sales Representatives</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {userAnalytics?.salesReps || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Decision Makers</span>
                      <Badge className="bg-green-100 text-green-800">
                        {userAnalytics?.decisionMakers || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Breakdown</CardTitle>
                  <CardDescription>Users by subscription type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Free Plan</span>
                      <Badge variant="outline">
                        {subscriptionAnalytics?.freeUsers || 0} ({subscriptionAnalytics?.freePercentage || 0}%)
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Basic Plan</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {subscriptionAnalytics?.basicUsers || 0} ({subscriptionAnalytics?.basicPercentage || 0}%)
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Premium Plan</span>
                      <Badge className="bg-purple-100 text-purple-800">
                        {subscriptionAnalytics?.premiumUsers || 0} ({subscriptionAnalytics?.premiumPercentage || 0}%)
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10"
                      value={userFilters.search}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                    />
                  </div>
                  <Select
                    value={userFilters.role}
                    onValueChange={(value) => setUserFilters(prev => ({ ...prev, role: value, page: 1 }))}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="sales_rep">Sales Rep</SelectItem>
                      <SelectItem value="decision_maker">Decision Maker</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.isActive)}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.packageType}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {usersData?.total > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-700">
                      Showing {usersData.users?.length || 0} of {usersData.total} users
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Plans Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>Manage platform subscription plans</CardDescription>
                  </div>
                  <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Subscription Plan</DialogTitle>
                        <DialogDescription>
                          Add a new subscription plan to the platform
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...createPlanForm}>
                        <form onSubmit={createPlanForm.handleSubmit(onCreatePlanSubmit)} className="space-y-4">
                          <FormField
                            control={createPlanForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Plan Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Premium Plan" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createPlanForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., $29" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createPlanForm.control}
                            name="maxCallCredits"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Call Credits</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="10" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createPlanForm.control}
                            name="maxInvitations"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Invitations</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="5" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex gap-4">
                            <FormField
                              control={createPlanForm.control}
                              name="prioritySupport"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 flex-1">
                                  <div className="space-y-0.5">
                                    <FormLabel>Priority Support</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={createPlanForm.control}
                              name="bestSeller"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 flex-1">
                                  <div className="space-y-0.5">
                                    <FormLabel>Best Seller</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={createPlanMutation.isPending}>
                              Create Plan
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subscriptionPlans?.map((plan) => (
                    <Card key={plan.id} className="relative">
                      {plan.bestSeller && (
                        <div className="absolute -top-3 -right-3">
                          <Badge className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs">
                            Best Seller
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {plan.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-3xl font-bold">{plan.price}</div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Call Credits:</span>
                              <span>{plan.maxCallCredits === -1 ? 'Unlimited' : plan.maxCallCredits}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Invitations:</span>
                              <span>{plan.maxInvitations === -1 ? 'Unlimited' : plan.maxInvitations}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Priority Support:</span>
                              <span>{plan.prioritySupport ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Best Seller:</span>
                              <span>{plan.bestSeller ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPlan(plan)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePlan(plan.id)}
                              className="flex-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Call Analytics</CardTitle>
                  <CardDescription>Platform call performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Calls</span>
                      <span className="font-semibold">{callAnalytics?.totalCalls || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Completed</span>
                      <span className="font-semibold text-green-600">{callAnalytics?.completedCalls || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Scheduled</span>
                      <span className="font-semibold text-blue-600">{callAnalytics?.scheduledCalls || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cancelled</span>
                      <span className="font-semibold text-red-600">{callAnalytics?.cancelledCalls || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Rating</span>
                      <span className="font-semibold">{callAnalytics?.averageRating || 0}/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>Platform user growth metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Users</span>
                      <span className="font-semibold">{userAnalytics?.totalUsers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>New This Month</span>
                      <span className="font-semibold text-green-600">{userAnalytics?.newUsersThisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Growth Rate</span>
                      <span className="font-semibold">{userAnalytics?.userGrowthRate || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Active Users</span>
                      <span className="font-semibold text-blue-600">{userAnalytics?.activeUsers || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Monitor platform activity and admin actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Activity logging system is being set up.</p>
                    <p className="text-sm">All admin actions will be tracked here.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Modify user information and settings
            </DialogDescription>
          </DialogHeader>
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4">
              <FormField
                control={editUserForm.control}
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
                control={editUserForm.control}
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
              <FormField
                control={editUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sales_rep">Sales Rep</SelectItem>
                        <SelectItem value="decision_maker">Decision Maker</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editUserForm.control}
                name="packageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select package" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  Update User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>Update the subscription plan details</DialogDescription>
          </DialogHeader>
          <Form {...editPlanForm}>
            <form onSubmit={editPlanForm.handleSubmit(onEditPlanSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editPlanForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter plan name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editPlanForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., $29/month" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editPlanForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Plan description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editPlanForm.control}
                  name="billingInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Interval</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interval" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editPlanForm.control}
                  name="maxCallCredits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Call Credits</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter credits (-1 for unlimited)" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editPlanForm.control}
                  name="maxInvitations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Invitations</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter invitations (-1 for unlimited)" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-4">
                  <FormField
                    control={editPlanForm.control}
                    name="prioritySupport"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Priority Support</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editPlanForm.control}
                  name="bestSeller"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Best Seller</FormLabel>
                        <FormDescription>Only one plan can be marked as best seller</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editPlanForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>Plan visibility status</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={updatePlanMutation.isPending}>
                  Update Plan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}