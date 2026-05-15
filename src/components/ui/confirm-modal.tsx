"use client";

// Reusable LinkedGrow-styled confirmation modal. Replaces native browser
// confirm() dialogs across the dashboard so the UX stays on-brand.
//
// Variants:
//   - default     : cyan/blue accent, neutral confirm button
//   - destructive : red accent + red confirm button (delete / leave actions)
//   - success     : emerald accent (mark resolved, etc.)

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "success";
  loading?: boolean;
  icon?: ReactNode;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  icon,
}: ConfirmModalProps) {
  if (!open) return null;

  const accent =
    variant === "destructive"
      ? {
          ring: "from-red-500 to-rose-600",
          btn: "bg-red-600 hover:bg-red-700 text-white",
          fallbackIcon: <AlertTriangle className="w-6 h-6 text-white" />,
        }
      : variant === "success"
        ? {
            ring: "from-emerald-500 to-teal-600",
            btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
            fallbackIcon: <CheckCircle className="w-6 h-6 text-white" />,
          }
        : {
            ring: "from-cyan-500 to-blue-600",
            btn: "",
            fallbackIcon: <HelpCircle className="w-6 h-6 text-white" />,
          };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className={`w-12 h-12 mx-auto rounded-2xl bg-linear-to-br ${accent.ring} flex items-center justify-center mb-4`}>
          {icon || accent.fallbackIcon}
        </div>
        <h2 className="text-xl font-bold mb-2 text-center">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground text-center mb-6">{description}</p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            className={`flex-1 ${accent.btn}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
