"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Share2,
  Plus,
  Users,
  Mail,
  Loader2,
  Check,
  AlertCircle,
  Trash2,
  Crown,
  Clock,
  UserPlus,
  ExternalLink,
  HelpCircle,
  Pencil,
  ThumbsUp,
  MessageSquare,
  Repeat,
  History,
  Linkedin,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GroupMember {
  id: string;
  email: string;
  status: "invited" | "accepted" | "declined";
  name?: string;
  isOwner?: boolean;
  acceptedAt?: string;
}

interface Group {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  members?: GroupMember[];
}

interface RecentPost {
  id: string;
  publisherName: string;
  postPreview: string;
  createdAt: string;
  pendingActions: number;
}

interface ActivityItem {
  id: string;
  crossPromotionPostId: string;
  actionType: "like" | "comment" | "repost";
  status: string;
  completedAt?: string;
  approvedAt?: string;
  publisherName: string;
  postPreview: string;
  linkedinPostId?: string;
  groupName: string;
}

export default function CrossPromotionPage() {
  const { data: session } = useSession();

  const [groups, setGroups] = useState<Group[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create group
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Invite
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteGroupId, setInviteGroupId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Rename group
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameGroupId, setRenameGroupId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Group detail
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<GroupMember[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/cross-promotion/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
        setRecentPosts(data.recentPosts || []);
        setActivity(data.activity || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cross-promotion/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });
      if (res.ok) {
        setShowCreateDialog(false);
        setNewGroupName("");
        setMessage({ type: "success", text: "Group created!" });
        fetchGroups();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to create group" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to create group" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteGroupId) return;
    setIsInviting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/cross-promotion/groups/${inviteGroupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (res.ok) {
        setShowInviteDialog(false);
        setInviteEmail("");
        setInviteGroupId(null);
        setMessage({ type: "success", text: "Invitation sent!" });
        if (selectedGroupId === inviteGroupId) {
          loadGroupDetails(inviteGroupId);
          setSelectedGroupId(null); // force re-open
          setTimeout(() => loadGroupDetails(inviteGroupId), 100);
        }
        fetchGroups();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to send invite" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to send invite" });
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Delete this group? All members and history will be removed.")) return;
    try {
      const res = await fetch(`/api/cross-promotion/groups/${groupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedGroupId(null);
        setMessage({ type: "success", text: "Group deleted" });
        fetchGroups();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete group" });
    }
  };

  const handleRenameGroup = async () => {
    if (!renameGroupId || !renameValue.trim()) return;
    setIsRenaming(true);
    try {
      const res = await fetch(`/api/cross-promotion/groups/${renameGroupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (res.ok) {
        setShowRenameDialog(false);
        setMessage({ type: "success", text: "Group renamed" });
        fetchGroups();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to rename" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to rename group" });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm("Leave this group? You won't receive cross-promotion notifications anymore.")) return;
    try {
      const res = await fetch(`/api/cross-promotion/groups/${groupId}/leave`, { method: "POST" });
      if (res.ok) {
        setMessage({ type: "success", text: "You left the group" });
        setSelectedGroupId(null);
        fetchGroups();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to leave group" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to leave group" });
    }
  };

  const handleRemoveMember = async (memberId: string, groupId: string) => {
    try {
      const res = await fetch(`/api/cross-promotion/members/${memberId}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Member removed" });
        loadGroupDetails(groupId);
        fetchGroups();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to remove" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to remove member" });
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
      return;
    }
    setSelectedGroupId(groupId);
    setIsLoadingGroup(true);
    try {
      const res = await fetch(`/api/cross-promotion/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedGroupMembers(data.members || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingGroup(false);
    }
  };

  return (
    <FeatureGate feature="crossPromotion">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              Cross Promotion
            </h1>
            <p className="text-muted-foreground mt-2">
              Invite people to like, comment, and repost your LinkedIn posts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/docs/business-features/cross-promotion" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
              Help?
            </Link>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div className={cn(
            "p-3 rounded-lg text-sm flex items-center gap-2",
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
          )}>
            {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Pending Reviews */}
        {recentPosts.length > 0 && (
          <Card className="border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-600" />
                Posts to Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/cross-promotion/review/${post.id}`}
                  className="block p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{post.publisherName} published a post</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {post.postPreview}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded-full">
                        {post.pendingActions} actions
                      </span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Groups */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Share2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Create a Cross Promotion group and invite people. When anyone in the group publishes a LinkedIn post, everyone else gets notified to engage.
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Card key={group.id} className="hover:border-cyan-200 dark:hover:border-cyan-800 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => loadGroupDetails(group.id)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                          {group.ownerId === session?.user?.id && (
                            <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Crown className="w-3 h-3" /> Owner
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.ownerId === session?.user?.id ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setInviteGroupId(group.id);
                              setShowInviteDialog(true);
                            }}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Invite
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRenameGroupId(group.id);
                              setRenameValue(group.name);
                              setShowRenameDialog(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleLeaveGroup(group.id)}
                        >
                          <LogOut className="w-4 h-4 mr-1" />
                          Leave
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded group details */}
                  {selectedGroupId === group.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      {isLoadingGroup ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Members</h4>
                          {selectedGroupMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {member.name || member.email}
                                </span>
                                {member.isOwner && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                    <Crown className="w-3 h-3" /> Owner
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full",
                                  member.status === "accepted"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    : member.status === "invited"
                                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                )}>
                                  {member.status}
                                </span>
                                {group.ownerId === session?.user?.id && !member.isOwner && (
                                  <button
                                    onClick={() => handleRemoveMember(member.id, group.id)}
                                    className="text-red-400 hover:text-red-600 transition-colors"
                                    title={member.status === "invited" ? "Cancel invitation" : "Remove member"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Activity */}
        {activity.length > 0 && (() => {
          // Group actions by post
          const postGroups: Record<string, ActivityItem[]> = {};
          for (const item of activity) {
            if (!postGroups[item.crossPromotionPostId]) {
              postGroups[item.crossPromotionPostId] = [];
            }
            postGroups[item.crossPromotionPostId].push(item);
          }

          return (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-600" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(postGroups).map(([postId, actions]) => {
                  const first = actions[0];
                  return (
                    <div key={postId} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm">
                          <span className="font-medium">{first.publisherName}</span>'s post
                          {first.groupName && (
                            <span className="text-muted-foreground"> in {first.groupName}</span>
                          )}
                        </p>
                        {first.linkedinPostId && (
                          <a
                            href={`https://www.linkedin.com/feed/update/${first.linkedinPostId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 inline-flex items-center gap-1 shrink-0"
                          >
                            <Linkedin className="w-3 h-3" />
                            View
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{first.postPreview}</p>
                      <div className="flex items-center gap-2 pt-1">
                        {actions.map((action) => {
                          const icon = action.actionType === "like"
                            ? <ThumbsUp className="w-3 h-3" />
                            : action.actionType === "comment"
                            ? <MessageSquare className="w-3 h-3" />
                            : <Repeat className="w-3 h-3" />;

                          const color = action.status === "completed"
                            ? action.actionType === "like"
                              ? "text-blue-600 bg-blue-100 dark:bg-blue-900/30"
                              : action.actionType === "comment"
                              ? "text-green-600 bg-green-100 dark:bg-green-900/30"
                              : "text-violet-600 bg-violet-100 dark:bg-violet-900/30"
                            : action.status === "failed"
                            ? "text-red-500 bg-red-100 dark:bg-red-900/30"
                            : action.status === "skipped"
                            ? "text-muted-foreground bg-muted"
                            : "text-amber-600 bg-amber-100 dark:bg-amber-900/30";

                          return (
                            <div
                              key={action.id}
                              className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium", color)}
                              title={`${action.actionType}: ${action.status}`}
                            >
                              {icon}
                              <span className="capitalize">{action.actionType}</span>
                              {action.status === "failed" && (
                                <AlertCircle className="w-3 h-3" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })()}

        {/* Create Group Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Cross Promotion Group</DialogTitle>
              <DialogDescription>
                Members will get notified when you publish and can like, comment, and repost your posts.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g. Growth Squad"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={50}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                />
              </div>
              <Button
                onClick={handleCreateGroup}
                disabled={isCreating || !newGroupName.trim()}
                className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invite Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite to Group</DialogTitle>
              <DialogDescription>
                They'll receive an email invitation to join your cross-promotion group.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="name@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>
              <Button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail.trim()}
                className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                {isInviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rename-group">Group Name</Label>
                <Input
                  id="rename-group"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  maxLength={50}
                  onKeyDown={(e) => e.key === "Enter" && handleRenameGroup()}
                />
              </div>
              <Button
                onClick={handleRenameGroup}
                disabled={isRenaming || !renameValue.trim()}
                className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                {isRenaming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pencil className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  );
}
