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
  Users,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
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
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { toast } = useToast();
  const { roles: userRolesList } = useAuth();

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

  const handleOpenRoleDialog = (user: UserProfile) => {
    const isSuperAdmin = userRolesList.includes("super_admin");
    
    if (!isSuperAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only super admin users can manage roles",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedUser(user);
    setSelectedRoles(userRoles[user.id] || ["student"]);
    setShowRoleDialog(true);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const saveRoles = async () => {
    if (!selectedUser) return;

    setIsUpdatingRole(true);
    try {
      const currentRoles = userRoles[selectedUser.id] || ["student"];
      const rolesToAdd = selectedRoles.filter((r) => !currentRoles.includes(r));
      const rolesToRemove = currentRoles.filter((r) => !selectedRoles.includes(r) && r !== "student");

      // Remove roles
      if (rolesToRemove.length > 0) {
        for (const role of rolesToRemove) {
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", selectedUser.id)
            .eq("role", role as "student" | "admin" | "super_admin");

          if (error) throw error;
        }
      }

      // Add roles
      if (rolesToAdd.length > 0) {
        for (const role of rolesToAdd) {
          const { error } = await supabase
            .from("user_roles")
            .insert({
              user_id: selectedUser.id,
              role: role as "student" | "admin" | "super_admin",
            });

          if (error) throw error;
        }
      }

      // Update local state
      setUserRoles((prev) => ({
        ...prev,
        [selectedUser.id]: selectedRoles,
      }));

      toast({
        title: "Roles updated",
        description: `Successfully updated roles for ${selectedUser.first_name} ${selectedUser.last_name}`,
      });

      setShowRoleDialog(false);
      setSelectedRoles([]);
    } catch (error) {
      console.error("Error updating roles:", error);
      toast({
        title: "Error",
        description: "Failed to update roles",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
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
    <div className="space-y-6 md:space-y-8 animate-fade-up">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">User Management</h2>
        </div>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage student accounts and permissions
        </p>
      </div>

      {/* Search Section */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="pl-10 rounded-lg bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
        />
      </div>

      

      {/* Users Table */}
      <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-4 sm:pb-6 border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <UserIcon className="h-5 w-5 text-primary" />
            Users List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16">
              <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <>
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
                  <UserIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No users found</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 p-4">
                    {filteredUsers.map((user) => (
                      <Card key={user.id} className="border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                        <CardContent className="p-4 space-y-3">
                          {/* User Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="h-12 w-12 shrink-0">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                                  {user.first_name[0]}{user.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleViewUser(user)} className="cursor-pointer">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  handleOpenRoleDialog(user);
                                }} className="cursor-pointer">
                                  <Shield className="h-4 w-4 mr-2" />
                                  Manage Roles
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status === "suspended" ? (
                                  <DropdownMenuItem onClick={() => handleActivateUser(user.id)} className="cursor-pointer text-green-600 dark:text-green-400">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Activate User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowSuspendDialog(true);
                                    }} 
                                    className="cursor-pointer text-red-600 dark:text-red-400"
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Suspend User
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <Separator className="my-2" />

                          {/* User Info Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Student ID</p>
                              <p className="text-sm font-semibold">{user.student_id || "—"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Status</p>
                              <div>{getStatusBadge(user)}</div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Role</p>
                              <div className="flex flex-wrap gap-1">
                                {(userRoles[user.id] || ["student"]).map((role) => (
                                  <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-[9px]">
                                    {role === "super_admin" ? "S.Admin" : role.charAt(0).toUpperCase() + role.slice(1)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Additional Info */}
                          {user.last_login_at && (
                            <div className="space-y-1 text-xs border-t border-border/30 pt-3">
                              <p className="text-muted-foreground">Last Login: {format(new Date(user.last_login_at), "MMM d, yyyy")}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader className="bg-secondary/30 hover:bg-secondary/30">
                          <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="text-xs sm:text-sm font-semibold text-foreground">User</TableHead>
                            <TableHead className="text-xs sm:text-sm font-semibold text-foreground">Student ID</TableHead>
                            <TableHead className="text-xs sm:text-sm font-semibold text-foreground">Role</TableHead>
                            <TableHead className="text-xs sm:text-sm font-semibold text-foreground">Status</TableHead>
                            <TableHead className="w-12 text-center"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id} className="hover:bg-accent/40 border-b border-border/30 transition-colors">
                              <TableCell className="py-3 sm:py-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                    <AvatarImage src={user.avatar_url || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-semibold">
                                      {user.first_name[0]}{user.last_name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs sm:text-sm truncate">
                                      {user.first_name} {user.last_name}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                      {user.email}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs sm:text-sm py-3 sm:py-4">
                                {user.student_id || "—"}
                              </TableCell>
                              <TableCell className="py-3 sm:py-4">
                                <div className="flex flex-wrap gap-1">
                                  {(userRoles[user.id] || ["student"]).map((role) => (
                                    <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-[9px] sm:text-xs">
                                      {role === "super_admin" ? "S.Admin" : role.charAt(0).toUpperCase() + role.slice(1)}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="py-3 sm:py-4">
                                {getStatusBadge(user)}
                              </TableCell>
                              <TableCell className="text-center py-3 sm:py-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewUser(user)} className="cursor-pointer">
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      handleOpenRoleDialog(user);
                                    }} className="cursor-pointer">
                                      <Shield className="h-4 w-4 mr-2" />
                                      Manage Roles
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {user.status === "suspended" ? (
                                      <DropdownMenuItem onClick={() => handleActivateUser(user.id)} className="cursor-pointer text-green-600 dark:text-green-400">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Activate User
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setShowSuspendDialog(true);
                                        }} 
                                        className="cursor-pointer text-red-600 dark:text-red-400"
                                      >
                                        <Ban className="h-4 w-4 mr-2" />
                                        Suspend User
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </>
              )}
            </>
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
            <div className="space-y-3">
              <label className="text-sm font-medium">Available Roles</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                  <input
                    type="checkbox"
                    id="student"
                    checked={selectedRoles.includes("student")}
                    onChange={() => toggleRole("student")}
                    className="h-4 w-4 rounded border border-input bg-background cursor-pointer"
                  />
                  <label htmlFor="student" className="text-sm cursor-pointer flex-1">
                    <span className="font-medium">Student</span>
                    <p className="text-xs text-muted-foreground">Default role for all users</p>
                  </label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                  <input
                    type="checkbox"
                    id="admin"
                    checked={selectedRoles.includes("admin")}
                    onChange={() => toggleRole("admin")}
                    className="h-4 w-4 rounded border border-input bg-background cursor-pointer"
                  />
                  <label htmlFor="admin" className="text-sm cursor-pointer flex-1">
                    <span className="font-medium">Admin</span>
                    <p className="text-xs text-muted-foreground">Full access to admin features</p>
                  </label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                  <input
                    type="checkbox"
                    id="super_admin"
                    checked={selectedRoles.includes("super_admin")}
                    onChange={() => toggleRole("super_admin")}
                    className="h-4 w-4 rounded border border-input bg-background cursor-pointer"
                  />
                  <label htmlFor="super_admin" className="text-sm cursor-pointer flex-1">
                    <span className="font-medium">Super Admin</span>
                    <p className="text-xs text-muted-foreground">Complete system access and control</p>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-foreground">
                <strong>Current roles:</strong> {selectedRoles.length > 0 ? selectedRoles.join(", ") : "No roles assigned"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveRoles}
              disabled={isUpdatingRole}
            >
              {isUpdatingRole ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Save Roles
            </Button>
          </DialogFooter>
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
