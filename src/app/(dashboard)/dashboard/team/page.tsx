"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
} from "lucide-react";
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

const roleConfig = {
  owner: { label: "Owner", icon: Crown, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-900/20" },
  admin: { label: "Admin", icon: Shield, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
  member: { label: "Member", icon: User, color: "text-slate-500", bgColor: "bg-slate-50 dark:bg-slate-800/50" },
};

export default function TeamPage() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [teamName, setTeamName] = useState("");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await fetch("/api/team");
      if (response.ok) {
        const data = await response.json();
        setTeam(data.team);
        setMembers(data.members || []);
        setPendingInvites(data.pendingInvites || []);
      }
    } catch (error) {
      console.error("Failed to fetch team data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        setTeam(data.team);
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Failed to create team:", error);
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

    setIsInviting(true);
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      setInviteSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      setPendingInvites([...pendingInvites, data.invite]);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/team/invite/${inviteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPendingInvites(pendingInvites.filter((i) => i.id !== inviteId));
      }
    } catch (error) {
      console.error("Failed to cancel invite:", error);
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
        setMembers(members.filter((m) => m.id !== removeMember.id));
        setRemoveMember(null);
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
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
        setMembers(members.map((m) =>
          m.id === memberId ? { ...m, role: newRole } : m
        ));
      }
    } catch (error) {
      console.error("Failed to change role:", error);
    }
  };

  const isOwner = team && session?.user?.id === team.ownerId;

  return (
    <FeatureGate feature="teamCollaboration">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              Team
            </h1>
            <p className="text-muted-foreground mt-1">
              Collaborate with your team on LinkedIn content
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : !team ? (
          /* No team - create one */
          <Card>
            <CardHeader>
              <CardTitle>Create Your Team</CardTitle>
              <CardDescription>
                Set up a team to collaborate with colleagues on LinkedIn content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="flex gap-3">
                <Input
                  placeholder="Team name (e.g., Marketing Team)"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="flex-1"
                  maxLength={50}
                />
                <Button type="submit" disabled={isCreating || !teamName.trim()}>
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Team"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Team Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {team.name}
                    </CardTitle>
                    <CardDescription>
                      {members.length} member{members.length !== 1 ? "s" : ""} - Created {new Date(team.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {isOwner && (
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Invite Member */}
            {isOwner && (
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
                      <Button type="submit" disabled={isInviting}>
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
            {pendingInvites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pending Invites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium">{invite.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Invited as {invite.role} - Expires {new Date(invite.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvite(invite.id)}
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
                  {members.map((member) => {
                    const RoleIcon = roleConfig[member.role].icon;
                    const isCurrentUser = session?.user?.id === member.userId;
                    const canManage = isOwner && !isCurrentUser && member.role !== "owner";

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
                                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
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
                          {canManage && (
                            <div className="flex items-center gap-1">
                              <select
                                value={member.role}
                                onChange={(e) => handleChangeRole(member.id, e.target.value as "admin" | "member")}
                                className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRemoveMember(member)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
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
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="font-medium">Owner</span>
                    </div>
                    <ul className="text-muted-foreground space-y-1">
                      <li>- Full access to everything</li>
                      <li>- Manage team members</li>
                      <li>- Delete team</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Admin</span>
                    </div>
                    <ul className="text-muted-foreground space-y-1">
                      <li>- Create and edit all content</li>
                      <li>- View analytics</li>
                      <li>- Invite new members</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">Member</span>
                    </div>
                    <ul className="text-muted-foreground space-y-1">
                      <li>- Create own content</li>
                      <li>- View team content</li>
                      <li>- Limited analytics</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <p className="text-muted-foreground text-center text-sm mb-2">
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
          </>
        )}
      </div>
    </FeatureGate>
  );
}
