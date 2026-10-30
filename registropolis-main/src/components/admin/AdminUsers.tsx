
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '@/services/apiService';
import { userManagementService } from '@/services/admin';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { Shield, UserPlus, Trash2, Edit, Eye, RefreshCw, MessageSquare, Ban, Clock3 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { isStaffRole, STAFF_ROLES, type StaffRole } from '@/config/adminAccess';

interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  role?: string;
  staffRole?: StaffRole;
  createdAt?: string;
}

interface AdminUsersProps {
  piiMasked?: boolean;
  canManageUsers?: boolean;
  canRestrictUsers?: boolean;
}

type UserTimeline = {
  account: { id: string; name: string; email?: string; role: string; createdAt: string };
  timeline: Array<{ id: string; type: string; timestamp: string; summary: string; status: string }>;
};

const ROLE_LABELS: Record<StaffRole, string> = {
  superadmin: 'Super Admin',
  operations: 'Operations & CRM',
  moderator: 'Trust Moderator',
  support: 'Support Specialist',
};

const AdminUsers: React.FC<AdminUsersProps> = ({
  piiMasked = true,
  canManageUsers = true,
  canRestrictUsers = true,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminRole, setNewAdminRole] = useState<StaffRole | ''>('');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [timelineUser, setTimelineUser] = useState<User | null>(null);
  const [timeline, setTimeline] = useState<UserTimeline | null>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const { toast: uiToast } = useToast();
  const { addAdmin, user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getUsers(!piiMasked);
      setUsers(response.data || []);
    } catch (error) {
      uiToast({
        variant: "destructive",
        title: "Error fetching users",
        description: "Could not load users list."
      });
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, [uiToast, piiMasked]);
  
  const handleAddAdmin = async () => {
    if (!newAdminEmail) {
      toast.error('Please enter an email address');
      return;
    }
    if (!isStaffRole(newAdminRole)) {
      toast.error('Select a staff access level');
      return;
    }
    
    try {
      await addAdmin(newAdminEmail, newAdminRole);
      await fetchUsers();
      setNewAdminEmail('');
      setNewAdminRole('');
      setIsDialogOpen(false);
      toast.success(`User with email ${newAdminEmail} was granted ${ROLE_LABELS[newAdminRole]} access`);
    } catch (error) {
      toast.error('Error adding admin');
      console.error('Error adding admin:', error);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await userManagementService.deleteUser(selectedUser.id);
      toast.success(`User ${selectedUser.name || selectedUser.id} has been deleted`);
      setIsDeleteConfirmOpen(false);
      await fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };
  
  const handleUpdateUserRole = async () => {
    if (!selectedUser) return;
    if (selectedRole !== 'user' && !isStaffRole(selectedRole)) {
      toast.error('Select a valid staff access level');
      return;
    }
    
    try {
      await userManagementService.updateUserRole(selectedUser.id, selectedRole);
      toast.success(`User ${selectedUser.name || selectedUser.id}'s staff access has been updated`);
      setIsEditRoleDialogOpen(false);
      await fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
      console.error('Error updating user role:', error);
    }
  };
  
  const handleRestrictUser = (user: User) => {
    setSelectedUser(user);
    toast('Opening restrict user dialog...', {
      description: `To restrict ${user.name || user.id}, please use the Restrictions tab.`
    });
  };

  const openTimeline = async (target: User) => {
    setTimelineUser(target);
    setTimeline(null);
    setIsTimelineLoading(true);
    try {
      const response = await adminAPI.getUserTimeline(target.id);
      setTimeline({ account: response.account, timeline: response.timeline || [] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load account history');
    } finally {
      setIsTimelineLoading(false);
    }
  };

  useEffect(() => {
    const userId = searchParams.get('user');
    if (!userId || isLoading) return;
    const target = users.find(candidate => candidate.id === userId);
    if (target) {
      void openTimeline(target);
      setSearchParams({ tab: 'users' }, { replace: true });
    }
  }, [isLoading, searchParams, setSearchParams, users]);
  
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phoneNumber?.includes(searchQuery)
  );
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-2">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button onClick={fetchUsers} variant="outline" size="icon" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          {canManageUsers && <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Shield className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Staff Access</DialogTitle>
                <DialogDescription>
                  Enter an existing account email and choose the staff access level it needs.
                </DialogDescription>
              </DialogHeader>
              <Input
                placeholder="Email address"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="mt-4"
              />
              <div className="mt-4">
                <label className="block text-sm font-medium">Role:</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => {
                    setNewAdminRole(isStaffRole(e.target.value) ? e.target.value : '');
                  }}
                  className="border rounded p-2 mt-1"
                  required
                >
                  <option value="">Select a staff access level</option>
                  {STAFF_ROLES.map(role => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddAdmin} disabled={!newAdminEmail || !isStaffRole(newAdminRole)}>
                  <Shield className="mr-2 h-4 w-4" /> Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                    <TableCell>
                      {isStaffRole(user.staffRole) ? (
                        <Badge variant="secondary" className="bg-blue-500">{ROLE_LABELS[user.staffRole]}</Badge>
                      ) : user.role === 'admin' ? (
                        <Badge variant="outline">Staff access not assigned</Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" title="View account history" onClick={() => void openTimeline(user)}>
                          <Clock3 className="h-4 w-4" />
                        </Button>
                      {(canManageUsers || canRestrictUsers) && user.id !== currentUser?.id && <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {canManageUsers && user.id !== currentUser?.id && <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setSelectedRole(
                              isStaffRole(user.staffRole)
                                ? user.staffRole
                                : user.role === 'moderator'
                                  ? 'moderator'
                                  : 'user',
                            );
                            setIsEditRoleDialogOpen(true);
                          }}>
                            <Shield className="h-4 w-4 mr-2" /> 
                            Assign Staff Access
                          </DropdownMenuItem>}
                          {canRestrictUsers && user.id !== currentUser?.id && <DropdownMenuItem onClick={() => handleRestrictUser(user)}>
                            <Ban className="h-4 w-4 mr-2" /> 
                            Restrict User
                          </DropdownMenuItem>}
                          {canManageUsers && user.id !== currentUser?.id && <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteConfirmOpen(true);
                          }}>
                            <Trash2 className="h-4 w-4 mr-2 text-destructive" /> 
                            <span className="text-destructive">Delete User</span>
                          </DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No users found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!timelineUser} onOpenChange={open => { if (!open) setTimelineUser(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer history</DialogTitle>
            <DialogDescription>
              {timeline?.account.name || timelineUser?.name || 'Account'} · {timeline?.account.email || 'Email masked'}
            </DialogDescription>
          </DialogHeader>
          {isTimelineLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading account history…</div>
          ) : timeline ? (
            <div className="space-y-3">
              <div className="rounded-lg border p-3 text-sm">
                <div><strong>Account ID:</strong> {timeline.account.id}</div>
                <div><strong>Access:</strong> {timeline.account.role}</div>
                <div><strong>Joined:</strong> {new Date(timeline.account.createdAt).toLocaleString()}</div>
              </div>
              {timeline.timeline.length ? timeline.timeline.map(event => (
                <div key={event.id} className="flex gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{event.summary}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{event.type} · {event.status}</div>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</time>
                </div>
              )) : <p className="py-6 text-center text-sm text-muted-foreground">No account history has been recorded.</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Account history could not be loaded.</p>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Role Dialog */}
      {canManageUsers && <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff Access</DialogTitle>
            <DialogDescription>
              Choose a staff access level for {selectedUser?.name || selectedUser?.id}. Selecting User removes staff access.
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              {STAFF_ROLES.map(role => (
                <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateUserRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
      
      {/* Delete Confirmation */}
      {canManageUsers && <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the user {selectedUser?.name || selectedUser?.email || selectedUser?.id}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteUser}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </div>
  );
};

export default AdminUsers;
