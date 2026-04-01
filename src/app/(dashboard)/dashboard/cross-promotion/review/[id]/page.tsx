"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import {
  Share2,
  ThumbsUp,
  MessageSquare,
  Repeat,
  Loader2,
  Check,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ReviewAction {
  id: string;
  actionType: "like" | "comment" | "repost";
  status: string;
  commentText?: string;
}

interface ReviewData {
  id: string;
  postContent: string;
  publisherName: string;
  groupName: string;
  createdAt: string;
  actions: ReviewAction[];
}

export default function CrossPromotionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [data, setData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action toggles
  const [doLike, setDoLike] = useState(true);
  const [doComment, setDoComment] = useState(true);
  const [doRepost, setDoRepost] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isGeneratingComment, setIsGeneratingComment] = useState(false);

  const [isApproving, setIsApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/cross-promotion/posts/${id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);

          // Pre-fill comment from AI if available
          const commentAction = result.actions?.find(
            (a: ReviewAction) => a.actionType === "comment"
          );
          if (commentAction?.commentText) {
            setCommentText(commentAction.commentText);
          }

          // Check if already approved
          const allProcessed = result.actions?.every(
            (a: ReviewAction) => a.status !== "pending"
          );
          if (allProcessed) {
            setApproved(true);
          }
        } else {
          const result = await res.json();
          setError(result.error || "Failed to load post");
        }
      } catch {
        setError("Failed to load post");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleGenerateComment = async () => {
    if (!data?.postContent) return;
    setIsGeneratingComment(true);
    try {
      const res = await fetch("/api/ai/generate-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postContent: data.postContent, isEngagement: true }),
      });
      if (res.ok) {
        const result = await res.json();
        setCommentText(result.comment || "");
      }
    } catch {
      // ignore
    } finally {
      setIsGeneratingComment(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/cross-promotion/posts/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          like: doLike,
          comment: doComment,
          repost: doRepost,
          commentText: doComment ? commentText : undefined,
        }),
      });
      if (res.ok) {
        setApproved(true);
      } else {
        const result = await res.json();
        setError(result.error || "Failed to approve");
      }
    } catch {
      setError("Failed to approve");
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return (
      <FeatureGate feature="crossPromotion">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </FeatureGate>
    );
  }

  if (error || !data) {
    return (
      <FeatureGate feature="crossPromotion">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to load post</h3>
              <p className="text-muted-foreground mb-4">{error || "Post not found"}</p>
              <Link href="/dashboard/cross-promotion">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cross Promotion
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="crossPromotion">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/cross-promotion"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Cross Promotion
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            Review Post
          </h1>
          <p className="text-muted-foreground mt-2">
            <span className="font-medium text-foreground">{data.publisherName}</span> from{" "}
            <span className="font-medium text-foreground">{data.groupName}</span> published a post
          </p>
        </div>

        {/* Post Content */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              {data.publisherName}'s Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">
              {data.postContent}
            </div>
          </CardContent>
        </Card>

        {approved ? (
          /* Success state */
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
            <CardContent className="py-8 text-center">
              <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Actions scheduled!</h3>
              <p className="text-muted-foreground mb-4">
                Your engagement will be posted with natural timing over the next few minutes.
              </p>
              <Link href="/dashboard/cross-promotion">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cross Promotion
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Action selection */
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Choose Your Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Like */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ThumbsUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <Label htmlFor="action-like" className="text-sm font-medium">Like</Label>
                      <p className="text-xs text-muted-foreground">React to the post</p>
                    </div>
                  </div>
                  <Switch id="action-like" checked={doLike} onCheckedChange={setDoLike} />
                </div>

                {/* Comment */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <Label htmlFor="action-comment" className="text-sm font-medium">Comment</Label>
                        <p className="text-xs text-muted-foreground">Post a comment on the post</p>
                      </div>
                    </div>
                    <Switch id="action-comment" checked={doComment} onCheckedChange={setDoComment} />
                  </div>

                  {doComment && (
                    <div className="ml-11 space-y-2">
                      <Textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write your comment..."
                        rows={3}
                        maxLength={1250}
                      />
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateComment}
                          disabled={isGeneratingComment}
                        >
                          {isGeneratingComment ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          Generate with AI
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {commentText.length}/1250
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Repost */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <Repeat className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <Label htmlFor="action-repost" className="text-sm font-medium">Repost</Label>
                      <p className="text-xs text-muted-foreground">Share the post on your profile</p>
                    </div>
                  </div>
                  <Switch id="action-repost" checked={doRepost} onCheckedChange={setDoRepost} />
                </div>
              </CardContent>
            </Card>

            {/* Approve */}
            <Button
              onClick={handleApprove}
              disabled={isApproving || (!doLike && !doComment && !doRepost) || (doComment && !commentText.trim())}
              className="w-full h-12 text-base bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              {isApproving ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Check className="w-5 h-5 mr-2" />
              )}
              {isApproving ? "Scheduling..." : "Approve & Schedule"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Actions will be executed with natural random timing (1-15 minutes)
            </p>
          </>
        )}
      </div>
    </FeatureGate>
  );
}
