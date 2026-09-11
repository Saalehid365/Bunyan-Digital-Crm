"use client";

import { useActionState, useState } from "react";
import { UserPlus, Dice5, Copy, Check } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteUser } from "@/server/actions/team";

const initialState: { error?: string; ok?: boolean } = {};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function InviteMemberDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generatePassword);
  const [copied, setCopied] = useState(false);
  const [invited, setInvited] = useState<{ name: string; email: string; password: string } | null>(null);

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      return await inviteUser(formData);
    },
    initialState,
  );

  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.ok) setInvited({ name, email, password });
  }

  function reset() {
    setName("");
    setEmail("");
    setPassword(generatePassword());
    setCopied(false);
    setInvited(null);
  }

  async function copyCredentials() {
    if (!invited) return;
    await navigator.clipboard.writeText(
      `Bunyan Digital CRM login\nEmail: ${invited.email}\nPassword: ${invited.password}`,
    );
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
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-3.5 w-3.5" /> Invite team member
      </Button>
      <DialogContent className="sm:max-w-sm">
        {invited ? (
          <>
            <DialogHeader>
              <DialogTitle>{invited.name} is in</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Share these sign-in details with them yourself (Slack, WhatsApp, in person) — no email
              was sent. They can set their own password later from Settings.
            </p>
            <div className="space-y-2 rounded-[var(--radius-md)] border border-border bg-muted/40 p-3 font-mono text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Email</span>
                <p className="text-foreground">{invited.email}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Password</span>
                <p className="text-foreground">{invited.password}</p>
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
              <DialogTitle>Invite a team member</DialogTitle>
            </DialogHeader>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="MEMBER">
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Team member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial password</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    className="font-mono"
                    required
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
                  You&apos;ll share this with them yourself after inviting — no email is sent.
                </p>
              </div>
              {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
              <div className="flex justify-end">
                <Button type="submit" disabled={pending}>
                  {pending ? "Inviting…" : "Send invite"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
