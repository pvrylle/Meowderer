"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import {
  changePasswordAction,
  deleteAccountAction,
  signOutEverywhereAction,
} from "@/app/(app)/settings/account-actions";
import { signOut } from "@/app/auth/actions";
import { CatButton } from "@/components/ui/cat-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsAccountSection() {
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, startChangePassword] = useTransition();
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");

  function handleChangePassword(formData: FormData) {
    startChangePassword(async () => {
      const result = await changePasswordAction(formData);
      if (result.error) toast.error(result.error);
      else toast.success("Password updated.");
    });
  }

  async function handleSignOutEverywhere() {
    setSigningOutAll(true);
    await signOutEverywhereAction();
  }

  async function handleDeleteAccount() {
    if (confirmDelete !== "DELETE") {
      toast.error('Type DELETE to confirm account deletion.');
      return;
    }
    setDeleting(true);
    const result = await deleteAccountAction();
    if (result?.error) {
      toast.error(result.error);
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Account
        </h2>
        <form
          action={handleChangePassword}
          className="space-y-3 rounded-2xl border border-border bg-card p-4"
        >
          <p className="text-sm font-semibold text-foreground">Change password</p>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="New password"
              minLength={8}
              required
              className="h-11 rounded-xl pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <CatButton type="submit" size="sm" block loading={changingPassword}>
            Update password
          </CatButton>
        </form>

        <CatButton
          variant="outline"
          block
          loading={signingOutAll}
          onClick={handleSignOutEverywhere}
        >
          Sign out everywhere
        </CatButton>

        <form action={signOut}>
          <CatButton variant="outline" block type="submit">
            Sign out
          </CatButton>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Delete account
        </h2>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Permanently delete your account, catches, and community content. This cannot be undone.
          </p>
          <Label htmlFor="confirm-delete" className="text-xs font-semibold">
            Type DELETE to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            className="mt-1.5 h-11 rounded-xl"
            autoComplete="off"
          />
          <CatButton
            variant="outline"
            size="sm"
            block
            className="mt-3 border-destructive/50 text-destructive hover:bg-destructive/10"
            loading={deleting}
            onClick={handleDeleteAccount}
          >
            Delete my account
          </CatButton>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Legal & help
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Link
            href="/help"
            className="block border-b border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/50"
          >
            Help & FAQ
          </Link>
          <Link
            href="/legal/privacy"
            className="block border-b border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/50"
          >
            Privacy Policy
          </Link>
          <Link
            href="/legal/terms"
            className="block px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/50"
          >
            Terms of Service
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Privacy
        </h2>
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <p>
            CatDex stores your photos, optional GPS coordinates, and community posts. Location is
            private by default. See the{" "}
            <Link href="/legal/privacy" className="font-semibold text-primary underline">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </div>
      </section>
    </>
  );
}
