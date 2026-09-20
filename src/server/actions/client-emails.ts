"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, canAccessClient } from "@/lib/permissions";
import { sendClientEmail } from "@/lib/email/send-client-email";

const emailSchema = z.object({
  to: z.string().trim().email("Enter a valid email address"),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  body: z.string().trim().min(1, "Write something first").max(10000),
});

export async function sendEmailToClient(clientId: string, formData: FormData) {
  const user = await requireUser();
  if (!(await canAccessClient(user, clientId))) {
    return { error: "You don't have access to this client." };
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { name: true } });
  if (!client) return { error: "Client not found." };

  const parsed = emailSchema.safeParse({
    to: formData.get("to"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  if (!user.email) return { error: "Your account has no email address to reply to." };

  const result = await sendClientEmail({
    to: data.to,
    subject: data.subject,
    body: data.body,
    replyTo: user.email,
  });
  if (!result.ok) return { error: result.error };

  await prisma.activity.create({
    data: {
      clientId,
      type: "EMAIL_SENT",
      message: `${user.name ?? user.email} emailed ${data.to}\nSubject: ${data.subject}\n\n${data.body}`,
      userId: user.id,
    },
  });

  revalidatePath(`/clients/${clientId}/activity`);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}
