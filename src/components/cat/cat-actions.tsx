"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { deleteCapture, renameCapture } from "@/app/(app)/cat/[id]/actions";
import { CatButton } from "@/components/ui/cat-button";
import { Input } from "@/components/ui/input";

export function CatName({
  id,
  initialName,
}: {
  id: string;
  initialName: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName ?? "");
  const [isPending, startTransition] = useTransition();

  const display = initialName?.trim() || "Unnamed cat";

  function save() {
    startTransition(async () => {
      const result = await renameCapture({ id, nickname: name });
      if (result.success) {
        setEditing(false);
        toast.success("Renamed!");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-2xl font-extrabold text-foreground">{display}</h1>
        <button
          type="button"
          aria-label="Rename"
          onClick={() => {
            setName(initialName ?? "");
            setEditing(true);
          }}
          className="text-muted-foreground"
        >
          <Pencil className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        autoFocus
        placeholder="Name this cat"
        className="h-11 rounded-2xl"
      />
      <button
        type="button"
        aria-label="Save"
        onClick={save}
        disabled={isPending}
        className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-50"
      >
        <Check className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => setEditing(false)}
        className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

export function DeleteCatButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Release this cat from your collection?")) return;
    startTransition(async () => {
      await deleteCapture(id);
    });
  }

  return (
    <CatButton
      type="button"
      variant="ghost"
      block
      loading={isPending}
      onClick={handleDelete}
      className="h-10 text-destructive hover:text-destructive"
    >
      <Trash2 className="size-5" />
      Release cat
    </CatButton>
  );
}
