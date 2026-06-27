"use client";

import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

import { createPostAction, toggleLikeAction } from "@/app/(app)/community/actions";
import { CatButton } from "@/components/ui/cat-button";
import type { PostWithAuthor } from "@/lib/community";
import { cn } from "@/lib/utils";

const CATEGORY_STYLE: Record<string, string> = {
  sighting: "bg-orange/20 text-orange",
  shelter: "bg-green/20 text-green",
  rescue: "bg-destructive/15 text-destructive",
  general: "bg-primary/15 text-primary",
};

type CommunityFeedProps = {
  posts: PostWithAuthor[];
};

export function CommunityFeed({ posts }: CommunityFeedProps) {
  const router = useRouter();

  async function handleLike(postId: string) {
    const result = await toggleLikeAction(postId);
    if (!result.success) toast.error(result.error ?? "Could not like post.");
    else router.refresh();
  }

  async function handlePost(formData: FormData) {
    const body = formData.get("body") as string;
    const result = await createPostAction({ body, category: "sighting" });
    if (!result.success) toast.error(result.error ?? "Could not post.");
    else {
      toast.success("Posted!");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={handlePost} className="flex gap-2">
        <input
          name="body"
          placeholder="Share a cat sighting…"
          className="min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          required
        />
        <CatButton type="submit" size="sm">
          Post
        </CatButton>
      </form>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
          No posts yet. Be the first to share a sighting!
        </p>
      ) : (
        posts.map((post) => (
          <article
            key={post.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="font-bold text-foreground">{post.author_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                  CATEGORY_STYLE[post.category] ?? CATEGORY_STYLE.general,
                )}
              >
                {post.category}
              </span>
            </div>
            <p className="text-sm text-foreground">{post.body}</p>
            <div className="mt-3 flex items-center justify-between text-muted-foreground">
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
              <span className="flex items-center gap-1 text-xs font-semibold">
                <MessageCircle className="size-4" />
                {post.comments_count}
              </span>
              <button type="button" className="flex items-center gap-1 text-xs font-semibold">
                <Share2 className="size-4" />
                Share
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
