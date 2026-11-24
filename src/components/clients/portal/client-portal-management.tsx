"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { markPortalActivityReadByTeam, markPortalMessagesReadByTeam } from "@/server/actions/client-portal";
import { PortalAccessSection, type PortalUserRow } from "@/components/clients/portal/portal-access-section";
import { PortalResultsSection, type ResultRow } from "@/components/clients/portal/portal-results-section";
import { PortalCampaignsSection, type CampaignRow } from "@/components/clients/portal/portal-campaigns-section";
import { PortalReportsSection, type ReportRow } from "@/components/clients/portal/portal-reports-section";
import { PortalDocumentsSection, type DocumentRow } from "@/components/clients/portal/portal-documents-section";
import { PortalProductsSection, type ProductRow } from "@/components/clients/portal/portal-products-section";
import { PortalBrandSection, type AssetRow, type BrandKit } from "@/components/clients/portal/portal-brand-section";
import { PortalMessagesSection, type MessageRow } from "@/components/clients/portal/portal-messages-section";
import { PortalOnboardingSection } from "@/components/clients/portal/portal-onboarding-section";
import type { OnboardingAnswers } from "@/lib/onboarding";

const TABS = ["onboarding", "access", "results", "campaigns", "reports", "products", "documents", "brand", "messages"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  onboarding: "Onboarding",
  access: "Logins",
  results: "Results",
  campaigns: "Campaigns",
  reports: "Reports",
  products: "Products",
  documents: "Documents",
  brand: "Brand",
  messages: "Messages",
};

export function ClientPortalManagement({
  clientId,
  canManageClients,
  portalUsers,
  results,
  campaigns,
  reports,
  documents,
  products,
  assets,
  brandKit,
  messages,
  onboarding,
}: {
  clientId: string;
  canManageClients: boolean;
  portalUsers: PortalUserRow[];
  results: ResultRow[];
  campaigns: CampaignRow[];
  reports: ReportRow[];
  documents: DocumentRow[];
  products: ProductRow[];
  assets: AssetRow[];
  brandKit: BrandKit | null;
  messages: MessageRow[];
  onboarding: { answers: OnboardingAnswers; submittedAt: string | null };
}) {
  const [tab, setTab] = useState<Tab>("access");
  const router = useRouter();

  useEffect(() => {
    // The Portal tab's badge is one combined number (messages + other activity), so
    // landing on any sub-tab here clears both — not just whichever one you happen to
    // land on. Marking as read updates the client's row, but the badge lives in the
    // parent layout (already rendered) — refresh so it clears immediately instead of
    // only on the next navigation.
    Promise.all([markPortalActivityReadByTeam(clientId), markPortalMessagesReadByTeam(clientId)]).then(() => router.refresh());
  }, [clientId, router]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Client portal</h2>
        <p className="text-sm text-muted-foreground">What this client sees when they sign in to their own portal.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === "onboarding" ? <PortalOnboardingSection answers={onboarding.answers} submittedAt={onboarding.submittedAt} /> : null}
      {tab === "access" ? <PortalAccessSection clientId={clientId} users={portalUsers} canManage={canManageClients} /> : null}
      {tab === "results" ? <PortalResultsSection clientId={clientId} results={results} canManage={canManageClients} /> : null}
      {tab === "campaigns" ? <PortalCampaignsSection clientId={clientId} campaigns={campaigns} canManage={canManageClients} /> : null}
      {tab === "reports" ? <PortalReportsSection clientId={clientId} reports={reports} canManage={canManageClients} /> : null}
      {tab === "products" ? <PortalProductsSection clientId={clientId} products={products} canManage={canManageClients} /> : null}
      {tab === "documents" ? <PortalDocumentsSection clientId={clientId} documents={documents} canManage={canManageClients} /> : null}
      {tab === "brand" ? <PortalBrandSection clientId={clientId} brandKit={brandKit} assets={assets} canManage={canManageClients} /> : null}
      {tab === "messages" ? <PortalMessagesSection clientId={clientId} messages={messages} /> : null}
    </div>
  );
}
