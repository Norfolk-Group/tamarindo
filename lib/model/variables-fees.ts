import type { VariableDef } from "@/lib/model/types";

const THESIS = "knowledge/thesis/22-fee-schedule.md";

function usd(
  key: string,
  label: string,
  group: string,
  defaultValue: number,
  note: string,
  max = 50_000,
): VariableDef {
  return {
    key,
    label,
    group,
    type: "usd",
    visibility: "user",
    defaultValue,
    min: 0,
    max,
    citation: { label: "ASSUMPTION", path: THESIS, note },
  };
}

function pct(
  key: string,
  label: string,
  group: string,
  defaultValue: number,
  note: string,
  max = 1,
): VariableDef {
  return {
    key,
    label,
    group,
    type: "percent",
    visibility: "user",
    defaultValue,
    min: 0,
    max,
    step: 0.0005,
    citation: { label: "ASSUMPTION", path: THESIS, note },
  };
}

/**
 * Industry-standard Credit LLC fees. Defaults are $0 / 0% so the live
 * book does not change until Credit turns a lever on.
 */
export const FEE_VARIABLE_DEFS: VariableDef[] = [
  usd("fee.applicationUsd", "Application fee / close", "Fees Credit is paid", 0, "Client. Consumer-finance standard. Zero until scheduled."),
  usd("fee.documentUsd", "Document / admin fee / close", "Fees Credit is paid", 0, "Client. Closing package. Zero until scheduled."),
  usd("fee.creditReportUsd", "Credit-report recovery / close", "Fees Credit is paid", 0, "Client reimburses bureau pull."),
  usd("fee.titleStudyUsd", "Title-study fee / close", "Fees Credit is paid", 0, "Client. Separate from Colombia diligence."),
  usd("fee.wireInUsd", "Wire / ACH fee / close", "Fees Credit is paid", 0, "Client. Payment-rail recovery."),
  usd("fee.lateUsd", "Late fee / event", "Fees Credit is paid", 0, "Per late incident. Incidence below."),
  pct("fee.lateIncidencePct", "Late incidents / active lease / month", "Fees Credit is paid", 0, "0 = none. Turn on with the dollar fee."),
  usd("fee.nsfUsd", "NSF / returned-payment fee / event", "Fees Credit is paid", 0, "Per bounced ACH."),
  pct("fee.nsfIncidencePct", "NSF incidents / active lease / month", "Fees Credit is paid", 0, "0 = none."),
  usd("fee.statementUsd", "Statement fee / lease / month", "Fees Credit is paid", 0, "Usually $0 if e-statements."),
  usd("fee.modificationUsd", "Modification fee / event", "Fees Credit is paid", 0, "Term / rate / party change."),
  pct("fee.modIncidencePct", "Modifications / active lease / month", "Fees Credit is paid", 0, "0 = none."),
  usd("fee.assumptionUsd", "Assumption / transfer fee / event", "Fees Credit is paid", 0, "New lessee takes the contract."),
  pct("fee.assumptionIncidencePct", "Assumptions / active lease / month", "Fees Credit is paid", 0, "0 = none."),
  usd("fee.extensionUsd", "Extension fee / event", "Fees Credit is paid", 0, "Term extension."),
  pct("fee.extensionIncidencePct", "Extensions / active lease / month", "Fees Credit is paid", 0, "0 = none."),
  usd("fee.payoffQuoteUsd", "Payoff-quote fee / event", "Fees Credit is paid", 0, "Written payoff."),
  pct("fee.payoffIncidencePct", "Payoff quotes / active lease / month", "Fees Credit is paid", 0, "0 = none."),
  usd("fee.purchaseOptionUsd", "Purchase-option fee / balloon", "Fees Credit is paid", 0, "Processing when the option is exercised."),
  usd("fee.dispositionUsd", "Disposition fee / balloon", "Fees Credit is paid", 0, "End-of-term residual handling."),
  pct("fee.prepayPenaltyPct", "Early-payoff fee of outstanding", "Fees Credit is paid", 0, "Thesis 17: no penalty is the policy. Lever stays at 0 unless Credit changes it.", 0.05),
  pct("fee.prepayIncidencePct", "Early payoffs / active lease / month", "Fees Credit is paid", 0, "0 = none."),
  usd("fee.defaultUsd", "Default / workout fee / event", "Fees Credit is paid", 0, "WhatsApp: separate delinquent schedule."),
  pct("fee.defaultIncidencePct", "Defaults / active lease / month", "Fees Credit is paid", 0, "0 = none."),
  usd("fee.collectionUsd", "Collection / recovery fee / event", "Fees Credit is paid", 0, "Per recovery action."),
  usd("fee.minServicingUsd", "Minimum servicing / lease / month", "Fees Credit is paid", 0, "Top-up when 75 bps < this floor. WhatsApp seed."),
  usd("fee.forcedPlaceUsd", "Forced-place markup / event", "Fees Credit is paid", 0, "When Credit places insurance."),
  pct("fee.forcedPlaceIncidencePct", "Forced-place / active lease / month", "Fees Credit is paid", 0, "0 = none."),

  pct("fee.unusedLineBps", "Unused-line fee (annual, of undrawn)", "Fees Credit pays", 0, "Warehouse unused-commitment. 0 until Intervest bills it.", 0.05),
  pct("fee.fxHedgeBps", "FX hedge (annual, of funded AUM)", "Fees Credit pays", 0, "Thesis 20: hedge belongs in the model. 0 until a quote.", 0.05),
  pct("fee.referringCostPct", "Referring-partner cost of funded", "Fees Credit pays", 0, "Cost. Never a broker fee on Credit’s own take.", 0.05),
  usd("fee.referringCostUsd", "Referring-partner cost / close", "Fees Credit pays", 0, "Flat alternative or add-on to the %."),
  usd("fee.bureauKycUsd", "Bureau / KYC cost / close", "Fees Credit pays", 0, "What Credit pays the bureau — may recover above."),
  pct("fee.backupServicerBps", "Backup servicer (annual, of AUM)", "Fees Credit pays", 0, "Warehouse often requires a warm backup.", 0.03),
  usd("fee.subservicerUsd", "Subservicer / tech / lease / month", "Fees Credit pays", 0, "Thesis 19: $15–$40+ seed. 0 until a vendor quote."),
  usd("fee.uccFilingUsd", "UCC / filing cost / close", "Fees Credit pays", 0, "US filing if used."),
  usd("fee.wireOutUsd", "Outbound wire cost / close", "Fees Credit pays", 0, "Bank rails Credit pays."),
  usd("fee.notaryRegistroUsd", "Notary / registro cost / close", "Fees Credit pays", 0, "Colombia vendor. Client may also pay diligence."),
];

/** Blue keys this file adds (incidence + dollars). */
export const FEE_BLUE_KEYS = FEE_VARIABLE_DEFS.map((row) => row.key);
