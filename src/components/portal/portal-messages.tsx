"use client";

import { useActionState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendPortalMessage } from "@/server/actions/portal-actions";

type Message = { id: string; body: string; senderKind: "TEAM" | "CLIENT"; senderName: string; createdAt: string };

const initial: { error?: string; ok?: boolean } = {};

export function PortalMessages({ messages }: { messages: Message[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await sendPortalMessage(formData)) ?? {},
    initial,
  );
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col gap-4 p-0">
        <div ref={listRef} className="flex max-h-[28rem] min-h-[16rem] flex-col gap-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No messages yet" description="Send the team a message and they'll reply here." className="border-0" />
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn("flex flex-col", m.senderKind === "CLIENT" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                    m.senderKind === "CLIENT" ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground ring-1 ring-white/10",
                  )}
                >
                  {m.body}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {m.senderName} &middot; {format(new Date(m.createdAt), "d MMM, HH:mm")}
                </p>
              </div>
            ))
          )}
        </div>
        <form ref={formRef} action={formAction} className="flex items-end gap-2 border-t border-white/10 p-3">
          <Textarea name="body" placeholder="Write a message…" rows={2} className="flex-1 resize-none" required />
          <Button type="submit" size="icon" disabled={pending} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {state?.error ? <p className="px-3 pb-3 text-sm text-destructive">{state.error}</p> : null}
      </CardContent>
    </Card>
  );
}
