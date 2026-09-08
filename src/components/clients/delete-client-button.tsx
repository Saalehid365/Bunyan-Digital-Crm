"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteClient } from "@/server/actions/clients";

export function DeleteClientButton({
  clientId,
  clientName,
  compact = false,
  redirectAfter = true,
}: {
  clientId: string;
  clientName: string;
  /** Icon-only trigger, for use in tight spaces like a table row. */
  compact?: boolean;
  /** Whether to navigate to /clients after deleting (skip when already on the list page). */
  redirectAfter?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setPending(true);
    const result = await deleteClient(clientId);
    if (result?.error) {
      toast.error(result.error);
      setPending(false);
      return;
    }
    toast.success(`${clientName} was deleted.`);
    setOpen(false);
    if (redirectAfter) router.push("/clients");
    else router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size={compact ? "icon" : "sm"}
        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {compact ? <span className="sr-only">Delete</span> : "Delete"}
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {clientName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the client along with all of their services, jobs, tasks, logged
            time, and activity history. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
          >
            {pending ? "Deleting…" : "Delete client"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
