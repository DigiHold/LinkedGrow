"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{total}</span> total users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
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
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
                      {user.linkedinProfileName ? (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {user.linkedinProfileName}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not connected</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
    </div>
  );
}
