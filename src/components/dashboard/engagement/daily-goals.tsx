"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Heart, MessageCircle, Settings, Loader2 } from "lucide-react";

interface DailyGoalsProps {
  likesCount: number;
  likesGoal: number;
  commentsCount: number;
  commentsGoal: number;
  onUpdateGoals: (likes: number, comments: number) => Promise<void>;
}

function ProgressRing({
  progress,
  color,
  icon: Icon,
  count,
  goal,
  label,
}: {
  progress: number;
  color: string;
  icon: React.ElementType;
  count: number;
  goal: number;
  label: string;
}) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - Math.min(progress, 1) * circumference;

  const strokeColor = color === "cyan" ? "#06b6d4" : "#3b82f6";
  const bgColor =
    color === "cyan"
      ? "text-cyan-100 dark:text-cyan-900/30"
      : "text-blue-100 dark:text-blue-900/30";
  const textColor =
    color === "cyan"
      ? "text-cyan-600 dark:text-cyan-400"
      : "text-blue-600 dark:text-blue-400";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className={bgColor}
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`w-5 h-5 mb-1 ${textColor}`} />
          <span className="text-2xl font-bold">{count}</span>
          <span className="text-xs text-muted-foreground">/ {goal}</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">
        {Math.round(progress * 100)}% complete
      </p>
    </div>
  );
}

export function DailyGoals({
  likesCount,
  likesGoal,
  commentsCount,
  commentsGoal,
  onUpdateGoals,
}: DailyGoalsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editLikes, setEditLikes] = useState(likesGoal);
  const [editComments, setEditComments] = useState(commentsGoal);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateGoals(editLikes, editComments);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold">Daily Engagement Goals</h3>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setEditLikes(likesGoal);
                setEditComments(commentsGoal);
                setIsOpen(true);
              }}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-8 sm:gap-12">
            <ProgressRing
              progress={likesGoal > 0 ? likesCount / likesGoal : 0}
              color="cyan"
              icon={Heart}
              count={likesCount}
              goal={likesGoal}
              label="Likes"
            />
            <ProgressRing
              progress={commentsGoal > 0 ? commentsCount / commentsGoal : 0}
              color="blue"
              icon={MessageCircle}
              count={commentsCount}
              goal={commentsGoal}
              label="Comments"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Daily Goals</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Heart className="w-4 h-4 text-cyan-500" />
                  Daily Likes
                </label>
                <span className="text-sm font-bold">{editLikes}</span>
              </div>
              <Slider
                value={[editLikes]}
                onValueChange={([v]) => setEditLikes(v)}
                min={1}
                max={100}
                step={1}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  Daily Comments
                </label>
                <span className="text-sm font-bold">{editComments}</span>
              </div>
              <Slider
                value={[editComments]}
                onValueChange={([v]) => setEditComments(v)}
                min={1}
                max={50}
                step={1}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Goals
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
