import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORM_NAME = "revenue-finder";

/** Constant-time string compare that doesn't leak the secret's length through timing. */
function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  const len = Math.max(ab.length, bb.length);
  const pa = Buffer.alloc(len);
  const pb = Buffer.alloc(len);
  ab.copy(pa);
  bb.copy(pb);
  return timingSafeEqual(pa, pb) && ab.length === bb.length;
}

const text = (max: number) => z.string().trim().max(max);
const checkbox = z
  .union([z.string(), z.boolean(), z.undefined()])
  .transform((v) => v === true || (typeof v === "string" && ["yes", "true", "on"].includes(v.trim().toLowerCase())));

const submissionSchema = z.object({
  id: z.string().trim().min(1).max(100),
  form_name: z.string().optional(),
  data: z.object({
    name: text(120).min(1),
    role: text(120).min(1),
    email: text(200).email(),
    phone: text(60).optional(),
    store_url: text(500).min(1),
    platform: text(60).min(1),
    market: text(60).min(1),
    monthly_size: text(120).min(1),
    notes: text(4000).optional(),
    decision_maker_on_call: checkbox,
    access_within_48h: checkbox,
  }),
});

/**
 * Receives Netlify's outgoing "submission_created" webhook for the marketing site's
 * "revenue-finder" form. Public URL, so it is authenticated by a shared secret in the
 * query string (?token=…) rather than a user session. Upserts on Netlify's submission id
 * so webhook retries never create duplicates.
 */
export async function POST(req: Request) {
  const secret = process.env.REVENUE_FINDER_WEBHOOK_SECRET;
  const token = new URL(req.url).searchParams.get("token");
  if (!secret || !token || !safeEqual(token, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Other Netlify forms on the site may share the site-wide hook — quietly ignore them.
  if ((body as { form_name?: unknown } | null)?.form_name !== FORM_NAME) {
    return NextResponse.json({ ignored: true });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }
  const { id, data } = parsed.data;

  const fields = {
    name: data.name,
    role: data.role,
    email: data.email,
    phone: data.phone || null,
    storeUrl: data.store_url,
    platform: data.platform,
    market: data.market,
    monthlySize: data.monthly_size,
    notes: data.notes || null,
    decisionMakerOnCall: data.decision_maker_on_call,
    accessWithin48h: data.access_within_48h,
  };

  // Retries leave the row untouched (update: {}) so status/notes edited in the CRM survive.
  await prisma.revenueFinderApplication.upsert({
    where: { netlifySubmissionId: id },
    create: { ...fields, netlifySubmissionId: id },
    update: {},
  });

  revalidatePath("/revenue-finder");
  return NextResponse.json({ ok: true });
}
