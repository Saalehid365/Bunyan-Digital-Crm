"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientForm } from "@/components/clients/client-form";
import type { ClientStatus } from "@prisma/client";

type ClientDefaults = {
  id: string;
  name: string;
  companyName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: ClientStatus;
  notes?: string | null;
};

export function ClientFormDialog({ client }: { client: ClientDefaults }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" /> Edit
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
        </DialogHeader>
        <ClientForm client={client} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
