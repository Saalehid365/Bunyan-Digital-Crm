"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PortalAccessSection, type PortalUserRow } from "@/components/clients/portal/portal-access-section";
import { PortalResultsSection, type ResultRow } from "@/components/clients/portal/portal-results-section";
import { PortalCampaignsSection, type CampaignRow } from "@/components/clients/portal/portal-campaigns-section";
import { PortalReportsSection, type ReportRow } from "@/components/clients/portal/portal-reports-section";
import { PortalDocumentsSection, type DocumentRow } from "@/components/clients/portal/portal-documents-section";
import { PortalBrandSection, type AssetRow, type BrandKit } from "@/components/clients/portal/portal-brand-section";
import { PortalMessagesSection, type MessageRow } from "@/components/clients/portal/portal-messages-section";

const TABS = ["access", "results", "campaigns", "reports", "documents", "brand", "messages"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  access: "Logins",
  results: "Results",
  campaigns: "Campaigns",
  reports: "Reports",
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
  assets,
  brandKit,
  messages,
}: {
  clientId: string;
  canManageClients: boolean;
  portalUsers: PortalUserRow[];
  results: ResultRow[];
  campaigns: CampaignRow[];
  reports: ReportRow[];
  documents: DocumentRow[];
  assets: AssetRow[];
  brandKit: BrandKit | null;
  messages: MessageRow[];
}) {
  const [tab, setTab] = useState<Tab>("access");

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

      {tab === "access" ? <PortalAccessSection clientId={clientId} users={portalUsers} canManage={canManageClients} /> : null}
      {tab === "results" ? <PortalResultsSection clientId={clientId} results={results} canManage={canManageClients} /> : null}
      {tab === "campaigns" ? <PortalCampaignsSection clientId={clientId} campaigns={campaigns} canManage={canManageClients} /> : null}
      {tab === "reports" ? <PortalReportsSection clientId={clientId} reports={reports} canManage={canManageClients} /> : null}
      {tab === "documents" ? <PortalDocumentsSection clientId={clientId} documents={documents} canManage={canManageClients} /> : null}
      {tab === "brand" ? <PortalBrandSection clientId={clientId} brandKit={brandKit} assets={assets} canManage={canManageClients} /> : null}
      {tab === "messages" ? <PortalMessagesSection clientId={clientId} messages={messages} /> : null}
    </div>
  );
}
