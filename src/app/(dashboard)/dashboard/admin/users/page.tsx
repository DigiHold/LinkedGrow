"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { isCloud } from "@/lib/edition";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Crown,
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

interface AdminAccountRow {
  name: string;
  profileUrl: string | null;
  status: string;
  country: string | null;
  dedicatedIp: string | null;
  ipStatus: string | null;
  ipExpiresAt: string | null;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  avatarHash: string;
  plan: string;
  isLifetimeDeal: boolean;
  isAdmin: boolean;
  createdAt: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialStartedAt: string | null;
  trialEndedAt: string | null;
  hasUsedTrial: boolean;
  extraAgents: number;
  billingInterval: string | null;
  /** A live Stripe subscription, the only thing "paid" means here. */
  hasSubscription: boolean;
  subscription: { status: string; trialEnd: number | null; cancelAt: number | null } | null;
  accounts: AdminAccountRow[];
  spareIps: { ip: string | null; country: string; status: string }[];
}

/** The filter pills, in the order an admin reaches for them. */
const FILTERS = [
  { key: "all", label: "All" },
  { key: "paying", label: "Paying" },
  { key: "trial", label: "In trial" },
  { key: "ltd", label: "LTD" },
  { key: "card", label: "Card in" },
  { key: "no_card", label: "No card" },
  { key: "churned", label: "Churned" },
] as const;

