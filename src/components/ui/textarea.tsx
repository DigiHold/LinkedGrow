import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  charCount?: number;
  maxChars?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, charCount, maxChars, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 text-base transition-[border-color,box-shadow] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/12 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none scrollbar-thin",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {(charCount !== undefined || maxChars) && (
          <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            <span className={cn(charCount && maxChars && charCount > maxChars && "text-destructive font-medium")}>
              {charCount ?? 0}
            </span>
            {maxChars && <span>/{maxChars}</span>}
          </div>
        )}
        {error && (
          <p className="mt-1.5 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
