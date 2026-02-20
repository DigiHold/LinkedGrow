"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Crown,
  Mail,
  Calendar,
  Shield,
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  isAdmin: boolean;
  createdAt: string;
  linkedinProfileName: string | null;
  stripeCustomerId: string | null;
}

interface UsersResponse {
  users: UserData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const planColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  starter: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pro: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  business: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    plan: "free",
    isAdmin: false,
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDropdownToggle = (userId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openDropdownId === userId) {
      setOpenDropdownId(null);
    } else {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.right - 160,
      });
      setOpenDropdownId(userId);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin,
      password: "",
    });
    setShowPassword(false);
    setEditError("");
    setEditModalOpen(true);
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    setEditLoading(true);
    setEditError("");

    try {
      // Only send password if it's been set
      const payload = {
        name: editForm.name,
        email: editForm.email,
        plan: editForm.plan,
        isAdmin: editForm.isAdmin,
        ...(editForm.password.trim() !== "" ? { password: editForm.password } : {}),
      };

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setEditError(data.error || "Failed to update user");
        return;
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, ...editForm }
            : u
        )
      );

      setEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      setEditError("An error occurred while updating the user");
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteModal = (user: UserData) => {
    setDeletingUser(user);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || "Failed to delete user");
        return;
      }

      // Remove from local state
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setTotal((prev) => prev - 1);

      setDeleteModalOpen(false);
      setDeletingUser(null);
    } catch (error) {
      setDeleteError("An error occurred while deleting the user");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
            <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold">Users</h1>
        </div>
        <p className="text-muted-foreground">
          Manage and view all registered users on the platform
        </p>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
          <Button type="submit">Search</Button>
        </form>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{total}</span> total users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-border overflow-x-auto">
          <table className="w-full responsive-table">
            <thead>
              <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  User
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Plan
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  LinkedIn
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Joined
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td data-label="User" className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                          {(user.name || user.email.charAt(0)).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {user.name || "No name"}
                            </span>
                            {user.isAdmin && (
                              <Shield className="w-3.5 h-3.5 text-cyan-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {user.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Email" className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td data-label="Plan" className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.plan === "business" && (
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            planColors[user.plan] || planColors.free
                          }`}
                        >
                          {user.plan}
                        </span>
                      </div>
                    </td>
                    <td data-label="LinkedIn" className="px-4 py-3">
                      {user.linkedinProfileName ? (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {user.linkedinProfileName}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not connected</span>
                      )}
                    </td>
                    <td data-label="Joined" className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td data-label="" className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.stripeCustomerId && (
                          <a
                            href={`https://dashboard.stripe.com/customers/${user.stripeCustomerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                          >
                            Stripe
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {user.id !== session?.user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleDropdownToggle(user.id, e)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dropdown Menu - Fixed position to avoid scrollbar issues */}
      {openDropdownId && (
        <div
          ref={dropdownRef}
          className="fixed z-50 w-40 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
          <button
            onClick={() => {
              const user = users.find(u => u.id === openDropdownId);
              if (user) openEditModal(user);
              setOpenDropdownId(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit User
          </button>
          <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
          <button
            onClick={() => {
              const user = users.find(u => u.id === openDropdownId);
              if (user) openDeleteModal(user);
              setOpenDropdownId(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete User
          </button>
        </div>
      )}

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-cyan-600" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user information. Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {editError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="User name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave empty to keep current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Min 8 characters. Leave empty to keep the current password.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-plan">Plan</Label>
              <Select
                value={editForm.plan}
                onValueChange={(value) => setEditForm({ ...editForm, plan: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit-admin"
                checked={editForm.isAdmin}
                onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <Label htmlFor="edit-admin" className="cursor-pointer">
                Admin privileges
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={editLoading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {editLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All user data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {deleteError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">
                {deleteError}
              </div>
            )}

            {deletingUser && (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                    {(deletingUser.name || deletingUser.email.charAt(0)).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{deletingUser.name || "No name"}</p>
                    <p className="text-sm text-muted-foreground">{deletingUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-4 text-sm text-muted-foreground">
              This will delete:
            </p>
            <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>User account and profile</li>
              <li>All posts and scheduled content</li>
              <li>All media files</li>
              <li>All saved ideas</li>
              <li>LinkedIn connection data</li>
              <li>API keys and logs</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
