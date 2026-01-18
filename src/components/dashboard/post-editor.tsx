"use client";

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKEDIN_MAX_CHARS = 3000;

// Unicode character mappings for bold text
const BOLD_MAP: Record<string, string> = {
  a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶", j: "𝗷",
  k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿", s: "𝘀", t: "𝘁",
  u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇",
  A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜", J: "𝗝",
  K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧",
  U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭",
  "0": "𝟬", "1": "𝟭", "2": "𝟮", "3": "𝟯", "4": "𝟰", "5": "𝟱", "6": "𝟲", "7": "𝟳", "8": "𝟴", "9": "𝟵",
};

// Unicode character mappings for italic text
const ITALIC_MAP: Record<string, string> = {
  a: "𝘢", b: "𝘣", c: "𝘤", d: "𝘥", e: "𝘦", f: "𝘧", g: "𝘨", h: "𝘩", i: "𝘪", j: "𝘫",
  k: "𝘬", l: "𝘭", m: "𝘮", n: "𝘯", o: "𝘰", p: "𝘱", q: "𝘲", r: "𝘳", s: "𝘴", t: "𝘵",
  u: "𝘶", v: "𝘷", w: "𝘸", x: "𝘹", y: "𝘺", z: "𝘻",
  A: "𝘈", B: "𝘉", C: "𝘊", D: "𝘋", E: "𝘌", F: "𝘍", G: "𝘎", H: "𝘏", I: "𝘐", J: "𝘑",
  K: "𝘒", L: "𝘓", M: "𝘔", N: "𝘕", O: "𝘖", P: "𝘗", Q: "𝘘", R: "𝘙", S: "𝘚", T: "𝘛",
  U: "𝘜", V: "𝘝", W: "𝘞", X: "𝘟", Y: "𝘠", Z: "𝘡",
};

// Reverse maps for detecting and removing formatting
const BOLD_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(BOLD_MAP).map(([k, v]) => [v, k])
);
const ITALIC_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ITALIC_MAP).map(([k, v]) => [v, k])
);

function toBold(text: string): string {
  return text.split("").map((char) => BOLD_MAP[char] || char).join("");
}

function toItalic(text: string): string {
  return text.split("").map((char) => ITALIC_MAP[char] || char).join("");
}

function fromBold(text: string): string {
  return text.split("").map((char) => BOLD_REVERSE_MAP[char] || char).join("");
}

function fromItalic(text: string): string {
  return text.split("").map((char) => ITALIC_REVERSE_MAP[char] || char).join("");
}

function isBold(text: string): boolean {
  // Check if text contains any bold characters
  return text.split("").some((char) => BOLD_REVERSE_MAP[char]);
}

function isItalic(text: string): boolean {
  // Check if text contains any italic characters
  return text.split("").some((char) => ITALIC_REVERSE_MAP[char]);
}

function isBulletList(text: string): boolean {
  return text.split("\n").every((line) => !line.trim() || line.trim().startsWith("• "));
}

function isNumberedList(text: string): boolean {
  const lines = text.split("\n").filter((line) => line.trim());
  return lines.every((line, i) => line.trim().startsWith(`${i + 1}. `));
}

function fromBulletList(text: string): string {
  return text.split("\n").map((line) => line.replace(/^• /, "")).join("\n");
}

function fromNumberedList(text: string): string {
  return text.split("\n").map((line) => line.replace(/^\d+\. /, "")).join("\n");
}

export interface PostEditorRef {
  focus: () => void;
  getContent: () => string;
  setContent: (content: string) => void;
}

interface AttachedImage {
  base64: string;
  mimeType: string;
  preview?: string;
}

interface PostEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  showToolbar?: boolean;
  showImageButton?: boolean;
  className?: string;
  disabled?: boolean;
  attachedImage?: AttachedImage | null;
  onImageChange?: (image: AttachedImage | null) => void;
  onError?: (message: string) => void;
}

