import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { useLocation } from "wouter";
import {
  Loader2,
  Plus,
  Search,
  Store,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UserTable from "@/components/users/UserTable";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "manager" | "sales";
  is_active: boolean;
  store_id?: number;
  store?: {
    id: number;
    name: string;
    subdomain: string;
  };
  created_at: string;
  last_login?: string;
}

interface UserRole {
  value: string;
  label: string;
  description: string;
}

interface Store {
  id: number;
  name: string;
  subdomain: string;
}

export default function UserManagementPage() {
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    store_id: "",
    page: 1,
    limit: 10,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    store_id: "",
    is_active: true,
  });

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      setLocation("/auth");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  useEffect(() => {
    if (currentUser && currentUser.role !== "super_admin") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only super admins can access user management",
      });
      setLocation("/");
    }
  }, [currentUser, toast, setLocation]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === "super_admin") {
      fetchUsers();
      fetchStores();
      fetchUserRoles();
    }
  }, [isAuthenticated, currentUser, filters]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await api.get(`${API_ENDPOINTS.users.list}?${params}`);
      setUsers(response.data.data);
      setPagination(response.data.pagination);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await api.get("/api/stores");
      setStores(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.users.roles);
      setUserRoles(response.data.data);
    } catch (error) {
      console.error("Failed to fetch user roles:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "",
      store_id: "",
      is_active: true,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!editingUser && !formData.password) newErrors.password = "Password is required";
    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.role !== "super_admin" && !formData.store_id) {
      newErrors.store_id = "Store is required for non-super-admin users";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    try {
      setIsCreating(true);
      await api.post(API_ENDPOINTS.users.create, formData);

      toast({
        title: "Success",
        description: "User created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to create user",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !validateForm()) return;

    try {
      setIsUpdating(true);
      const updateData: Record<string, unknown> = { ...formData };
      if (!updateData.password) delete updateData.password;

      await api.put(API_ENDPOINTS.users.update(editingUser.id), updateData);

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to update user",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;

    try {
      setIsDeleting(true);
      await api.delete(API_ENDPOINTS.users.delete(editingUser.id));

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to delete user",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      store_id: user.store_id?.toString() || "",
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setEditingUser(user);
    setIsDeleteDialogOpen(true);
  };


  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (currentUser?.role !== "super_admin") {
    return (
      <div className="container mx-auto p-4 mt-16">
        <Alert variant="destructive">
          <AlertDescription>Access denied. Only super admins can view this page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 mt-16 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage users and their roles across all stores</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full Name"
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                </div>
              </div>
              {formData.role && formData.role !== "super_admin" && (
                <div className="space-y-2">
                  <Label htmlFor="store">Store</Label>
                  <Select
                    value={formData.store_id}
                    onValueChange={(value) => setFormData({ ...formData, store_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id.toString()}>
                          {store.name} ({store.subdomain})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.store_id && <p className="text-sm text-destructive">{errors.store_id}</p>}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={filters.role}
                onValueChange={(value) => setFilters({ ...filters, role: value, page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  {userRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Store</Label>
              <Select
                value={filters.store_id}
                onValueChange={(value) => setFilters({ ...filters, store_id: value, page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Results per page</Label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) =>
                  setFilters({ ...filters, limit: parseInt(value), page: 1 })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <UserTable
            users={users}
            userRoles={userRoles}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            isLoading={isLoading}
          />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="New password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
              </div>
            </div>
            {formData.role && formData.role !== "super_admin" && (
              <div className="space-y-2">
                <Label htmlFor="edit-store">Store</Label>
                <Select
                  value={formData.store_id}
                  onValueChange={(value) => setFormData({ ...formData, store_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name} ({store.subdomain})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.store_id && <p className="text-sm text-destructive">{errors.store_id}</p>}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {editingUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
