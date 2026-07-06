"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { deleteCapture, renameCapture } from "@/app/(app)/cat/[id]/actions";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { CatButton } from "@/components/ui/cat-button";
import { Input } from "@/components/ui/input";

export function CatName({
  id,
  initialName,
  nameLocked = false,
  isSuperAdmin = false,
}: {
  id: string;
  initialName: string | null;
  nameLocked?: boolean;
  isSuperAdmin?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName ?? "");
  const [isPending, startTransition] = useTransition();

  const display = initialName?.trim() || "Unnamed cat";
  const canEdit = !nameLocked || isSuperAdmin;

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
      <div className="flex flex-col items-center gap-1">
        <div className="relative flex min-h-8 w-full items-start justify-center px-10">
          <h1 className="max-w-full truncate text-center text-2xl font-extrabold leading-tight text-foreground">
            {display}
          </h1>
          {canEdit && (
            <button
              type="button"
              aria-label="Rename"
              onClick={() => {
                setName(initialName ?? "");
                setEditing(true);
              }}
              className="absolute right-0 top-0 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              <Pencil className="size-4" />
            </button>
          )}
        </div>
        {nameLocked && !isSuperAdmin && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Name locked by community poll
          </p>
        )}
        {nameLocked && isSuperAdmin && (
          <p className="text-[10px] font-semibold text-primary">Super admin override</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  function confirmDelete() {
    startTransition(async () => {
      setConfirmOpen(false);
      await deleteCapture(id);
    });
  }

  return (
    <>
      <CatButton
        type="button"
        variant="ghost"
        block
        loading={isPending}
        onClick={() => setConfirmOpen(true)}
        className="h-10 text-destructive hover:text-destructive"
      >
        <Trash2 className="size-5" />
        Release cat
      </CatButton>

      <ConfirmSheet
        open={confirmOpen}
        title="Release this cat?"
        description="This cat will be removed from your collection. This can't be undone."
        confirmLabel="Release cat"
        destructive
        loading={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