export const PostEditor = forwardRef<PostEditorRef, PostEditorProps>(
  (
    {
      value,
      onChange,
      placeholder = "Start writing your LinkedIn post...",
      minHeight = "min-h-100",
      showToolbar = true,
      showImageButton = false,
      className,
      disabled = false,
      attachedImage,
      onImageChange,
      onError,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [history, setHistory] = useState<string[]>([value]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const charCount = value.length;

    // Handle image upload
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        onError?.("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
        return;
      }

      // Validate file size (max 5MB - LinkedIn limit)
      if (file.size > 5 * 1024 * 1024) {
        onError?.("Image must be less than 5MB (LinkedIn limit)");
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(",")[1];
        onImageChange?.({
          base64,
          mimeType: file.type,
          preview: result,
        });
      };
      reader.readAsDataURL(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      getContent: () => value,
      setContent: (content: string) => onChange(content),
    }));

    // Save to history when content changes
    const saveToHistory = useCallback(
      (newContent: string) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        // Keep only last 50 history entries
        if (newHistory.length > 50) {
          newHistory.shift();
        }
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      },
      [history, historyIndex]
    );

    const handleUndo = () => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        onChange(history[newIndex]);
      }
    };

    const handleRedo = () => {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        onChange(history[newIndex]);
      }
    };

    const handleContentChange = (newContent: string) => {
      onChange(newContent);
      // Debounce history saves
      const timeout = setTimeout(() => saveToHistory(newContent), 500);
      return () => clearTimeout(timeout);
    };

    const applyFormatting = (format: "bold" | "italic" | "bullet" | "number") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const beforeSelection = value.substring(0, start);
      const afterSelection = value.substring(end);

      let newText = "";
      let cursorOffset = 0;

      switch (format) {
        case "bold":
          if (selectedText) {
            // Toggle: if already bold, remove it; otherwise apply bold
            if (isBold(selectedText)) {
              // Also remove any italic formatting first, then apply nothing (plain text)
              newText = fromBold(fromItalic(selectedText));
            } else {
              // Remove italic if present, then apply bold
              newText = toBold(fromItalic(selectedText));
            }
          } else {
            // No selection - insert placeholder
            newText = toBold("bold text");
            cursorOffset = newText.length;
          }
          break;

        case "italic":
          if (selectedText) {
            // Toggle: if already italic, remove it; otherwise apply italic
            if (isItalic(selectedText)) {
              // Remove both bold and italic to get plain text
              newText = fromItalic(fromBold(selectedText));
            } else {
              // Remove bold if present, then apply italic
              newText = toItalic(fromBold(selectedText));
            }
          } else {
            newText = toItalic("italic text");
            cursorOffset = newText.length;
          }
          break;

        case "bullet":
          if (selectedText) {
            // Toggle: if already bullet list, remove it; otherwise apply
            if (isBulletList(selectedText)) {
              newText = fromBulletList(selectedText);
            } else {
              // Remove numbered list first if present
              const plainText = isNumberedList(selectedText) ? fromNumberedList(selectedText) : selectedText;
              const lines = plainText.split("\n");
              newText = lines.map((line) => (line.trim() ? `• ${line.trim()}` : "")).join("\n");
            }
          } else {
            newText = "• ";
            cursorOffset = 2;
          }
          break;

        case "number":
          if (selectedText) {
            // Toggle: if already numbered list, remove it; otherwise apply
            if (isNumberedList(selectedText)) {
              newText = fromNumberedList(selectedText);
            } else {
              // Remove bullet list first if present
              const plainText = isBulletList(selectedText) ? fromBulletList(selectedText) : selectedText;
              const lines = plainText.split("\n");
              newText = lines
                .map((line, i) => (line.trim() ? `${i + 1}. ${line.trim()}` : ""))
                .join("\n");
            }
          } else {
            newText = "1. ";
            cursorOffset = 3;
          }
          break;
      }

      const newContent = beforeSelection + newText + afterSelection;
      onChange(newContent);
      saveToHistory(newContent);

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + (selectedText ? newText.length : cursorOffset);
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    };

    return (
      <div className={cn("border rounded-xl overflow-hidden bg-background", className)}>
        {showToolbar && (
          <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => applyFormatting("bold")}
              disabled={disabled}
              title="Bold (Ctrl+B)"
              type="button"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => applyFormatting("italic")}
              disabled={disabled}
              title="Italic (Ctrl+I)"
              type="button"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => applyFormatting("bullet")}
              disabled={disabled}
              title="Bullet List"
              type="button"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => applyFormatting("number")}
              disabled={disabled}
              title="Numbered List"
              type="button"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
            {showImageButton && (
              <>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  title="Add Image"
                  type="button"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </>
            )}
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleUndo}
              disabled={disabled || historyIndex === 0}
              title="Undo (Ctrl+Z)"
              type="button"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRedo}
              disabled={disabled || historyIndex === history.length - 1}
              title="Redo (Ctrl+Y)"
              type="button"
            >
              <Redo className="w-4 h-4" />
            </Button>
            <div className="flex-1" />
            <span
              className={cn(
                "text-xs px-2",
                charCount > LINKEDIN_MAX_CHARS
                  ? "text-destructive font-medium"
                  : charCount > LINKEDIN_MAX_CHARS * 0.9
                  ? "text-amber-600"
                  : "text-muted-foreground"
              )}
            >
              {charCount} / {LINKEDIN_MAX_CHARS}
            </span>
          </div>
        )}

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "border-0 focus-visible:ring-0 resize-none text-base leading-relaxed rounded-none",
            minHeight
          )}
        />

        {/* Image Preview */}
        {attachedImage?.preview && (
          <div className="relative p-3 border-t bg-muted/20">
            <div className="relative inline-block">
              <img
                src={attachedImage.preview}
                alt="Attached"
                className="max-h-32 rounded-lg border"
              />
              <button
                type="button"
                onClick={() => onImageChange?.(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!showToolbar && (
          <div className="px-3 py-2 border-t text-xs text-muted-foreground flex justify-between">
            <span>{charCount} / {LINKEDIN_MAX_CHARS}</span>
            <span>~{Math.ceil(charCount / 200)} min read</span>
          </div>
        )}
      </div>
    );
  }
);

PostEditor.displayName = "PostEditor";

export default PostEditor;
