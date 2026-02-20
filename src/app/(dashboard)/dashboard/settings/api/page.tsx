"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Shield,
  Clock,
  AlertTriangle,
  Loader2,
  Code,
  ExternalLink,
  X,
  ShieldX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureGate } from "@/components/dashboard/feature-gate";

// Simple date formatter to replace date-fns
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const AVAILABLE_SCOPES = [
  { id: "posts:read", name: "Read Posts", description: "View your posts" },
  { id: "posts:write", name: "Write Posts", description: "Create and update posts" },
  { id: "posts:delete", name: "Delete Posts", description: "Delete your posts" },
  { id: "ideas:read", name: "Read Ideas", description: "View your saved ideas" },
  { id: "ideas:write", name: "Write Ideas", description: "Create and update ideas" },
  { id: "analytics:read", name: "Read Analytics", description: "View your analytics" },
  { id: "profile:read", name: "Read Profile", description: "View your profile info" },
];

export default function ApiKeysPage() {
  const { data: session } = useSession();
  const isTeamMember = session?.user?.isTeamMember === true;

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Team members cannot access API keys - owner only
  if (isTeamMember) {
    return (
      <FeatureGate feature="apiAccess">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="py-12 px-8">
              <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                  <ShieldX className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Access Restricted</h3>
                <p className="text-muted-foreground">
                  API key management is only available to team owners. Contact the team owner if you need API access.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FeatureGate>
    );
  }
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(AVAILABLE_SCOPES.map((s) => s.id));
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState<ApiKey | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const showError = (message: string) => {
    setErrorToast(message);
    setTimeout(() => setErrorToast(null), 4000);
  };

  // Fetch API keys
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          scopes: selectedScopes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewlyCreatedKey(data.key);
        await fetchApiKeys();
      } else {
        const error = await response.json();
        showError(error.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
      showError("Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKeyConfirm = async () => {
    if (!deleteKey) return;

    setDeletingKeyId(deleteKey.id);
    try {
      const response = await fetch(`/api/keys/${deleteKey.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchApiKeys();
        setDeleteKey(null);
      } else {
        showError("Failed to delete API key");
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
      showError("Failed to delete API key");
    } finally {
      setDeletingKeyId(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCloseNewKeyModal = () => {
    setShowCreateModal(false);
    setNewlyCreatedKey(null);
    setNewKeyName("");
    setSelectedScopes(AVAILABLE_SCOPES.map((s) => s.id));
  };

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  return (
    <FeatureGate feature="apiAccess">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5 text-white" />
              </div>
              API Keys
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage API keys for programmatic access to LinkedGrow
            </p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">Security Best Practices</h3>
              <ul className="text-sm text-amber-700 dark:text-amber-400 mt-1 space-y-1">
                <li>Never share your API keys or commit them to version control</li>
                <li>Use environment variables to store keys securely</li>
                <li>Create separate keys for different applications</li>
                <li>Rotate keys regularly and delete unused ones</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Keys List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <Key className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No API keys yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Create your first API key to start integrating with LinkedGrow
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-linear-to-r from-cyan-500 to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {key.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                        {key.keyPrefix}...
                      </code>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteKey(key)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {key.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
                    >
                      {scope}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Created {formatDate(key.createdAt)}
                  </span>
                  {key.lastUsedAt && (
                    <span>
                      Last used {formatDate(key.lastUsedAt)}
                    </span>
                  )}
                  {key.expiresAt && (
                    <span className="text-amber-600 dark:text-amber-400">
                      Expires {formatDate(key.expiresAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* API Documentation Link */}
        <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <Code className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">API Documentation</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Learn how to integrate LinkedGrow with your applications using our REST API.
              </p>
              <a
                href="/api/docs"
                target="_blank"
                className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 mt-2"
              >
                View documentation
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Delete API Key Modal */}
        {deleteKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => !deletingKeyId && setDeleteKey(null)}
            />
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10">
              <div className="p-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-2">Delete API Key</h2>
                <p className="text-muted-foreground text-center text-sm mb-2">
                  Are you sure you want to delete this API key? This action cannot be undone.
                </p>
                <p className="text-sm font-medium text-center mb-6 text-foreground">
                  "{deleteKey.name}"
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDeleteKey(null)}
                    disabled={!!deletingKeyId}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDeleteKeyConfirm}
                    disabled={!!deletingKeyId}
                  >
                    {deletingKeyId ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create API Key Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              {newlyCreatedKey ? (
                // Show new key
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      API Key Created
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Copy your API key now. You won&apos;t be able to see it again!
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        This key will only be shown once
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <code className="block w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono text-slate-900 dark:text-white break-all">
                      {newlyCreatedKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newlyCreatedKey)}
                      className="absolute top-2 right-2 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {copiedKey ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>

                  <Button
                    onClick={handleCloseNewKeyModal}
                    className="w-full mt-6 bg-linear-to-r from-cyan-500 to-blue-600"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                // Create form
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                    Create API Key
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Key Name
                      </label>
                      <Input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production App, Development"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Permissions
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {AVAILABLE_SCOPES.map((scope) => (
                          <label
                            key={scope.id}
                            className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedScopes.includes(scope.id)}
                              onChange={() => toggleScope(scope.id)}
                              className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {scope.name}
                              </span>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {scope.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={handleCloseNewKeyModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateKey}
                      disabled={!newKeyName.trim() || selectedScopes.length === 0 || isCreating}
                      className="flex-1 bg-linear-to-r from-cyan-500 to-blue-600"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Key"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Toast */}
        {errorToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <X className="w-5 h-5" />
              <span className="font-medium">{errorToast}</span>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
