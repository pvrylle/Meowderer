"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ImagePlus, MessageCircle, Share2, X } from "lucide-react";
import { toast } from "sonner";

import {
  createPostAction,
  toggleLikeAction,
} from "@/app/(app)/community/actions";
import { PostCommentsSheet } from "@/components/post-comments-sheet";
import { UserAvatar } from "@/components/user-avatar";
import { CatButton } from "@/components/ui/cat-button";
import { uploadPostImage } from "@/lib/community-upload";
import { formatRelativeTime } from "@/lib/format-time";
import type { PostWithAuthor } from "@/lib/community";
import { cn } from "@/lib/utils";

const CATEGORY_STYLE: Record<string, string> = {
  sighting: "bg-orange/20 text-orange",
  shelter: "bg-green/20 text-green",
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
};

export function CommunityFeed({ posts: initialPosts }: CommunityFeedProps) {
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
        await navigator.share({ title: "CatDex sighting", text });
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
      <form onSubmit={handlePost} className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share a cat sighting…"
          rows={2}
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          required
        />
        <div className="flex flex-wrap gap-2">
          {COMPOSE_CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold capitalize transition-colors",
                category === key
                  ? CATEGORY_STYLE[key]
                  : "border border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {imagePreview && (
          <div className="relative overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="" className="max-h-48 w-full object-cover" />
            <button
              type="button"
              aria-label="Remove image"
              onClick={clearImage}
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <ImagePlus className="size-5" />
            Photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagePick}
          />
          <CatButton type="submit" size="sm" loading={posting}>
            Post
          </CatButton>
        </div>
      </form>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
          No posts yet. Be the first to share a sighting!
        </p>
      ) : (
        posts.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 p-4 pb-2">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={post.author_name}
                  avatarUrl={post.author_avatar}
                />
                <div>
                  <p className="font-bold text-foreground">{post.author_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(post.created_at)}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                  CATEGORY_STYLE[post.category] ?? CATEGORY_STYLE.general,
                )}
              >
                {post.category}
              </span>
            </div>

            <p className="px-4 pb-3 text-sm text-foreground">{post.body}</p>

            {post.image_url && (
              <div className="relative mx-4 mb-3 overflow-hidden rounded-xl bg-muted">
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

            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-muted-foreground">
              <button
                type="button"
                onClick={() => handleLike(post.id)}
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold",
                  post.liked_by_me && "text-destructive",
                )}
              >
                <Heart
                  className={cn("size-4", post.liked_by_me && "fill-destructive")}
                />
                {post.likes_count}
              </button>
              <button
                type="button"
                onClick={() => setCommentsPostId(post.id)}
                className="flex items-center gap-1 text-xs font-semibold"
              >
                <MessageCircle className="size-4" />
                {post.comments_count}
              </button>
              <button
                type="button"
                onClick={() => handleShare(post)}
                className="flex items-center gap-1 text-xs font-semibold"
                aria-label="Share post"
              >
                <Share2 className="size-4" />
              </button>
            </div>
          </article>
        ))
      )}

      <PostCommentsSheet
        postId={commentsPostId}
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
