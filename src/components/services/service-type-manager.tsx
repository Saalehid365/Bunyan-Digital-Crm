"use client";

import { useActionState, useTransition } from "react";
import { Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createServiceType, archiveServiceType } from "@/server/actions/services";

type ServiceType = { id: string; name: string; colorHex: string };

const initialState: { error?: string; ok?: boolean } = {};

export function ServiceTypeManager({ serviceTypes }: { serviceTypes: ServiceType[] }) {
  const [pending, startTransition] = useTransition();
  const [state, formAction, formPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      const result = await createServiceType(formData);
      return result ?? {};
    },
    initialState,
  );

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border">
        {serviceTypes.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.colorHex }} />
              <span className="text-sm text-foreground">{s.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              disabled={pending}
              onClick={() => startTransition(() => archiveServiceType(s.id))}
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
        {serviceTypes.length === 0 ? (
          <li className="py-2.5 text-sm text-muted-foreground">No services yet.</li>
        ) : null}
      </ul>

      <form action={formAction} className="flex items-end gap-2 border-t border-border pt-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="name">New service</Label>
          <Input id="name" name="name" placeholder="e.g. Amazon Management" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="colorHex">Color</Label>
          <Input id="colorHex" name="colorHex" type="color" defaultValue="#E08245" className="h-9 w-14 p-1" />
        </div>
        <Button type="submit" disabled={formPending}>
          Add
        </Button>
      </form>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </div>
  );
}