interface UsersResponse {
  users: UserData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const planColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  trial: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  starter: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pro: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  business: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

/** LTD overrides every colour: gold, recognisable at a glance. */
const LTD_BADGE = "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300";

/** What the Plan column says: the plan only counts once it is paid for.
 *  An LTD paid once and for all, so their plan shows as bought, never "trial". */
/**
 * Gravatar when the email has one, the letter otherwise. The letter renders
 * underneath and d=404 makes the image fail for emails without a Gravatar,
 * so the fallback is simply the image never covering it.
 */
function UserAvatar({ user, size }: { user: Pick<UserData, "name" | "email" | "avatarHash">; size: "sm" | "lg" }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`${size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10"} relative shrink-0 overflow-hidden rounded-full bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium`}
    >
      {(user.name || user.email.charAt(0)).charAt(0).toUpperCase()}
      {user.avatarHash && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.gravatar.com/avatar/${user.avatarHash}?s=80&d=404`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function displayPlan(user: UserData): string {
  if (user.isLifetimeDeal) return user.plan;
  // There is no billing on a self hosted instance: the plan column is the plan.
  if (!isCloud()) return user.plan;
  return user.hasSubscription ? user.plan : "trial";
}

/**
 * The line under the badge that answers the questions an admin actually has:
 * did the card go in, when does the trial charge, did they cancel, did the
 * payment fail. Null means nothing worth saying (a paying LTD, for example).
 */
function planDetail(user: UserData): { text: string; tone: "warn" | "bad" | "muted" } | null {
  const sub = user.subscription;
  if (!sub) {
    if (user.isLifetimeDeal) return null;
    return { text: "No card", tone: "muted" };
  }
  const day = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (sub.cancelAt) return { text: `Cancels ${day(sub.cancelAt)}`, tone: "warn" };
  if (sub.status === "trialing" && sub.trialEnd)
    return { text: `Card in · first charge ${day(sub.trialEnd)}`, tone: "muted" };
  if (sub.status === "past_due" || sub.status === "unpaid")
    return { text: "Payment failed", tone: "bad" };
  if (sub.status === "active") return { text: "Paying", tone: "muted" };
  return { text: sub.status, tone: "muted" };
}

const detailTone: Record<"warn" | "bad" | "muted", string> = {
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-red-600 dark:text-red-400",
  muted: "text-slate-500 dark:text-slate-400",
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  // The details popup: everything about one user in one place.
  const [detailsUser, setDetailsUser] = useState<UserData | null>(null);
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

  // Dropdown state (desktop only)
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
  }, [page, search, filter]);

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
      if (filter !== "all") {
        params.set("filter", filter);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
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

      // Update local state - mirror the server-side LTD clear on downgrade
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                ...editForm,
                isLifetimeDeal: editForm.plan === "free" ? false : u.isLifetimeDeal,
              }
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
            <Users className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold">Users</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Manage and view all registered users on the platform
        </p>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            type="text"
            placeholder="Search by name, email or dedicated IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
          <Button type="submit">Search</Button>
        </form>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-foreground">{total}</span> total users
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f.key
                ? "bg-cyan-600 border-cyan-600 text-white"
                : "border-border text-slate-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-gray-800/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-border overflow-x-auto">
          <table className="w-full responsive-table">
            <thead>
              <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                  User
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Plan
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                  LinkedIn
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Joined
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
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
                        <UserAvatar user={user} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {user.name || "No name"}
                            </span>
                            {user.isAdmin && (
                              <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Plan" className="px-4 py-3">
                      {/* One container: the stacked mobile cell is a flex row,
                          and two separate children would spread the badge to
                          the middle instead of sitting next to its detail. */}
                      <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 lg:flex-col lg:items-start lg:justify-start">
                        <span className="inline-flex items-center gap-2">
                          {displayPlan(user) === "business" && (
                            <Crown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              user.isLifetimeDeal
                                ? LTD_BADGE
                                : planColors[displayPlan(user)] || planColors.free
                            }`}
                          >
                            {displayPlan(user)}{user.isLifetimeDeal ? " LTD" : ""}
                          </span>
                        </span>
                        {(() => {
                          const detail = planDetail(user);
                          return detail ? (
                            <p className={`text-[11px] font-medium ${detailTone[detail.tone]}`}>
                              {detail.text}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td data-label="LinkedIn" className="px-4 py-3">
                      {user.accounts.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setDetailsUser(user)}
                          className="text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400"
                        >
                          {user.accounts.length} account{user.accounts.length === 1 ? "" : "s"}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-500 dark:text-slate-400">Not connected</span>
                      )}
                    </td>
                    <td data-label="Joined" className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td data-label="" className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {user.id !== session?.user?.id ? (
                          <>
                            {/* Desktop: ellipsis dropdown */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hidden lg:flex"
                              onClick={(e) => handleDropdownToggle(user.id, e)}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                            {/* Responsive: inline buttons */}
                            <div className="flex items-center gap-1 lg:hidden">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setDetailsUser(user)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                Details
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => openEditModal(user)}
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                                onClick={() => openDeleteModal(user)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDetailsUser(user)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>
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
            <div className="text-sm text-slate-500 dark:text-slate-400">
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

      {/* Dropdown Menu - Fixed position (desktop only) */}
      {openDropdownId && (
        <div
          ref={dropdownRef}
          className="fixed z-50 w-40 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
          <button
            onClick={() => {
              const user = users.find(u => u.id === openDropdownId);
              if (user) setDetailsUser(user);
              setOpenDropdownId(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Eye className="w-4 h-4" />
            More details
          </button>
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

      {/* Everything about one user: identity, billing, accounts and their addresses */}
      <Dialog open={!!detailsUser} onOpenChange={(open) => { if (!open) setDetailsUser(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailsUser?.name || "No name"}</DialogTitle>
            <DialogDescription>{detailsUser?.email}</DialogDescription>
          </DialogHeader>
          {detailsUser && (
            <div className="space-y-5">
              {/* Identity */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">User id</span>
                <span className="font-mono text-xs break-all">{detailsUser.id}</span>
                <span className="text-slate-500 dark:text-slate-400">Joined</span>
                <span>{formatDate(detailsUser.createdAt)}</span>
                <span className="text-slate-500 dark:text-slate-400">Plan</span>
                <span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      detailsUser.isLifetimeDeal
                        ? LTD_BADGE
                        : planColors[displayPlan(detailsUser)] || planColors.free
                    }`}
                  >
                    {displayPlan(detailsUser)}{detailsUser.isLifetimeDeal ? " LTD" : ""}
                  </span>
                  {detailsUser.extraAgents > 0 && (
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                      +{detailsUser.extraAgents} extra agent{detailsUser.extraAgents === 1 ? "" : "s"}
                    </span>
                  )}
                </span>
                {detailsUser.billingInterval && (
                  <>
                    <span className="text-slate-500 dark:text-slate-400">Billing</span>
                    <span className="capitalize">{detailsUser.billingInterval}ly</span>
                  </>
                )}
                {(() => {
                  const detail = planDetail(detailsUser);
                  return detail ? (
                    <>
                      <span className="text-slate-500 dark:text-slate-400">Status</span>
                      <span className={`font-medium ${detailTone[detail.tone]}`}>{detail.text}</span>
                    </>
                  ) : null;
                })()}
                {detailsUser.trialEndedAt && (
                  <>
                    <span className="text-slate-500 dark:text-slate-400">Trial</span>
                    <span>
                      {detailsUser.trialStartedAt ? formatDate(detailsUser.trialStartedAt) : "?"} to {formatDate(detailsUser.trialEndedAt)}
                    </span>
                  </>
                )}
              </div>

              {/* Stripe, on the cloud only */}
              {isCloud() && (
              <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                {detailsUser.stripeCustomerId ? (
                  <a
                    href={`https://dashboard.stripe.com/customers/${detailsUser.stripeCustomerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:underline dark:text-cyan-400"
                  >
                    Stripe customer
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <a
                    href={`https://dashboard.stripe.com/search?query=${encodeURIComponent(detailsUser.email)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-amber-600 hover:underline dark:text-amber-400"
                    title="No stored Stripe customer - search by email"
                  >
                    Find on Stripe
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {detailsUser.stripeSubscriptionId && (
                  <a
                    href={`https://dashboard.stripe.com/subscriptions/${detailsUser.stripeSubscriptionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:underline dark:text-cyan-400"
                  >
                    Subscription
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              )}

              {/* LinkedIn accounts and their dedicated addresses */}
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-2">
                  LinkedIn accounts
                  <span className="ml-1 text-slate-500 dark:text-slate-400 font-normal">
                    ({detailsUser.accounts.length})
                  </span>
                </p>
                {detailsUser.accounts.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Not connected</p>
                ) : (
                  <ul className="space-y-2">
                    {detailsUser.accounts.map((account, index) => (
                      <li
                        key={index}
                        className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between gap-3">
                          {account.profileUrl ? (
                            <a
                              href={account.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400"
                            >
                              {account.name}
                            </a>
                          ) : (
                            // No profile URL until the first sign-in captures it.
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {account.name}
                            </span>
                          )}
                          <span className="text-xs capitalize text-slate-500 dark:text-slate-400">
                            {account.status}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {account.dedicatedIp ? (
                            <>
                              <span className="font-mono">{account.dedicatedIp}</span>
                              <span>{account.country}</span>
                              {account.ipExpiresAt && (
                                <span>paid until {formatDate(account.ipExpiresAt)}</span>
                              )}
                              {account.ipStatus && account.ipStatus !== "active" && (
                                <span className="capitalize text-amber-600 dark:text-amber-400">{account.ipStatus}</span>
                              )}
                            </>
                          ) : (
                            <span>No dedicated address yet</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {detailsUser.spareIps.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Parked addresses:{" "}
                    {detailsUser.spareIps
                      .map((s) => `${s.ip ?? "ordering"} (${s.country})`)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              <Label htmlFor="edit-password">New password</Label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
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
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-border">
                <div className="flex items-center gap-3">
                  <UserAvatar user={deletingUser} size="lg" />
                  <div>
                    <p className="font-medium">{deletingUser.name || "No name"}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{deletingUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              This will delete:
            </p>
            <ul className="mt-2 text-sm text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1">
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
