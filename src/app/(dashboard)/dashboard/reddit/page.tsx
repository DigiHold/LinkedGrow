"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquareText,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Check,
  Copy,
  Wand2,
  Image,
  Send,
  Calendar,
  Save,
  Pencil,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId, canAccessFeature } from "@/lib/plans";
import { ImageGeneratorModal } from "@/components/dashboard/image-generator-modal";

// TODO: Get this from user's actual subscription via auth session
const userPlan: PlanId = "free";
// TODO: Get this from user settings
const hasImageApiKey = true; // Demo mode - would check user.aiApiKey in production

const steps = [
  { num: 1, label: "Paste URL" },
  { num: 2, label: "Select Hook" },
  { num: 3, label: "Choose Post" },
  { num: 4, label: "Edit & Publish" },
];

function RedditImportContent() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hooks, setHooks] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState<number | null>(null);
  const [posts, setPosts] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Step 4: Editing and Image Generation State
  const [isEditing, setIsEditing] = useState(false);
  const [editedPost, setEditedPost] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string } | null>(null);

  // Check if user has access to image generation
  const hasImageAccess = canAccessFeature(userPlan, "imageGeneration");

  const handleFetchReddit = async () => {
    if (!url.includes("reddit.com")) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setHooks([
      "I spent 10 years in tech and here's what nobody tells you...",
      "The harsh truth about working at FAANG companies:",
      "Why I turned down a $300K offer (and what I learned)",
      "After interviewing 500+ developers, this is the #1 red flag:",
      "My manager's advice that changed my entire career:",
    ]);
    setIsLoading(false);
    setStep(2);
  };

  const handleGeneratePosts = async () => {
    if (selectedHook === null) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPosts([
      `${hooks[selectedHook]}

After 10 years in tech, here are the 5 things I wish someone told me on day one:

𝟏. 𝐘𝐨𝐮𝐫 𝐧𝐞𝐭𝐰𝐨𝐫𝐤 > 𝐲𝐨𝐮𝐫 𝐬𝐤𝐢𝐥𝐥𝐬
The best opportunities came through people, not job boards.

𝟐. 𝐓𝐢𝐭𝐥𝐞𝐬 𝐝𝐨𝐧'𝐭 𝐦𝐚𝐭𝐭𝐞𝐫, 𝐢𝐦𝐩𝐚𝐜𝐭 𝐝𝐨𝐞𝐬
Nobody remembers your title. They remember what you shipped.

𝟑. 𝐒𝐚𝐲 𝐧𝐨 𝐦𝐨𝐫𝐞 𝐨𝐟𝐭𝐞𝐧
Every yes is a no to something else.

𝟒. 𝐃𝐨𝐜𝐮𝐦𝐞𝐧𝐭 𝐞𝐯𝐞𝐫𝐲𝐭𝐡𝐢𝐧𝐠
Your memory is not as good as you think.

𝟓. 𝐓𝐚𝐤𝐞 𝐜𝐚𝐫𝐞 𝐨𝐟 𝐲𝐨𝐮𝐫 𝐡𝐞𝐚𝐥𝐭𝐡
No job is worth destroying your body.

What would you add to this list?

♻️ Repost if this helps someone
📩 Follow for more career insights`,
      `${hooks[selectedHook]}

Here's the uncomfortable truth no one talks about:

Most successful people in tech got lucky.

But here's the thing -

They positioned themselves to BE lucky.

They showed up consistently.
They built in public.
They helped others without expecting returns.
They took calculated risks.

You can't control luck.
But you can control your inputs.

The formula is simple:
Skill + Network + Showing Up = "Luck"

What's your take on luck vs. skill?`,
      `${hooks[selectedHook]}

Let me tell you a story.

3 years ago, I was burned out.
Working 70-hour weeks.
Missing my kid's events.
For what? A 3% raise.

Then I made ONE decision that changed everything:

I stopped trading time for money.

Instead, I started:
→ Building assets (courses, content, tools)
→ Saying no to toxic clients
→ Prioritizing deep work over busy work

Result?
• 2x income
• 50% less hours
• Actually present for my family

The game isn't about working harder.
It's about working smarter.

What's one change that transformed your work life?`,
    ]);
    setIsLoading(false);
    setStep(3);
  };

  const handleCopy = () => {
    if (selectedPost !== null) {
      navigator.clipboard.writeText(posts[selectedPost]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <MessageSquareText className="w-8 h-8 text-orange-500" />
          Reddit Import
        </h1>
        <p className="text-muted-foreground mt-1">
          Transform viral Reddit posts into LinkedIn content
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                step >= s.num
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                  step >= s.num
                    ? "bg-white/20"
                    : "bg-gray-200 dark:bg-gray-700"
                )}
              >
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < 3 && (
              <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Paste URL */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Paste a Reddit URL</CardTitle>
            <CardDescription>
              Find a viral post on Reddit and paste the URL here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="https://reddit.com/r/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleFetchReddit}
                disabled={!url.includes("reddit.com") || isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Hooks
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-medium text-orange-800 dark:text-orange-200">
                Tips for finding viral Reddit posts:
              </h4>
              <ul className="mt-2 text-sm text-orange-700 dark:text-orange-300 space-y-1">
                <li>• Check r/technology, r/startups, r/entrepreneur</li>
                <li>• Sort by "Top" posts of the week/month</li>
                <li>• Look for posts with high engagement</li>
                <li>• Personal stories often convert well</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Hook */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Choose Your Hook
            </CardTitle>
            <CardDescription>
              Select the hook that will grab attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hooks.map((hook, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedHook(index)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    selectedHook === index
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10"
                      : "border-border hover:border-orange-300"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
                        selectedHook === index
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      )}
                    >
                      {index + 1}
                    </span>
                    <p className="font-medium">{hook}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleGeneratePosts}
                disabled={selectedHook === null || isLoading}
                className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate 3 Posts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Choose Post */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Post</CardTitle>
              <CardDescription>
                Select the version that resonates with your audience
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {posts.map((post, index) => (
              <Card
                key={index}
                className={cn(
                  "cursor-pointer transition-all hover:-translate-y-1",
                  selectedPost === index
                    ? "border-orange-500 shadow-lg"
                    : "hover:border-orange-300"
                )}
                onClick={() => setSelectedPost(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-orange-600">
                      Version {index + 1}
                    </span>
                    {selectedPost === index && (
                      <Check className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-[12] whitespace-pre-wrap">
                    {post}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              disabled={selectedPost === null}
              onClick={() => setStep(4)}
              className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white"
            >
              Continue to Edit
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Edit & Publish with Image Generation */}
      {step === 4 && selectedPost !== null && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Post Content - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {isEditing ? "Edit Your Post" : "Final Post"}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    {isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedPost("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            // Save the edited version
                            const newPosts = [...posts];
                            newPosts[selectedPost] = editedPost;
                            setPosts(newPosts);
                            setIsEditing(false);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditedPost(posts[selectedPost]);
                          setIsEditing(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedPost}
                    onChange={(e) => setEditedPost(e.target.value)}
                    className="min-h-[400px] text-base leading-relaxed"
                    placeholder="Edit your post..."
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-border min-h-[300px]">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {posts[selectedPost]}
                    </div>
                  </div>
                )}

                {/* Attached Image Preview */}
                {attachedImage && (
                  <div className="mt-4 relative">
                    <div className="rounded-xl overflow-hidden border border-border bg-accent/30">
                      <img
                        src={`data:${attachedImage.mimeType};base64,${attachedImage.base64}`}
                        alt="Attached image"
                        className="w-full h-auto max-h-[200px] object-contain"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setAttachedImage(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span>
                    {(isEditing ? editedPost : posts[selectedPost]).length} / 3000 characters
                  </span>
                  {attachedImage && (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <Image className="w-4 h-4" />
                      Image attached
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Edit Options */}
            <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-orange-500" />
                  AI Quick Edit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["Make Shorter", "Add Emojis", "Stronger Hook", "Add CTA", "More Casual"].map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      className="bg-white dark:bg-gray-900 hover:bg-orange-100 hover:border-orange-300"
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            {/* Publish Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-orange-500 hover:bg-orange-600" size="lg">
                  <Send className="w-4 h-4 mr-2" />
                  Publish to LinkedIn
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule for Later
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
              </CardContent>
            </Card>

            {/* Add Media */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Add Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* AI Image Generation - only show if has API key */}
                {hasImageApiKey && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowImageModal(true)}
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                    Generate AI Image
                    {!hasImageAccess && (
                      <span className="ml-auto text-xs text-amber-600">Pro</span>
                    )}
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start">
                  <Image className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Button variant="outline" className="w-full" onClick={() => setStep(3)}>
                  Back to Post Selection
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                  Start Over
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Pro Tips
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1.5">
                  <li>• Posts with images get 2x more engagement</li>
                  <li>• Best time to post: 8-10 AM or 5-6 PM</li>
                  <li>• Add a question at the end for comments</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Image Generator Modal */}
          <ImageGeneratorModal
            open={showImageModal}
            onOpenChange={setShowImageModal}
            postContent={posts[selectedPost]}
            postTopic={hooks[selectedHook ?? 0]}
            userPlan={userPlan}
            hasImageApiKey={hasImageApiKey}
            onImageGenerated={(imageData) => {
              setAttachedImage(imageData);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function RedditImportPage() {
  return (
    <FeatureGate feature="redditIdeas" userPlan={userPlan}>
      <RedditImportContent />
    </FeatureGate>
  );
}
