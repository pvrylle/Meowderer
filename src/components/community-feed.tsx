"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ImagePlus, MessageCircle, Send, Share2, X } from "lucide-react";
import { toast } from "sonner";

import {
  createPostAction,
  toggleLikeAction,
} from "@/app/(app)/community/actions";
import { deletePostAction } from "@/app/(app)/community/safety-actions";
import { PostCommentsSheet } from "@/components/post-comments-sheet";
import { ReportContentButton } from "@/components/report-content-button";
import { UserAvatar } from "@/components/user-avatar";
import { CatButton } from "@/components/ui/cat-button";
import { uploadPostImage } from "@/lib/community-upload";
import { formatRelativeTime } from "@/lib/format-time";
import type { PostWithAuthor } from "@/lib/community";
import { cn } from "@/lib/utils";

const CATEGORY_STYLE: Record<string, string> = {
  sighting: "bg-orange/15 text-orange",
  shelter: "bg-green/15 text-green",
  rescue: "bg-destructive/15 text-destructive",
  general: "bg-primary/15 text-primary",
};

const COMPOSE_CATEGORIES = [
  { key: "sighting" as const, label: "Sighting" },
  { key: "shelter" as const, label: "Shelter" },
  { key: "rescue" as const, label: "Rescue" },
];

type CommunityFeedProps = {
  posts: PostWithAuthor[];
  currentUserId: string;
};

export function CommunityFeed({
  posts: initialPosts,
  currentUserId,
}: CommunityFeedProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState(initialPosts);
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<(typeof COMPOSE_CATEGORIES)[number]["key"]>("sighting");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleLike(postId: string) {
    const result = await toggleLikeAction(postId);
    if (!result.success) {
      toast.error(result.error ?? "Could not like post.");
      return;
    }
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const liked = !p.liked_by_me;
        return {
          ...p,
          liked_by_me: liked,
          likes_count: p.likes_count + (liked ? 1 : -1),
        };
      }),
    );
  }

  async function handleDeletePost(postId: string) {
    const result = await deletePostAction(postId);
    if (!result.success) {
      toast.error(result.error ?? "Could not delete post.");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post deleted.");
    router.refresh();
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      let imagePath: string | undefined;
      if (imageFile) {
        const uploaded = await uploadPostImage(imageFile);
        imagePath = uploaded.path;
      }
      const result = await createPostAction({
        body: body.trim(),
        category,
        imagePath,
      });
      if (!result.success) {
        toast.error(result.error ?? "Could not post.");
        return;
      }
      toast.success("Posted!");
      setBody("");
      clearImage();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post.");
    } finally {
      setPosting(false);
    }
  }

  async function handleShare(post: PostWithAuthor) {
    const text = `${post.body}${post.image_url ? `\n${post.image_url}` : ""}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Meowderer sighting", text });
        return;
      } catch {
        // cancelled
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Composer */}
      <form
        onSubmit={handlePost}
        className="rounded-xl bg-card shadow-sm ring-1 ring-border/50"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share a cat sighting..."
          rows={2}
          className="w-full resize-none bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground"
          required
        />
        
        <div className="flex gap-2 px-3 pb-2">
          {COMPOSE_CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                category === key
                  ? CATEGORY_STYLE[key]
                  : "bg-muted text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        
        {imagePreview && (
          <div className="relative mx-3 mb-2 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="" className="max-h-36 w-full object-cover" />
            <button
              type="button"
              aria-label="Remove"
              onClick={clearImage}
              className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between border-t border-border/50 px-3 py-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-sm text-primary"
          >
            <ImagePlus className="size-4" />
            Photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagePick}
          />
          <CatButton type="submit" size="xs" loading={posting}>
            <Send className="size-3.5" />
            Post
          </CatButton>
        </div>
      </form>

      {/* Posts */}
      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No posts yet. Be the first to share a sighting!
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-xl bg-card shadow-sm ring-1 ring-border/50"
            >
              <div className="flex items-start justify-between p-3 pb-2">
                <div className="flex items-center gap-2">
                  <UserAvatar name={post.author_name} avatarUrl={post.author_avatar} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{post.author_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(post.created_at)}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-medium capitalize",
                    CATEGORY_STYLE[post.category] ?? CATEGORY_STYLE.general,
                  )}
                >
                  {post.category}
                </span>
              </div>

              <p className="px-3 pb-2 text-sm text-foreground">{post.body}</p>

              {post.image_url && (
                <div className="mx-3 mb-2 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={post.image_url}
                    alt=""
                    width={400}
                    height={300}
                    unoptimized
                    className="h-auto w-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 border-t border-border/50 px-3 py-2">
                <button
                  type="button"
                  onClick={() => handleLike(post.id)}
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    post.liked_by_me ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  <Heart
                    className={cn("size-4", post.liked_by_me && "fill-current")}
                  />
                  {post.likes_count}
                </button>
                <button
                  type="button"
                  onClick={() => setCommentsPostId(post.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <MessageCircle className="size-4" />
                  {post.comments_count}
                </button>
                <button
                  type="button"
                  onClick={() => handleShare(post)}
                  className="text-muted-foreground"
                  aria-label="Share"
                >
                  <Share2 className="size-4" />
                </button>
                <ReportContentButton
                  target={{
                    contentType: "post",
                    contentId: post.id,
                    reportedUserId: post.user_id,
                    label: post.body.slice(0, 120),
                  }}
                  className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-destructive"
                  onBlocked={() => router.refresh()}
                />
                {post.user_id === currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="text-[10px] font-semibold text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <PostCommentsSheet
        postId={commentsPostId}
        currentUserId={currentUserId}
        onClose={() => setCommentsPostId(null)}
        onCommentAdded={() => {
          if (commentsPostId) {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === commentsPostId
                  ? { ...p, comments_count: p.comments_count + 1 }
                  : p,
              ),
            );
          }
          router.refresh();
        }}
      />
    </div>
  );
}
