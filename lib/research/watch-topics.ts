/**
 * Sofia's regulation and ecosystem watch list.
 * Scheduled research (Exa — Q9 settled) reads these topics.
 * Findings stay unlabeled until a source URL is stored (R6).
 */

import type { CenterCitation, CitationLabel } from "@/lib/artifacts/centers";

export type WatchCadenceHours = 6 | 24 | 168;

export type WatchTopic = {
  id: string;
  title: string;
  queries: string[];
  jurisdictions: string[];
  cadenceHours: WatchCadenceHours;
  why: string;
  citation: CenterCitation;
};

const thesis = (file: string, note: string, label: CitationLabel = "OPINION"): CenterCitation => ({
  label,
  path: `knowledge/thesis/${file}`,
  note,
});

export const WATCH_TOPICS: readonly WatchTopic[] = [
  {
    id: "co.lease_vs_credit",
    title: "Colombia lease-to-own vs consumer credit",
    queries: [
      "Colombia leasing habitacional regulación 2026",
      "Colombia usura tasa de usura leasing vs crédito de consumo",
      "comodato versus leasing inmobiliario Colombia",
    ],
    jurisdictions: ["CO"],
    cadenceHours: 24,
    why: "Characterization of the product as lease vs credit changes usury, disclosure, and vehicle docs.",
    citation: thesis("01-thesis.md", "Credit-translation product sits on Colombian property law", "OPINION"),
  },
  {
    id: "co.foreign_ownership",
    title: "Foreign ownership and closing of Colombian homes",
    queries: [
      "Colombia compraventa inmueble extranjeros notaría requisitos",
      "Cartagena predial y gastos de cierre vivienda 2026",
    ],
    jurisdictions: ["CO"],
    cadenceHours: 168,
    why: "Closing cost and title rules feed paid-fee lines and Colombia execution.",
    citation: thesis("02-entities.md", "Colombia is the execution arm for closings", "OPINION"),
  },
  {
    id: "co.str_rental",
    title: "Cartagena / Medellín short-term rental rules",
    queries: [
      "Cartagena regulación vivienda turística 2026",
      "Medellín alojamiento turístico normativa RNT",
    ],
    jurisdictions: ["CO"],
    cadenceHours: 24,
    why: "Rental pool and Ashoka ops depend on local STR / RNT rules.",
    citation: thesis("04-icp-deals.md", "ICP locations include Cartagena / Medellín rental use", "OPINION"),
  },
  {
    id: "co.us_tax",
    title: "US–Colombia tax and sucursal treatment",
    queries: [
      "Colombia sucursal de sociedad extranjera impuesto 2026",
      "US Colombia tax treaty real estate PE",
    ],
    jurisdictions: ["CO", "US"],
    cadenceHours: 168,
    why: "Sucursal and PE treatment is an unlabeled paid-fee risk on Colombia.",
    citation: thesis("02-entities.md", "Tamarindo Colombia is execution, not a profit center", "OPINION"),
  },
  {
    id: "us.consumer_credit",
    title: "US consumer-credit and TILA touchpoints",
    queries: [
      "TILA lease-to-own foreign property US borrower",
      "CFPB consumer credit cross-border housing finance",
    ],
    jurisdictions: ["US"],
    cadenceHours: 168,
    why: "US-side origination of a Colombian lease can still trigger US consumer rules.",
    citation: thesis("01-thesis.md", "Prime US borrower is the demand side", "OPINION"),
  },
  {
    id: "eco.specialty_finance",
    title: "Specialty finance and lease-to-own market news",
    queries: [
      "specialty finance lease-to-own housing 2026",
      "cross-border mortgage alternative Latin America",
      "InterVest Capital Partners specialty finance platform",
    ],
    jurisdictions: ["US", "CO"],
    cadenceHours: 24,
    why: "Comparables and capital-partner appetite for Intervest-style vehicles.",
    citation: thesis("03-ten-year-plan.md", "Marketplace / second corridor depends on capital partners", "OPINION"),
  },
  {
    id: "ch.whatsapp",
    title: "WhatsApp Business commercial and AI rules",
    queries: [
      "WhatsApp Business Cloud API AI agent policy 2026",
      "Meta Commerce Messaging 24 hour window template",
    ],
    jurisdictions: ["US"],
    cadenceHours: 24,
    why: "Nico's WhatsApp channel is gated by Meta policy, not just product choice.",
    citation: {
      label: "FACT",
      path: "docs/nico/04-channels.md",
      note: "WhatsApp Cloud API + 24-hour window",
    },
  },
];

export function topicsDue(nowMs: number, lastRunById: Record<string, number>): WatchTopic[] {
  return WATCH_TOPICS.filter((topic) => {
    const last = lastRunById[topic.id];
    if (last == null) return true;
    return nowMs - last >= topic.cadenceHours * 60 * 60 * 1000;
  });
}
