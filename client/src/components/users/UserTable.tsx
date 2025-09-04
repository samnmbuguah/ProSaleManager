import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Store, Calendar, Users, Shield } from "lucide-react";
import { 
  ResponsiveTable, 
  createTextColumn, 
  createBadgeColumn, 
  createDateColumn, 
  createActionsColumn,
  ResponsiveTableColumn 
} from "@/components/ui/responsive-table";

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

interface UserTableProps {
  users: User[];
  userRoles: UserRole[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading?: boolean;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  userRoles, 
  onEdit, 
  onDelete, 
  isLoading = false 
}) => {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive" as const;
      case "admin":
        return "default" as const;
      case "manager":
        return "secondary" as const;
      case "sales":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Shield className="h-3 w-3" />;
      case "admin":
        return <Users className="h-3 w-3" />;
      case "manager":
        return <Users className="h-3 w-3" />;
      case "sales":
        return <Users className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const columns: ResponsiveTableColumn<User>[] = [
    {
      key: "user",
      label: "User",
      priority: 1,
      render: (user) => (
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      ),
      mobileRender: (user) => (
        <div className="text-right">
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      priority: 2,
      render: (user) => (
        <Badge variant={getRoleBadgeVariant(user.role)}>
          <div className="flex items-center gap-1">
            {getRoleIcon(user.role)}
            {userRoles.find((r) => r.value === user.role)?.label || user.role}
          </div>
        </Badge>
      ),
    },
    {
      key: "store",
      label: "Store",
      priority: 3,
      hideOnMobile: true,
      render: (user) => (
        user.store ? (
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span>{user.store.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Global</span>
        )
      ),
    },
    {
      key: "status",
      label: "Status",
      priority: 4,
      render: (user) => (
        <Badge variant={user.is_active ? "default" : "secondary"}>
          {user.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "last_login",
      label: "Last Login",
      priority: 5,
      hideOnMobile: true,
      render: (user) => (
        user.last_login ? (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {new Date(user.last_login).toLocaleDateString()}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Never</span>
        )
      ),
    },
    {
      key: "created",
      label: "Created",
      priority: 6,
      hideOnMobile: true,
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      ),
    },
    createActionsColumn(
      "actions",
      "Actions",
      (user) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
            <Edit className="h-4 w-4" />
          </Button>
          {user.role !== "super_admin" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(user)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
      { priority: 7 }
    ),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <ResponsiveTable
      data={users}
      columns={columns}
      keyExtractor={(user) => user.id}
      emptyMessage="No users found"
    />
  );
};

export default UserTable;
