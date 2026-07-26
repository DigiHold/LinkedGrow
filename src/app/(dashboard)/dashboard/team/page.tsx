"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { VideoModal } from "@/components/dashboard/video-modal";
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  Trash2,
  Mail,
  Loader2,
  Clock,
  Check,
  X,
  Settings,
  Plus,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "owner" | "admin" | "member";
  acceptedAt: string | null;
  invitedAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: "admin" | "member";
  createdAt: string;
  expiresAt: string;
}

interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

interface TeamWithDetails {
  team: Team;
  members: TeamMember[];
  pendingInvites: PendingInvite[];
  userRole: "owner" | "admin" | "member";
}

const roleConfig = {
  owner: { label: "Owner", icon: Crown, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-900/20" },
  admin: { label: "Admin", icon: Shield, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
  member: { label: "Member", icon: User, color: "text-slate-500", bgColor: "bg-slate-50 dark:bg-slate-800/50" },
};

export default function TeamPage() {
  const { data: session } = useSession();
  const isTeamMember = session?.user?.isTeamMember === true;
  const teamRole = session?.user?.teamRole;

  // "member" role lands here as a passthrough - team management is admin/owner only
  if (isTeamMember && teamRole === "member") {
    return (
      <FeatureGate feature="teamCollaboration">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
              Team
            </h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              You are part of this team. Team management is handled by your team admin or owner.
            </p>
          </div>
        </div>
      </FeatureGate>
    );
  }
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTeamSelector, setShowTeamSelector] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [cancelInvite, setCancelInvite] = useState<PendingInvite | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await fetch("/api/team");
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
        if (data.teams?.length > 0 && !selectedTeamId) {
          setSelectedTeamId(data.teams[0].team.id);
        }
      }
    } catch (error) {
} finally {
      setIsLoading(false);
    }
  };

  const selectedTeam = teams.find((t) => t.team.id === selectedTeamId);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTeamWithDetails: TeamWithDetails = {
          team: data.team,
          members: data.members || [],
          pendingInvites: data.pendingInvites || [],
          userRole: data.userRole || "owner",
        };
        setTeams([...teams, newTeamWithDetails]);
        setSelectedTeamId(data.team.id);
        setTeamName("");
        setShowCreateForm(false);
      }
    } catch (error) {
} finally {
      setIsCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setInviteError("Please enter a valid email address");
      return;
    }

    if (!selectedTeamId) {
      setInviteError("No team selected");
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          teamId: selectedTeamId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      setInviteSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");

      // Update the selected team's pending invites
      setTeams(teams.map((t) =>
        t.team.id === selectedTeamId
          ? { ...t, pendingInvites: [...t.pendingInvites, data.invite] }
          : t
      ));
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInviteConfirm = async () => {
    if (!cancelInvite) return;
    setIsCancelling(true);

    try {
      const response = await fetch(`/api/team/invite/${cancelInvite.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTeams(teams.map((t) =>
          t.team.id === selectedTeamId
            ? { ...t, pendingInvites: t.pendingInvites.filter((i) => i.id !== cancelInvite.id) }
            : t
        ));
        setCancelInvite(null);
      }
    } catch (error) {
} finally {
      setIsCancelling(false);
    }
  };

  const handleRemoveMemberConfirm = async () => {
    if (!removeMember) return;
    setIsRemoving(true);

    try {
      const response = await fetch(`/api/team/members/${removeMember.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTeams(teams.map((t) =>
          t.team.id === selectedTeamId
            ? { ...t, members: t.members.filter((m) => m.id !== removeMember.id) }
            : t
        ));
        setRemoveMember(null);
      }
    } catch (error) {
} finally {
      setIsRemoving(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: "admin" | "member") => {
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setTeams(teams.map((t) =>
          t.team.id === selectedTeamId
            ? {
                ...t,
                members: t.members.map((m) =>
                  m.id === memberId ? { ...m, role: newRole } : m
                ),
              }
            : t
        ));
      }
    } catch (error) {
}
  };

  const isOwner = selectedTeam?.userRole === "owner";
  const isAdmin = selectedTeam?.userRole === "admin";
  const canInvite = isOwner || isAdmin;

  const handleOpenSettings = () => {
    if (selectedTeam) {
      setNewTeamName(selectedTeam.team.name);
      setShowSettings(true);
    }
  };

  const handleUpdateTeamName = async () => {
    if (!newTeamName.trim() || !selectedTeam) return;

    setIsUpdatingTeam(true);
    try {
      const response = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam.team.id, name: newTeamName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(teams.map((t) =>
          t.team.id === selectedTeam.team.id
            ? { ...t, team: data.team }
            : t
        ));
        setShowSettings(false);
      }
    } catch (error) {
} finally {
      setIsUpdatingTeam(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    setIsDeletingTeam(true);
    try {
      const response = await fetch(`/api/team?teamId=${selectedTeam.team.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const remainingTeams = teams.filter((t) => t.team.id !== selectedTeam.team.id);
        setTeams(remainingTeams);
        setSelectedTeamId(remainingTeams.length > 0 ? remainingTeams[0].team.id : null);
        setShowSettings(false);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
} finally {
      setIsDeletingTeam(false);
    }
  };

  return (
    <FeatureGate feature="teamCollaboration">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
              Team
            </h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              Who can see and publish on this workspace.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VideoModal videoId="-5PXrUUERJI" />
            <Link href="/docs/business-features/team-collaboration" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white">
              <HelpCircle className="w-3.5 h-3.5" />
              Docs
            </Link>
            {/* Only owners can create new teams, and only once one exists:
                the empty state below already asks for a name. */}
            {!isTeamMember && teams.length > 0 && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New team
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : teams.length === 0 && !showCreateForm ? (
          /* No teams */
          isTeamMember ? (
            /* Admin without team - shouldn't happen normally */
            <Card >
              <CardContent className="py-12 px-8">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Users className="w-10 h-10 text-slate-500 dark:text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Team Found</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    You don&apos;t appear to be part of any team. Please contact your team owner.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Owner - create first team */
            <Card>
              <CardHeader>
                <CardTitle>Create your first team</CardTitle>
                <CardDescription>
                  Name it, then invite the people who should see and publish here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTeam} className="flex gap-3">
                  <Input
                    placeholder="Marketing, Sales, Client work..."
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="flex-1"
                    maxLength={50}
                  />
                  <Button type="submit" disabled={isCreating || !teamName.trim()}>
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Create team"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )
        ) : (
          <>
            {/* Create Team Form */}
            {showCreateForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Team</CardTitle>
                  <CardDescription>
                    Add another team for different groups or projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTeam} className="flex gap-3">
                    <Input
                      placeholder="Team name (e.g., Sales Team)"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="flex-1"
                      maxLength={50}
                      autoFocus
                    />
                    <Button type="submit" disabled={isCreating || !teamName.trim()}>
                      {isCreating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Create"
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); setTeamName(""); }}>
                      Cancel
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Team Selector */}
            {teams.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowTeamSelector(!showTeamSelector)}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-cyan-500 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{selectedTeam?.team.name || "Select a team"}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedTeam ? `${selectedTeam.members.length} member${selectedTeam.members.length !== 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform", showTeamSelector && "rotate-180")} />
                </button>

                {showTeamSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
                    {teams.map((t) => (
                      <button
                        key={t.team.id}
                        onClick={() => {
                          setSelectedTeamId(t.team.id);
                          setShowTeamSelector(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                          t.team.id === selectedTeamId && "bg-cyan-50 dark:bg-cyan-900/20"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
                          <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium text-sm">{t.team.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t.members.length} member{t.members.length !== 1 ? "s" : ""} - {t.userRole}
                          </p>
                        </div>
                        {t.team.id === selectedTeamId && (
                          <Check className="w-4 h-4 text-cyan-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTeam && (
              <>
                {/* Team Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          {selectedTeam.team.name}
                        </CardTitle>
                        <CardDescription>
                          {selectedTeam.members.length} member{selectedTeam.members.length !== 1 ? "s" : ""} - Created {new Date(selectedTeam.team.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {isOwner && (
                        <Button variant="outline" size="sm" onClick={handleOpenSettings}>
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                {/* Invite Member */}
                {canInvite && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Invite Team Member
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleInvite} className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Input
                            type="email"
                            placeholder="colleague@company.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1"
                          />
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Button type="submit" disabled={isInviting} className="px-[1.8rem]">
                            {isInviting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Invite
                              </>
                            )}
                          </Button>
                        </div>
                        {inviteError && (
                          <p className="text-sm text-red-500">{inviteError}</p>
                        )}
                        {inviteSuccess && (
                          <p className="text-sm text-green-500 flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            {inviteSuccess}
                          </p>
                        )}
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Pending Invites */}
                {selectedTeam.pendingInvites.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Pending Invites
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedTeam.pendingInvites.map((invite) => (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                              </div>
                              <div>
                                <p className="font-medium">{invite.email}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Invited as {invite.role} - Expires {new Date(invite.expiresAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {canInvite && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCancelInvite(invite)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Team Members */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedTeam.members.map((member) => {
                        const RoleIcon = roleConfig[member.role].icon;
                        const isCurrentUser = session?.user?.id === member.userId;
                        // Owner can manage anyone except themselves and other owners
                        // Admin can only remove members (not admins or owners)
                        const canManage = !isCurrentUser && member.role !== "owner" && (
                          isOwner || (isAdmin && member.role === "member")
                        );
                        const canChangeRole = isOwner; // Only owners can change roles

                        return (
                          <div
                            key={member.id}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-lg",
                              roleConfig[member.role].bgColor
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {member.image ? (
                                <img
                                  src={member.image}
                                  alt={member.name || "Member"}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                  <User className="w-5 h-5 text-slate-500" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">
                                  {member.name || member.email}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">(you)</span>
                                  )}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                                  roleConfig[member.role].bgColor,
                                  roleConfig[member.role].color
                                )}
                              >
                                <RoleIcon className="w-3 h-3" />
                                {roleConfig[member.role].label}
                              </span>
                              {(canManage || canChangeRole) && (
                                <div className="flex items-center gap-1">
                                  {/* Only owners can change roles */}
                                  {canChangeRole && member.role !== "owner" && (
                                    <select
                                      value={member.role}
                                      onChange={(e) => handleChangeRole(member.id, e.target.value as "admin" | "member")}
                                      className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                    >
                                      <option value="member">Member</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  )}
                                  {/* Remove button - owner can remove anyone, admin can only remove members */}
                                  {canManage && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setRemoveMember(member)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Role Permissions */}
                <Card className="bg-slate-50 dark:bg-slate-800/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Role Permissions</h3>
                    <div className="grid sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="font-medium">Owner</span>
                        </div>
                        <ul className="text-slate-500 dark:text-slate-400 space-y-1">
                          <li>- Full access to everything</li>
                          <li>- Manage all team members</li>
                          <li>- Create, rename, delete teams</li>
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="font-medium">Admin</span>
                        </div>
                        <ul className="text-slate-500 dark:text-slate-400 space-y-1">
                          <li>- Edit and delete all posts</li>
                          <li>- View team analytics</li>
                          <li>- Invite and remove members</li>
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Member</span>
                        </div>
                        <ul className="text-slate-500 dark:text-slate-400 space-y-1">
                          <li>- Create own content</li>
                          <li>- View team content</li>
                          <li>- No analytics access</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Remove Member Modal */}
            {removeMember && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="fixed inset-0 bg-black/50"
                  onClick={() => !isRemoving && setRemoveMember(null)}
                />
                <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10">
                  <div className="p-6">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-center mb-2">Remove Team Member</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-2">
                      Are you sure you want to remove this team member?
                    </p>
                    <p className="text-sm font-medium text-center mb-6 text-foreground">
                      {removeMember.name || removeMember.email}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setRemoveMember(null)}
                        disabled={isRemoving}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleRemoveMemberConfirm}
                        disabled={isRemoving}
                      >
                        {isRemoving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel Invite Modal */}
            {cancelInvite && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="fixed inset-0 bg-black/50"
                  onClick={() => !isCancelling && setCancelInvite(null)}
                />
                <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10">
                  <div className="p-6">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-center mb-2">Cancel Invitation</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-2">
                      Are you sure you want to cancel this invitation?
                    </p>
                    <p className="text-sm font-medium text-center mb-6 text-foreground">
                      {cancelInvite.email}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setCancelInvite(null)}
                        disabled={isCancelling}
                      >
                        Keep Invite
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleCancelInviteConfirm}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Cancel Invite
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="fixed inset-0 bg-black/50"
                  onClick={() => !isUpdatingTeam && !isDeletingTeam && setShowSettings(false)}
                />
                <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold">Team Settings</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSettings(false)}
                        disabled={isUpdatingTeam || isDeletingTeam}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {!showDeleteConfirm ? (
                      <>
                        {/* Team Name */}
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Team Name</label>
                            <div className="flex gap-2">
                              <Input
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                maxLength={50}
                                className="flex-1"
                              />
                              <Button
                                onClick={handleUpdateTeamName}
                                disabled={isUpdatingTeam || newTeamName.trim() === selectedTeam?.team.name}
                              >
                                {isUpdatingTeam ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Save"
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Danger Zone */}
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-medium text-red-600 mb-2">Danger zone</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                              Deleting your team will remove all members and pending invites. This action cannot be undone.
                            </p>
                            <Button
                              variant="destructive"
                              onClick={() => setShowDeleteConfirm(true)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Team
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Delete Confirmation */
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="font-semibold mb-2">Delete Team?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                          This will permanently delete <strong>{selectedTeam?.team.name}</strong> and remove all team members. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeletingTeam}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleDeleteTeam}
                            disabled={isDeletingTeam}
                          >
                            {isDeletingTeam ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Team
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </FeatureGate>
  );
}
