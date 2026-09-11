"use client";

import { useState } from "react";
import { KeyRound, Dice5, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setUserPassword } from "@/server/actions/team";
import { cn } from "@/lib/utils";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function SetPasswordDialog({
  userId,
  name,
  email,
  hasPassword,
}: {
  userId: string;
  name: string | null;
  email: string;
  hasPassword: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState(generatePassword);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  function reset() {
    setPassword(generatePassword());
    setPending(false);
    setError(null);
    setDone(false);
    setCopied(false);
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const result = await setUserPassword(userId, password);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  async function copyCredentials() {
    await navigator.clipboard.writeText(`Bunyan Digital CRM login\nEmail: ${email}\nPassword: ${password}`);
    setCopied(true);
    toast.success("Copied to clipboard");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-8",
          !hasPassword && "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
        )}
        onClick={() => setOpen(true)}
      >
        <KeyRound className="h-3.5 w-3.5" />
        {hasPassword ? "Reset password" : "No password"}
      </Button>
      <DialogContent className="sm:max-w-sm">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle>Password set</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Share these sign-in details with {name || email} yourself — no email was sent.
            </p>
            <div className="space-y-2 rounded-[var(--radius-md)] border border-border bg-muted/40 p-3 font-mono text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Email</span>
                <p className="text-foreground">{email}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Password</span>
                <p className="text-foreground">{password}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={copyCredentials}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Set password for {name || email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`password-${userId}`}>New password</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`password-${userId}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPassword(generatePassword())}
                  title="Generate a new password"
                >
                  <Dice5 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You&apos;ll share this with them yourself after saving — no email is sent.
              </p>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex justify-end">
              <Button type="button" disabled={pending || password.length < 8} onClick={handleSubmit}>
                {pending ? "Saving…" : "Set password"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
