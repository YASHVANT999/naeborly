import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  PhoneCall, 
  Mail, 
  TrendingUp, 
  Activity, 
  Shield,
  Settings,
  CreditCard,
  Ban,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  DollarSign,
  Calendar,
  Target
} from 'lucide-react';

const AdminDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // Mock data for demonstration
  const stats = {
    totalUsers: 1247,
    userGrowth: 12.5,
    activeSubscriptions: 324,
    subscriptionGrowth: 8.3,
    totalRevenue: 45789,
    revenueGrowth: 15.2,
    supportTickets: 23
  };

  const users = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@techcorp.com',
      role: 'sales_rep',
      status: 'active',
      subscription: { plan: 'Premium' },
      lastActive: '2024-01-15'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@startup.io',
      role: 'decision_maker',
      status: 'active',
      subscription: { plan: 'Basic' },
      lastActive: '2024-01-14'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike@enterprise.com',
      role: 'sales_rep',
      status: 'inactive',
      subscription: null,
      lastActive: '2024-01-10'
    },
    {
      id: '4',
      name: 'Lisa Chen',
      email: 'lisa@bigcorp.com',
      role: 'decision_maker',
      status: 'active',
      subscription: { plan: 'Pro Team' },
      lastActive: '2024-01-16'
    },
    {
      id: '5',
      name: 'Admin User',
      email: 'admin@naeberly.com',
      role: 'admin',
      status: 'active',
      subscription: null,
      lastActive: '2024-01-16'
    }
  ];

  const subscriptions = [
    {
      id: 'sub_1',
      user: { name: 'John Smith', email: 'john@techcorp.com' },
      plan: 'Premium',
      status: 'active',
      amount: 49,
      nextBilling: '2024-02-15'
    },
    {
      id: 'sub_2',
      user: { name: 'Sarah Johnson', email: 'sarah@startup.io' },
      plan: 'Basic',
      status: 'active',
      amount: 19,
      nextBilling: '2024-02-14'
    },
    {
      id: 'sub_3',
      user: { name: 'Lisa Chen', email: 'lisa@bigcorp.com' },
      plan: 'Pro Team',
      status: 'active',
      amount: 99,
      nextBilling: '2024-02-16'
    }
  ];

  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: any }) =>
      apiRequest('PUT', `/api/admin/users/${userId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User updated successfully" });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest('DELETE', `/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: any) =>
      apiRequest('POST', '/api/admin/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User created successfully" });
      setIsCreateUserOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Subscription management mutations
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ subscriptionId, updates }: { subscriptionId: string; updates: any }) =>
      apiRequest('PUT', `/api/admin/subscriptions/${subscriptionId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      toast({ title: "Success", description: "Subscription updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: (subscriptionId: string) =>
      apiRequest('POST', `/api/admin/subscriptions/${subscriptionId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      toast({ title: "Success", description: "Subscription cancelled successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Filter users based on search and filters
  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const StatCard = ({ title, value, icon: Icon, description, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {trend && (
            <span className={`inline-flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </span>
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );

  const UserEditDialog = ({ user, onClose, onSave }: any) => {
    const [formData, setFormData] = useState(user || {});

    const handleSave = () => {
      onSave(user.id, formData);
    };

    return (
      <Dialog open={!!user} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales_rep">Sales Representative</SelectItem>
                  <SelectItem value="decision_maker">Decision Maker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage users, subscriptions, and platform settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Admin Access
              </Badge>
              <Button variant="outline">Settings</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            trend={stats?.userGrowth}
          />
          <StatCard
            title="Active Subscriptions"
            value={stats?.activeSubscriptions || 0}
            icon={CreditCard}
            trend={stats?.subscriptionGrowth}
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats?.totalRevenue || 0}`}
            icon={DollarSign}
            trend={stats?.revenueGrowth}
          />
          <StatCard
            title="Support Tickets"
            value={stats?.supportTickets || 0}
            icon={Mail}
            description="Open tickets"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage all platform users and their permissions</CardDescription>
                  </div>
                  <Button onClick={() => setIsCreateUserOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters and Search */}
                <div className="flex items-center justify-between mb-6 space-x-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="sales_rep">Sales Rep</SelectItem>
                        <SelectItem value="decision_maker">Decision Maker</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.status === 'active' ? 'default' : 'secondary'}
                              className={user.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.subscription ? (
                              <Badge variant="outline">{user.subscription.plan}</Badge>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this user? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteUserMutation.mutate(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>Monitor and manage all user subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Next Billing</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions?.map((subscription: any) => (
                        <TableRow key={subscription.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{subscription.user?.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{subscription.user?.name}</div>
                                <div className="text-sm text-gray-500">{subscription.user?.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{subscription.plan}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={subscription.status === 'active' ? 'default' : 'secondary'}
                              className={subscription.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {subscription.status}
                            </Badge>
                          </TableCell>
                          <TableCell>${subscription.amount}/month</TableCell>
                          <TableCell>
                            {subscription.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => cancelSubscriptionMutation.mutate(subscription.id)}
                              >
                                <Ban className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    User growth chart would go here
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Revenue trends chart would go here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Configure global platform settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Platform Name</Label>
                  <Input defaultValue="Naeberly" />
                </div>
                <div>
                  <Label>Support Email</Label>
                  <Input defaultValue="support@naeberly.com" />
                </div>
                <div>
                  <Label>Default User Role</Label>
                  <Select defaultValue="sales_rep">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_rep">Sales Representative</SelectItem>
                      <SelectItem value="decision_maker">Decision Maker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <UserEditDialog
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={(userId: string, updates: any) => updateUserMutation.mutate({ userId, updates })}
      />

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the platform</DialogDescription>
          </DialogHeader>
          {/* Create user form would go here */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;