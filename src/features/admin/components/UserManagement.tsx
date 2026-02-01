import { useState, useEffect } from "react";
import {
  Search,
  MoreHorizontal,
  Shield,
  User as UserIcon,
  Loader2,
  AlertTriangle,
  Ban,
  CheckCircle,
  Eye,
  Mail,
  Calendar,
  GraduationCap,
  X,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type UserStatus = "active" | "inactive" | "suspended";

interface UserProfile {
  id: string;
  student_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  status: UserStatus;
  program: string | null;
  year_level: number | null;
  created_at: string;
  last_login_at: string | null;
  suspension_reason: string | null;
  avatar_url: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface UserStats {
  total_conversations: number;
  total_messages: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showUserSheet, setShowUserSheet] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const rolesByUser: Record<string, string[]> = {};
      (rolesData as UserRole[]).forEach((r) => {
        if (!rolesByUser[r.user_id]) {
          rolesByUser[r.user_id] = [];
        }
        rolesByUser[r.user_id].push(r.role);
      });

      setUsers(profilesData as UserProfile[]);
      setUserRoles(rolesByUser);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId);

      const { data: messages } = await supabase
        .from("messages")
        .select("id")
        .eq("sender_id", userId);

      setUserStats({
        total_conversations: conversations?.length || 0,
        total_messages: messages?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserSheet(true);
    fetchUserStats(user.id);
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.student_id && user.student_id.toLowerCase().includes(searchLower))
    );
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      default:
        return "secondary";
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;

    setIsSuspending(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "suspended" as UserStatus,
          suspension_reason: suspensionReason || "No reason provided",
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, status: "suspended" as UserStatus, suspension_reason: suspensionReason }
            : u
        )
      );

      toast({
        title: "User suspended",
        description: `${selectedUser.first_name} ${selectedUser.last_name} has been suspended.`,
      });

      setShowSuspendDialog(false);
      setSuspensionReason("");
      setSelectedUser(null);
    } catch (error) {
      console.error("Error suspending user:", error);
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    } finally {
      setIsSuspending(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "active" as UserStatus,
          suspension_reason: null,
        })
        .eq("id", userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: "active" as UserStatus, suspension_reason: null }
            : u
        )
      );

      toast({
        title: "User activated",
        description: "User has been reactivated.",
      });
    } catch (error) {
      console.error("Error activating user:", error);
      toast({
        title: "Error",
        description: "Failed to activate user",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (user: UserProfile) => {
    switch (user.status) {
      case "suspended":
        return (
          <Badge variant="destructive" className="text-xs gap-1">
            <Ban className="h-3 w-3" />
            Suspended
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary" className="text-xs">
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge
            variant="default"
            className="text-xs bg-green-500/20 text-green-500 border-green-500/30 gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-lg md:text-xl font-semibold">User Management</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Manage student accounts and permissions
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="pl-10 rounded-xl bg-secondary/50"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 md:p-4">
            <p className="text-xs text-muted-foreground">Total Users</p>
            <p className="text-xl md:text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 md:p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-xl md:text-2xl font-bold text-green-500">
              {users.filter((u) => u.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 md:p-4">
            <p className="text-xs text-muted-foreground">Suspended</p>
            <p className="text-xl md:text-2xl font-bold text-destructive">
              {users.filter((u) => u.status === "suspended").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 md:p-4">
            <p className="text-xs text-muted-foreground">Admins</p>
            <p className="text-xl md:text-2xl font-bold text-primary">
              {Object.values(userRoles).filter((roles) => roles.includes("admin") || roles.includes("super_admin")).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Student ID</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Program</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-accent/50">
                        <TableCell>
                          <div className="flex items-center gap-2 md:gap-3">
                            <Avatar className="h-8 w-8 md:h-9 md:w-9">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                                {user.first_name[0]}{user.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-xs md:text-sm truncate max-w-[120px] md:max-w-none">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[120px] md:max-w-none">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs hidden md:table-cell">
                          {user.student_id || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(userRoles[user.id] || ["student"]).map((role) => (
                              <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-[10px] md:text-xs">
                                {role === "super_admin" ? "S.Admin" : role.charAt(0).toUpperCase() + role.slice(1)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(user)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs hidden lg:table-cell">
                          {user.program ? user.program.split(" - ")[0] : "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setShowRoleDialog(true);
                              }}>
                                <Shield className="h-4 w-4 mr-2" />
                                Manage Roles
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "suspended" ? (
                                <DropdownMenuItem onClick={() => handleActivateUser(user.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowSuspendDialog(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* User Details Sheet */}
      <Sheet open={showUserSheet} onOpenChange={setShowUserSheet}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedUser?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {selectedUser?.first_name[0]}{selectedUser?.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">
                  {selectedUser?.first_name} {selectedUser?.last_name}
                </p>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedUser?.email}
                </p>
              </div>
            </SheetTitle>
          </SheetHeader>

          {selectedUser && (
            <ScrollArea className="h-[calc(100vh-10rem)] mt-6">
              <div className="space-y-6 pr-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedUser)}
                </div>

                {selectedUser.status === "suspended" && selectedUser.suspension_reason && (
                  <Card className="border-destructive/50 bg-destructive/10">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Suspension Reason</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedUser.suspension_reason}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Basic Information</h4>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 text-sm">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Student ID:</span>
                      <span className="font-medium">{selectedUser.student_id || "Not set"}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedUser.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Program:</span>
                      <span className="font-medium">{selectedUser.program || "Not set"}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Year Level:</span>
                      <span className="font-medium">{selectedUser.year_level || "Not set"}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Roles */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Roles & Permissions</h4>
                  <div className="flex flex-wrap gap-2">
                    {(userRoles[selectedUser.id] || ["student"]).map((role) => (
                      <Badge key={role} variant={getRoleBadgeVariant(role)}>
                        {role === "super_admin" ? "Super Admin" : role.charAt(0).toUpperCase() + role.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Activity Stats */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Activity Statistics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="border-border/50">
                      <CardContent className="p-3 text-center">
                        <MessageCircle className="h-5 w-5 mx-auto text-primary mb-1" />
                        <p className="text-lg font-bold">{userStats?.total_conversations || 0}</p>
                        <p className="text-xs text-muted-foreground">Conversations</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardContent className="p-3 text-center">
                        <Mail className="h-5 w-5 mx-auto text-primary mb-1" />
                        <p className="text-lg font-bold">{userStats?.total_messages || 0}</p>
                        <p className="text-xs text-muted-foreground">Messages Sent</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Timestamps */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Account Activity</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined:</span>
                      <span>{format(new Date(selectedUser.created_at), "PPP")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Login:</span>
                      <span>
                        {selectedUser.last_login_at 
                          ? format(new Date(selectedUser.last_login_at), "PPP")
                          : "Never"
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  {selectedUser.status === "suspended" ? (
                    <Button 
                      className="flex-1" 
                      onClick={() => {
                        handleActivateUser(selectedUser.id);
                        setShowUserSheet(false);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activate User
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => {
                        setShowUserSheet(false);
                        setShowSuspendDialog(true);
                      }}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend User
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Role Management Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              {selectedUser && `Manage roles for ${selectedUser.first_name} ${selectedUser.last_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Current roles: {selectedUser && (userRoles[selectedUser.id] || ["student"]).join(", ")}
            </p>
            <p className="text-sm text-muted-foreground">
              Role management requires super admin privileges and is configured in the database.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Suspend User
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `You are about to suspend ${selectedUser.first_name} ${selectedUser.last_name}'s account.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for suspension</Label>
              <Textarea
                id="reason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter the reason for suspending this account..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This reason will be displayed to the user when they try to log in.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendUser}
              disabled={isSuspending}
            >
              {isSuspending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
