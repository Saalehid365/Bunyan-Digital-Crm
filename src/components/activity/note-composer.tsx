"use client";

import { useRef, useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addClientNote } from "@/server/actions/clients";
import { toast } from "sonner";

export function NoteComposer({ clientId }: { clientId: string }) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        startTransition(async () => {
          const result = await addClientNote(clientId, value);
          if (result?.error) toast.error(result.error);
          else setValue("");
        });
      }}
    >
      <Textarea
        placeholder="Log a note about work done for this client…"
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending || !value.trim()}>
          {pending ? "Posting…" : "Post note"}
        </Button>
      </div>
    </form>
  );
}
