"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Send, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { sendTeamMessage, markPortalMessagesReadByTeam } from "@/server/actions/client-portal";

export type MessageRow = { id: string; body: string; senderKind: "TEAM" | "CLIENT"; senderName: string; createdAt: string };

const initial: { error?: string; ok?: boolean } = {};

export function PortalMessagesSection({ clientId, messages }: { clientId: string; messages: MessageRow[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await sendTeamMessage(formData)) ?? {},
    initial,
  );
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    // Refresh so the unread badge next to the Portal tab (rendered in the parent layout)
    // clears right away instead of only on the next navigation.
    markPortalMessagesReadByTeam(clientId).then(() => router.refresh());
  }, [clientId, messages.length, router]);

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Messages with the client
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-0">
        <div ref={listRef} className="flex max-h-[28rem] min-h-[16rem] flex-col gap-3 overflow-y-auto px-4">
          {messages.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No messages yet" description="Send the client a message and they'll see it in their portal." className="border-0" />
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn("flex flex-col", m.senderKind === "TEAM" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                    m.senderKind === "TEAM" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
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
        <form ref={formRef} action={formAction} className="flex items-end gap-2 border-t border-border p-3">
          <input type="hidden" name="clientId" value={clientId} />
          <Textarea name="body" placeholder="Write a message…" rows={2} className="flex-1 resize-none" required />
          <Button type="submit" size="icon" disabled={pending} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {state?.error ? <p className="px-4 pb-3 text-sm text-destructive">{state.error}</p> : null}
      </CardContent>
    </Card>
  );
}
