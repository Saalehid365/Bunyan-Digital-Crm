"use client";

import { useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/constants";
import { setUserPermissions } from "@/server/actions/team";
import { toast } from "sonner";
import type { Permission } from "@prisma/client";

export function MemberPermissionsControl({
  userId,
  permissions,
  disabled,
}: {
  userId: string;
  permissions: Permission[];
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const count = permissions.length;

  function toggle(permission: Permission) {
    const next = permissions.includes(permission)
      ? permissions.filter((p) => p !== permission)
      : [...permissions, permission];
    startTransition(async () => {
      const result = await setUserPermissions(userId, next);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || pending}
          className={cn("h-7 gap-1.5 text-xs", count > 0 && "border-primary/40 bg-primary/5 text-foreground")}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Permissions
          {count > 0 ? (
            <span className="rounded-full bg-primary/15 px-1.5 font-mono text-[10px] tabular-nums text-primary">
              {count}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-1.5">
        <div className="space-y-0.5">
          {PERMISSIONS.map((perm) => (
            <label
              key={perm.value}
              className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-accent"
            >
              <Checkbox
                className="mt-0.5"
                checked={permissions.includes(perm.value)}
                onCheckedChange={() => toggle(perm.value)}
                disabled={pending}
              />
              <span>
                <span className="block text-sm text-foreground">{perm.label}</span>
                <span className="block text-xs text-muted-foreground">{perm.description}</span>
              </span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
