import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Settings
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

// Invitation schema
const inviteRepSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  permissions: z.array(z.string()).default([])
});

// Permission update schema
const updatePermissionsSchema = z.object({
  permissions: z.array(z.string())
});

export default function TeamManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch company users (sales reps)
  const { data: companyUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/company-users'],
    retry: false,
  });

  // Fetch available decision makers for permissions
  const { data: decisionMakers = [] } = useQuery({
    queryKey: ['/api/enterprise-admin/decision-makers'],
    retry: false,
  });

  // Invitation form
  const inviteForm = useForm({
    resolver: zodResolver(inviteRepSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      jobTitle: "",
      department: "",
      permissions: []
    }
  });

  // Permissions form
  const permissionsForm = useForm({
    resolver: zodResolver(updatePermissionsSchema),
    defaultValues: {
      permissions: []
    }
  });

  // Invite new sales rep mutation
  const inviteRepMutation = useMutation({
    mutationFn: async (userData) => {
      return await apiRequest('/api/company-users/invite', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Sales representative invitation has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company-users'] });
      setIsInviteOpen(false);
      inviteForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    }
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }) => {
      return await apiRequest(`/api/company-users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "User status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company-users'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }) => {
      return await apiRequest(`/api/company-users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions })
      });
    },
    onSuccess: () => {
      toast({
        title: "Permissions Updated",
        description: "User permissions have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company-users'] });
      setIsPermissionsOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    }
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: async (userId) => {
      return await apiRequest(`/api/company-users/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "User Removed",
        description: "Sales representative has been removed from the team",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company-users'] });
    },
    onError: (error) => {
      toast({
        title: "Removal Failed",
        description: error.message || "Failed to remove user",
        variant: "destructive",
      });
    }
  });

  const onInviteSubmit = (data) => {
    inviteRepMutation.mutate(data);
  };

  const onPermissionsSubmit = (data) => {
    if (selectedUser) {
      updatePermissionsMutation.mutate({
        userId: selectedUser.id,
        permissions: data.permissions
      });
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    updateStatusMutation.mutate({ userId, status: newStatus });
  };

  const handleRemoveUser = (userId) => {
    if (confirm("Are you sure you want to remove this sales representative? This action cannot be undone.")) {
      removeUserMutation.mutate(userId);
    }
  };

  const openPermissionsDialog = (user) => {
    setSelectedUser(user);
    permissionsForm.setValue("permissions", user.permissions || []);
    setIsPermissionsOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="mr-1 h-3 w-3" />Suspended</Badge>;
      case 'invited':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Invited</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600">Manage your internal sales representatives</p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Sales Rep
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Sales Representative</DialogTitle>
              <DialogDescription>
                Send an invitation to a new sales rep to join your team
              </DialogDescription>
            </DialogHeader>
            <Form {...inviteForm}>
              <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={inviteForm.control}
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
                    control={inviteForm.control}
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
                  control={inviteForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john@techize.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={inviteForm.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Sales Representative" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={inviteForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Sales" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={inviteRepMutation.isPending}
                >
                  {inviteRepMutation.isPending ? "Sending Invitation..." : "Send Invitation"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="text-blue-500 mr-3" size={20} />
            Sales Representatives
          </CardTitle>
          <CardDescription>
            Manage your company's sales team members and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8">Loading team members...</div>
          ) : companyUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">{user.jobTitle}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {user.permissions?.length || 0} DMs assigned
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPermissionsDialog(user)}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, 'suspended')}
                          >
                            Suspend
                          </Button>
                        ) : user.status === 'suspended' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, 'active')}
                          >
                            Activate
                          </Button>
                        ) : null}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="text-gray-300 mx-auto mb-4" size={48} />
              <p className="text-gray-500">No sales representatives found</p>
              <p className="text-sm text-gray-400 mt-2">
                Start by inviting team members to join your sales team
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Assign or revoke access to decision makers for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <Form {...permissionsForm}>
            <form onSubmit={permissionsForm.handleSubmit(onPermissionsSubmit)} className="space-y-4">
              <FormField
                control={permissionsForm.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decision Maker Access</FormLabel>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {decisionMakers.map((dm) => (
                        <div key={dm.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={field.value?.includes(dm.id)}
                            onCheckedChange={(checked) => {
                              const currentPermissions = field.value || [];
                              if (checked) {
                                field.onChange([...currentPermissions, dm.id]);
                              } else {
                                field.onChange(currentPermissions.filter(id => id !== dm.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{dm.firstName} {dm.lastName}</div>
                            <div className="text-sm text-gray-500">{dm.company} • {dm.jobTitle}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsPermissionsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updatePermissionsMutation.isPending}
                >
                  {updatePermissionsMutation.isPending ? "Updating..." : "Update Permissions"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}