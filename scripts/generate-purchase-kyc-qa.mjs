#!/usr/bin/env node
/**
 * End-of-lease title + US/Colombia KYC Q&As for Nico.
 * Grounded in knowledge/thesis 17 and 18 (as of 24 Aug 2026).
 * Run: node scripts/generate-purchase-kyc-qa.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "knowledge/qa");
const FILE = path.join(OUT, "purchase-kyc.md");
const README = path.join(OUT, "README.md");

/** @typedef {{ persona: string; q: string; a: string; bucket: string }} QA */

const qa = [];
const seen = new Set();

const P = {
  investor: "investor",
  founder: "founder",
  stakeholder: "stakeholder",
  prospect: "prospect",
  regulator: "regulator",
  friend: "friend",
};

const PERSONAS = Object.values(P);

function add(bucket, persona, q, a) {
  const question = q.replace(/\s+/g, " ").trim();
  const key = question.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  qa.push({
    bucket,
    persona,
    q: question,
    a: a.replace(/\s+/g, " ").trim(),
  });
}

function rotate(i) {
  return PERSONAS[i % PERSONAS.length];
}

const CITIES = ["Medellín", "Cartagena", "El Poblado", "Envigado", "Bocagrande"];
const ASSETS = ["home", "apartment", "auto", "car"];

// ---------------------------------------------------------------------------
// Homes — two-contract stack
// ---------------------------------------------------------------------------

add(
  "title-home",
  P.prospect,
  "If I pay the balloon, do I automatically own the apartment?",
  "No. CONTEXT, thesis 17: the US balloon closes the payment contract. Colombian dominio moves only by escritura pública plus inscription at the Oficina de Registro (CC 1857, CC 756). Paying Intervest does not put you on the folio by itself.",
);

add(
  "title-home",
  P.friend,
  "So the wire to Intervest is the closing?",
  "It is the money closing. FACT: land sale is not perfect until escritura (CC 1857), and tradición of land is registro (CC 756; Ley 1579/2012). Two closings, same customer.",
);

add(
  "title-home",
  P.founder,
  "What is the intended exercise sequence for a home?",
  "ASSUMPTION then FACT, thesis 17: (1) option notice under the US lease, (2) balloon wire to Intervest, (3) title study — Certificado de Tradición y Libertad, paz y salvo predial, no blocking embargo, (4) escritura of compraventa or fiducia equivalent, (5) inscribe at the ORIP of the predio, (6) BanRep FDI canalization if funds are foreign-source, (7) terminate comodato and close the US lease.",
);

add(
  "title-home",
  P.investor,
  "Does comodato already give the client title?",
  "No. FACT: comodato (CC 2200 ff.) is a loan for use. It does not transfer dominio. Comodato precario can be called at any time (CC 2219). Title stays with the vehicle until escritura + registro.",
);

add(
  "title-home",
  P.regulator,
  "When does ownership count against third parties?",
  "FACT: from registro at the ORIP, not from the notary signing the escritura (CC 756). Nico should not say 'you own it the day you sign at the notary' as against the world.",
);

add(
  "title-home",
  P.stakeholder,
  "If title sits in a fiducia, is the closing a simple sucursal deed?",
  "CONTEXT, thesis 17: not necessarily. The instrument may be sale by the fiduciaria, restitución, or assignment of fiduciary rights. Counsel picks the form; Nico does not invent a sucursal escritura if the folio is a patrimonio autónomo.",
);

add(
  "title-home",
  P.prospect,
  "Can I stay on as a tenant if I don't buy?",
  "ASSUMPTION / Granola: there is no Colombian put and no designed lease extension — extension was deferred as too complex. Walk-away: title stays with the vehicle; comodato ends; possession returns. Do not promise a holdover rent.",
);

CITIES.forEach((city, i) => {
  add(
    "title-home",
    rotate(i),
    `How do I take title to the ${city} apartment at the end of the lease?`,
    `Same two-step as any Colombian home, thesis 17: pay the US balloon, then escritura + ORIP registro in ${city}'s relevant circle. Visa is not a condition of purchase. Passport + RUT. Paying Intervest alone does not change the folio.`,
  );
  add(
    "title-home",
    rotate(i + 3),
    `Does the ${city} notary put me on title when I wire the residual?`,
    `The notary can only write the escritura you show up for. CONTEXT: the wire is the US money close. The folio changes when that escritura is inscribed at the ORIP. ${city} does not have a special 'balloon = title' shortcut.`,
  );
});

// ---------------------------------------------------------------------------
// Foreigners / visa myth / ID
// ---------------------------------------------------------------------------

add(
  "foreigner",
  P.prospect,
  "Do I need a Colombian visa to buy the home at option exercise?",
  "No. FACT, thesis 17: no visa statute conditions land purchase. A tourist can buy. A Tamarindo lease is not an inversionista visa — title is the vehicle's until the option (thesis 15).",
);

add(
  "foreigner",
  P.friend,
  "I only have a US passport. Can I still close?",
  "Yes. FACT: the notary identifies you on passport. CONTEXT: you will also need RUT/NIT in practice (DIAN). Cédula de extranjería only if you already have one — it is not a civil-law condition of purchase.",
);

add(
  "foreigner",
  P.regulator,
  "Is cédula de extranjería required for a foreign buyer of urban land?",
  "No. FACT: visa/cédula is not a civil-law condition of purchase (Código Civil; Estatuto de Registro Ley 1579/2012). Notary ID is typically passport. RUT is the tax file, not a visa.",
);

add(
  "foreigner",
  P.investor,
  "Can a US LLC be the buyer on the escritura?",
  "Yes in form. FACT/CONTEXT, thesis 17: US LLC buyer needs apostilled formation + authority + NIT/RUT. Isolated purchase by a foreign company is not, by itself, 'permanent business' requiring a sucursal (C. Co. 471). A Colombian SAS is often simpler operationally. Launch policy is still individuals/SSNs first (Granola).",
);

add(
  "foreigner",
  P.founder,
  "Why did we say launch is individuals with SSNs only?",
  "Granola / CONTEXT, thesis 18: avoid corporate KYC at first. US-side file is Plaid + driver's license + SSN. The purchase right is assignable subject to local KYC — an assignee still has to pass OFAC and the notary/RUNT file.",
);

add(
  "foreigner",
  P.prospect,
  "Can I assign the purchase option to my spouse or my LLC?",
  "CONTEXT, thesis 17: the purchase right is assignable, subject to local KYC. The assignee — not just the original lessee — is who the notary identifies and who OFAC screens. Spouse may need to appear depending on marital regime. Do not treat assignment as a KYC skip.",
);

add(
  "foreigner",
  P.friend,
  "I heard foreigners cannot own land within 50 km of the coast or 2 km of the border.",
  "That is a blog myth, not authority. FACT, thesis 16/17: private urban lots are generally acquirable. Do not repeat the 50 km / 2 km ban as law.",
);

add(
  "foreigner",
  P.stakeholder,
  "Does a US SSN or ITIN appear on the Colombian folio?",
  "CONTEXT: SSN/ITIN is not a Colombian title document. The escritura wants passport (and RUT). The US CIP-like file still keeps SSN because launch is individuals and credit/OFAC live in the US book.",
);

["tourist visa", "visitor stamp", "no visa at all", "cédula de extranjería"].forEach(
  (status, i) => {
    add(
      "foreigner",
      rotate(i),
      `Can I buy if my status is ${status}?`,
      status.includes("cédula")
        ? "You can buy with or without it. FACT: cédula is useful ID if you have it, not a condition of dominio. Passport + RUT still carry the file."
        : "Yes. FACT, thesis 17: visa/residency is not required for title. A tourist can buy. Immigration status and dominio are different statutes.",
    );
  },
);

// ---------------------------------------------------------------------------
// Poder / apostille
// ---------------------------------------------------------------------------

add(
  "poder",
  P.prospect,
  "I will be in New York on closing day. How do I sign the escritura?",
  "CONTEXT, thesis 17: poder especial naming the matrícula inmobiliaria, price, and the act. Signed at a Colombian consulate → no apostille. Signed before a US notary → apostille + Spanish translation. The notary verifies identity and sufficiency of the mandate (D.L. 960/1970).",
);

add(
  "poder",
  P.friend,
  "Does a Miami notary poder work in Medellín?",
  "If it is a US notary: apostille + Spanish translation. FACT/CONTEXT, thesis 17. Consular poder skips the apostille. A generic 'power of attorney' that does not name the folio and the act is the usual reject.",
);

add(
  "poder",
  P.founder,
  "What must the poder especial say?",
  "CONTEXT: name the matrícula inmobiliaria, the price, and the specific act (compraventa / fiducia equivalent). The notary checks sufficiency of the mandate. Do not send a blanket US POA and hope.",
);

add(
  "poder",
  P.regulator,
  "Who verifies the foreign buyer at the notary?",
  "FACT: the notary verifies identity and the mandate (D.L. 960/1970). Notaries run SIPLAFT and report foreigners who sign escrituras on a passport to UIAF (IA 17/2016). They report; they do not have a duty to block the act.",
);

add(
  "poder",
  P.investor,
  "Can the sucursal legal rep sign for the seller while the buyer uses a poder?",
  "CONTEXT: yes, that is the usual split. Grantor = sucursal legal rep or fiduciaria. Grantee = client or their attorney-in-fact. Both sides still need sufficient papers.",
);

// ---------------------------------------------------------------------------
// BanRep / withholding / costs
// ---------------------------------------------------------------------------

add(
  "fx-tax",
  P.prospect,
  "I already wired the balloon in dollars in the US. Why is BanRep in the story?",
  "FACT/ASSUMPTION, thesis 17: FX for international investment must go through the mercado cambiario (DCIP-83 / RE 1/2018). Failure mode is later repatriation, not ORIP inscription. Counsel still designs how a US balloon becomes a Colombian FDI story. Nico does not invent the wires.",
);

add(
  "fx-tax",
  P.investor,
  "Does BanRep registration block the registro de tradición?",
  "FACT, thesis 17: no. The declaración de cambio serves as registration when funds are canalized. Missing canalization hurts later repatriation, not the ORIP stamp.",
);

add(
  "fx-tax",
  P.regulator,
  "Who withholds on the residual sale — individual buyer from the sucursal?",
  "CONTEXT, thesis 17: ET 398 is 1% when a natural person sells fixed assets. ET 401 parágrafo keys renta withholding to a legal-person buyer (DIAN Concepto 5148/2026). Individual buyer → sucursal seller: usually no notarial retefuente. SAS/LLC buyer → sucursal: the buyer withholds unless the seller is autorretenedor. Housing rates 1% then 2.5% (DURT 1.2.4.9.1).",
);

add(
  "fx-tax",
  P.founder,
  "What did DIAN Concepto 5148/2026 change for our residual sale?",
  "FACT/CONTEXT: if the buyer is a legal person, renta withholding is a precondition of the escritura. That is why an LLC/SAS buyer is a different withholding map than an individual. Counsel confirms whether the sucursal is autorretenedor.",
);

add(
  "fx-tax",
  P.friend,
  "What do notary and registro cost on top of the balloon?",
  "CONTEXT, thesis 15/17: notary + registro often ~2–3% of price excluding retefuente. Impuesto de registro is departmental. Point at living thesis 15 for the buyer closing stack; do not quote a single national tariff as FACT.",
);

add(
  "fx-tax",
  P.stakeholder,
  "Does cash paid in Colombia for the home help the buyer's fiscal cost?",
  "FACT, thesis 18: ET art. 90 — cash paid for real estate does not enter fiscal cost. Prefer banked funds. If the balloon is paid in the US, the Colombian deed is still a residual sale the notary will KYC.",
);

add(
  "fx-tax",
  P.prospect,
  "Is ganancia ocasional already modeled at option exercise?",
  "CONTEXT, Granola / thesis 17: still open. Tax counsel on ganancia ocasional at the transfer is an open legal item. Nico should not invent a rate or say the client has no Colombian tax on the residual sale.",
);

// ---------------------------------------------------------------------------
// Walk-away / early buyout
// ---------------------------------------------------------------------------

add(
  "exit",
  P.prospect,
  "What if I don't exercise the option?",
  "FACT/CONTEXT, thesis 17: option not exercised is not a forced sale. Title stays on the vehicle. Comodato ends; possession returns. There is no Colombian put (ASSUMPTION).",
);

add(
  "exit",
  P.friend,
  "Can I buy the place in year four instead of year ten?",
  "ASSUMPTION (Tamarindo / Granola), thesis 17: client can prepay any time with no penalty — residual plus remaining principal. The Colombian closing is the same escritura + registro, just earlier.",
);

add(
  "exit",
  P.investor,
  "Is there a prepayment penalty on the lease?",
  "ASSUMPTION, thesis 17: no penalty. Pay residual + remaining principal. This is policy, not a statute. The US lease counsel writes the clause; Nico should label it ASSUMPTION until the form is signed.",
);

add(
  "exit",
  P.founder,
  "Did we design a lease extension if they miss the balloon?",
  "Granola / CONTEXT: extension was deferred as too complex. Do not sell a refinance-in-place as current product.",
);

add(
  "exit",
  P.regulator,
  "If they walk, who holds title and who holds possession?",
  "FACT: title remains with the vehicle (sucursal or fiducia). Possession returns when comodato ends. The US lease closes per its default/expiry clause. Recovery is a vehicle problem, not a Tamarindo balance-sheet property (thesis 01).",
);

ASSETS.forEach((asset, i) => {
  add(
    "exit",
    rotate(i),
    `What happens to the ${asset} if I walk away at term?`,
    `Title stays with the Intervest vehicle. FACT/CONTEXT, thesis 17. You do not keep dominio you never received. Comodato / use ends. Tamarindo does not take the ${asset} onto OpCo's book except incidental recovery windows.`,
  );
});

// ---------------------------------------------------------------------------
// Autos
// ---------------------------------------------------------------------------

add(
  "title-auto",
  P.prospect,
  "How do I take title to the car at the end of the lease?",
  "FACT, thesis 17: RUNT + the organismo de tránsito of matrícula. Buyer and seller must be inscribed in RUNT before traspaso. Foreign adult ID: cédula de extranjería, valid passport, or PPT. Passport is enough; visa is not required.",
);

add(
  "title-auto",
  P.friend,
  "Do I need to live in Colombia to register a car in my name?",
  "No. FACT: a non-resident individual can hold vehicle title on a passport. A Colombian company / sucursal is not required for the buyer.",
);

add(
  "title-auto",
  P.investor,
  "Can we import the client's used US car and then lease it?",
  "No as a permanent import. FACT, thesis 17: permanent import of used passenger vehicles is not authorized (Andean automotive rules). Tourist temporary import (typically up to 6 months) is not a path to Colombian matrícula. End-of-term path is local traspaso or dealer matrícula inicial.",
);

add(
  "title-auto",
  P.founder,
  "What is on the national traspaso checklist?",
  "FACT (national list; Bogotá VUS / typical organismo), thesis 17: both parties on RUNT; SOAT and revisión técnico-mecánica when applicable; paz y salvo impuesto de vehículo and SIMIT comparendos; formulario + contrato de compraventa + VIN; retefuente receipt where required; derechos de tránsito at the organismo of matrícula. Plates usually stay with the vehicle.",
);

add(
  "title-auto",
  P.regulator,
  "What changed on 6 February 2026 for vehicle transfers?",
  "FACT, thesis 17: after 6 Feb 2026, only named-owner transfers — no 'persona indeterminada'. The seller on RUNT must be a named person or company.",
);

add(
  "title-auto",
  P.stakeholder,
  "Who pays the 1% retefuente on a car traspaso?",
  "FACT: ET 398 is 1% if the seller is a natural person. If the seller is the sucursal, confirm whether the secretaría still collects 1% or treats the company as autorretenedor. Annual impuesto de vehículo is a transfer condition, not a transfer tax.",
);

add(
  "title-auto",
  P.prospect,
  "I am on a tourist visa. Can I put the leased car in my name at option?",
  "Yes as to title. FACT: RUNT accepts a valid passport for a foreign adult. Visa is not a condition of traspaso. You must still be inscrito en RUNT and clear SOAT / paz y salvos.",
);

add(
  "title-auto",
  P.friend,
  "Can I just keep driving on the tourist temporary import plates?",
  "That is not the Tamarindo path. FACT: temporary import is typically up to 6 months and is not Colombian matrícula. End of lease is a local traspaso (or dealer matrícula inicial), not a customs rollover.",
);

["Medellín", "Cartagena", "Bogotá"].forEach((city, i) => {
  add(
    "title-auto",
    rotate(i),
    `Where do I do the ${city} car traspaso?`,
    `At the organismo de tránsito of the vehicle's matrícula — not automatically the city where you live. FACT, thesis 17. ${city} may be that organismo; confirm the placa. Both parties must already be on RUNT.`,
  );
});

// ---------------------------------------------------------------------------
// US KYC / BSA
// ---------------------------------------------------------------------------

add(
  "us-kyc",
  P.regulator,
  "Is Tamarindo a Bank Secrecy Act financial institution?",
  "Do not invent a license. CONTEXT, thesis 18: a US specialty lessor of Colombian homes/cars is typically not an RMLO, not an MSB, and not a bank CIP FI. Statute 31 U.S.C. § 5312 is broad; regulation 31 CFR § 1010.100(t) is narrower. Counsel still tests recharacterization of a bargain option as a loan.",
);

add(
  "us-kyc",
  P.founder,
  "Does PATRIOT Act 326 CIP apply to our leases?",
  "FACT, thesis 18: bank CIP (§ 1020.220) applies when a bank opens an account. There is no CIP subpart in Part 1029. If the vehicle is not a covered FI, § 326 CIP does not attach to the lease. Practical name/DOB/address/SSN is policy + credit-bureau demand.",
);

add(
  "us-kyc",
  P.investor,
  "Are we a money services business because we collect rent and balloons?",
  "Typically no. FACT: collecting funds integral to the sale of goods or provision of services is carved out of money transmission — 31 CFR § 1010.100(ff)(5)(ii)(F). Collecting our own lease receivables is not transmitting other people's money.",
);

add(
  "us-kyc",
  P.stakeholder,
  "Are we a FinCEN 'loan or finance company'?",
  "FACT: FinCEN defined that incrementally as non-bank residential mortgage lenders/originators only (Part 1029; 77 FR 8148). A lessor of Colombian assets is not an RMLO on that definition. Statutory FIs without programs stay temporarily exempt under § 1010.205(b).",
);

add(
  "us-kyc",
  P.prospect,
  "What identity do you take from me on day one?",
  "CONTEXT / launch policy, thesis 18: CIP-like file — name, date of birth, address, SSN/ITIN or passport — plus OFAC SDN screen and FICO with FCRA/ECOA notices. That is policy and credit, not a claim that we are a bank under § 1020.220. Granola: Plaid + driver's license + SSN; individuals only at launch.",
);

add(
  "us-kyc",
  P.friend,
  "Will you file a SAR if something looks weird?",
  "FACT: mandatory SAR only if the entity is a covered FI. A plain lessor has no mandatory SAR. Voluntary disclosure is still protected (31 U.S.C. § 5318(g)(3)). Do not invent a SAR program as if already licensed.",
);

add(
  "us-kyc",
  P.regulator,
  "Does OFAC apply even if we are not a BSA FI?",
  "Yes. FACT, thesis 18: every US person — and typically a foreign branch of a US parent — must not deal with SDNs. Screen lessee and payors at origination, each payment, and list updates. Not BSA-gated.",
);

add(
  "us-kyc",
  P.founder,
  "Do we re-CIP the same customer when they pay the balloon?",
  "FACT/CONTEXT: no new statutory CIP opening if we are not a covered FI. OFAC re-screen still applies because it is a new payment / new property dealing. Form 8300 only if currency > $10k. Colombian notary/RUNT will take full identity again.",
);

add(
  "us-kyc",
  P.investor,
  "If they pay the balloon in cash, is that a CTR?",
  "No. FACT: CTRs are for banks and certain FIs. A trade or business that receives currency over $10,000 files IRS/FinCEN Form 8300 within 15 days. Wires and ACH are not currency for 8300.",
);

add(
  "us-kyc",
  P.prospect,
  "I will wire the $84k balloon. Do you need a source-of-funds letter?",
  "CONTEXT, thesis 18: source-of-funds on large wires is risk policy plus whatever the receiving bank demands under its CIP/CDD. It is not a lessor CTR. OFAC re-screen yes. 8300 no if it is a wire.",
);

add(
  "us-kyc",
  P.stakeholder,
  "Did CTA beneficial-ownership reporting end for our US company?",
  "FACT as of 24 Aug 2026, thesis 18: FinCEN final rule 11 Aug 2026, effective 14 Aug 2026 — US-created companies and US persons file no BOI reports. Remaining reporters are foreign entities registered to do business in a US state, and they must not report US-person beneficial owners. Bank CDD (§ 1010.230) is a different rule and still applies to covered FIs, not to a generic lessor.",
);

add(
  "us-kyc",
  P.regulator,
  "Does ending CTA repeal bank CDD?",
  "No. FACT: CTA text forbids repealing 31 CFR § 1010.230. Covered FIs still collect legal-entity beneficial owners. A non-bank lessor is not a § 1010.230 covered FI.",
);

add(
  "us-kyc",
  P.founder,
  "If we pull FICO, what consumer-credit overlay hits?",
  "FACT, thesis 18: FCRA — we are a user of consumer reports; adverse-action and score disclosures. ECOA/Reg B can cover consumer leases (Brothers v. First Leasing). FACTA Red Flags can apply to creditors with covered accounts. Adjacent to CIP, not a BSA CIP.",
);

add(
  "us-kyc",
  P.investor,
  "Do we need a New York licensed-lender or money-transmitter license?",
  "Do not invent that Tamarindo is DFS-licensed. FACT/CONTEXT, thesis 18: § 340 is about making loans under dollar caps. § 641 is receiving money for transmission. Collecting our own lease receivables is not transmission. A true UCC 2-A lease is generally not Art. IX lending. The recharacterization risk is a finance lease / $1 buyout / bargain balloon.",
);

add(
  "us-kyc",
  P.regulator,
  "What is the NY CFDL issue on commercial lease financing?",
  "CONTEXT, thesis 18: NY CFDL (FSL §§ 801–811; 23 NYCRR 600) can cover commercial lease financing ≤ $2.5M; true UCC 2-A leases are carved out. Sales-finance and mortgage-banker titles are separate facts. Counsel, not Nico, closes the license memo.",
);

// ---------------------------------------------------------------------------
// Colombia AML
// ---------------------------------------------------------------------------

add(
  "co-aml",
  P.regulator,
  "Does the Colombian sucursal run SFC SARLAFT?",
  "Only if it is SFC-supervised. FACT, thesis 18: SARLAFT is for banks, fiduciarias, insurers, brokers (CBJ Parte I, Título IV, Capítulo IV). A title-holding sucursal that is not a fiduciaria is not an SFC SARLAFT subject. If title sits in a fiducia, the fiduciaria is.",
);

add(
  "co-aml",
  P.founder,
  "When does SuperSociedades pull the sucursal into the unified LA/FT system?",
  "FACT, thesis 18: Circular Externa 100-000020 (2 Jul 2026) names sucursales de sociedades extranjeras as sujetos obligados when under SuperSociedades vigilancia/control and they hit UVB tests (ingresos or activos at 31 Dec prior year). Full system ~4,929,017 UVB; lower sectoral (inmobiliario, comercio de vehículos) ~3,696,762 UVB. Do not assume the sucursal is already in.",
);

add(
  "co-aml",
  P.investor,
  "Could selling the residual car pull us into the lower SAGRILAFT threshold?",
  "CONTEXT, thesis 18: vehicle-sale CIIU at residual transfer can pull the lower sectoral threshold. Size and CIIU are counsel facts. Already-obligated: adapt by 31 May 2027. First-time obligated: implement by 31 May of the following year.",
);

add(
  "co-aml",
  P.stakeholder,
  "Who is the real Colombian KYC gate at title transfer?",
  "FACT, thesis 18: the notary. SNR IA 17/2016 + IA 08/2017 — SIPLAFT, ROS immediately, RON quarterly. Oficinas de Registro record the deed; published UIAF architecture for this sector is notary-centric, not a second CIP at registro.",
);

add(
  "co-aml",
  P.prospect,
  "Will the notary refuse to close if my KYC file is thin?",
  "FACT/CONTEXT: notaries identify grantors and report; they do not have a duty to block the act. Thin files still fail practically — the notary will not write an escritura they cannot identify. UIAF wants foreigners who sign on a passport reported.",
);

add(
  "co-aml",
  P.friend,
  "Does the Oficina de Registro run its own CIP on me?",
  "CONTEXT, thesis 18: registro records the tradición. AML reporting architecture published by UIAF for this sector is notary-centric. Do not describe registro as a second FinCEN-style CIP.",
);

add(
  "co-aml",
  P.regulator,
  "If the balloon is paid in the US, which AML books fire?",
  "CONTEXT, thesis 18: US 8300/OFAC/wire-bank CDD fire on the dollar side. Colombian notary SIPLAFT/RON/ROS and DIAN retención fire on the deed. Banco de la República Formulario 4 if the inflow is booked as foreign investment — counsel/FX fact.",
);

add(
  "co-aml",
  P.founder,
  "What Colombian KYC pack do we still owe counsel?",
  "Granola / CONTEXT, thesis 17–18: the Colombian document pack for the final transfer is still an open legal item. Nico can describe notary SIPLAFT + RUNT + RUT; Nico cannot pretend the pack is signed off.",
);

// ---------------------------------------------------------------------------
// Cross-walk / product
// ---------------------------------------------------------------------------

add(
  "cross",
  P.prospect,
  "Is the home closing the same as the car closing?",
  "Same money idea, different title moment. Thesis 17: home = ORIP inscription (CC 756); auto = RUNT traspaso / matrícula. Visa required for neither. Passport + RUT for the home; passport on RUNT for the auto. Walk-away leaves the asset with the vehicle either way.",
);

add(
  "cross",
  P.investor,
  "Does exercise create a new credit decision?",
  "Only if we pull a new report or make a new credit decision. FACT/CONTEXT, thesis 18: FCRA/ECOA refresh only then. OFAC yes. Statutory CIP no (if not a covered FI). Notary/RUNT yes — full identity again.",
);

add(
  "cross",
  P.founder,
  "What should Nico refuse to say about licenses?",
  "Do not say Tamarindo is BSA-licensed, DFS-licensed, SFC-supervised, or already SAGRILAFT-obligated. Thesis 18: treat as an unlicensed US specialty lessor + Colombian title sucursal unless counsel confirms otherwise.",
);

add(
  "cross",
  P.regulator,
  "What is the practical compliance stack if we are not licensed?",
  "CONTEXT only, thesis 18: US origination = CIP-like file + OFAC + FICO with notices. US option = OFAC re-screen, 8300 if cash, source-of-funds policy on large wires. US entity = no domestic CTA BOI after 14 Aug 2026. CO title = notary SIPLAFT + DIAN IDs/RUT + RUNT. CO sucursal = measure UVB + CIIU and implement if the threshold is met.",
);

add(
  "cross",
  P.friend,
  "Can my brother take over the option without giving you his SSN?",
  "Launch is individuals/SSNs. CONTEXT: the purchase right is assignable subject to local KYC. The assignee gets the same CIP-like + OFAC file in the US and the same notary/RUNT identity in Colombia. Assignment is not a privacy hole.",
);

add(
  "cross",
  P.stakeholder,
  "Why keep a CIP-like file if CIP does not attach?",
  "CONTEXT, thesis 18: banks, credit bureaus, OFAC, FCRA, and the Colombian notary will all demand identity. Policy is cheaper than discovering a hole at month 120. Label it policy, not a FinCEN program, so we do not impersonate a licensed FI.",
);

// ---------------------------------------------------------------------------
// Many variants — keep answers grounded, questions conversational
// ---------------------------------------------------------------------------

const homeQs = [
  [
    "When do I get the keys versus when do I get the deed?",
    "Keys/use are comodato from day one. The deed is the option-exercise escritura. FACT: dominio vs third parties is registro, not keys and not the US balloon.",
  ],
  [
    "Who is the seller on the escritura — Tamarindo or Intervest?",
    "CONTEXT: grantor is the titleholder — the vehicle's sucursal legal rep or the fiduciaria. Tamarindo OpCo is not on the folio in the intended stack (thesis 02/17).",
  ],
  [
    "Do I need a Colombian lawyer for the option close?",
    "CONTEXT: you need a notary and, if abroad, a poder. A local attorney is practical for the title study and registro chase. Nico should not sell a 'no lawyer needed' close as FACT.",
  ],
  [
    "What is a Certificado de Tradición y Libertad?",
    "FACT/CONTEXT: the folio extract — owners, mortgages, embargoes. Title study before the residual escritura. If the vehicle's folio is dirty, you do not close.",
  ],
  [
    "What is paz y salvo predial?",
    "CONTEXT: proof the predial (property tax) is current. Typical condition of a clean close, alongside valorización if the city has it.",
  ],
  [
    "Can an embargo stop my purchase option?",
    "Yes in practice. FACT/CONTEXT: a blocking embargo on the folio will stop a clean tradición. The option is only as good as the vehicle's title.",
  ],
  [
    "Is the residual sale a new purchase price for DIAN?",
    "CONTEXT: the escritura states a price. Counsel maps balloon vs deed price vs ganancia ocasional — still open. Do not invent that the balloon is ignored by DIAN.",
  ],
  [
    "Do oficinas de registro run SIPLAFT like notaries?",
    "Published UIAF architecture for this sector is notary-centric (thesis 18). Registro is SNR-supervised but is not described as a second CIP.",
  ],
  [
    "I am buying as a couple. Who must appear?",
    "CONTEXT, thesis 17: spouse may need to appear depending on marital regime. The notary will not guess. Bring the marriage facts to counsel before the poder is drafted.",
  ],
  [
    "Can I put the home in a US revocable trust at exercise?",
    "CONTEXT: possible as a grantee if the notary will take the trust papers (apostille, translation, NIT). Launch policy is still individuals. Treat as assignee KYC, not a default product.",
  ],
  [
    "Does inversionista visa require this purchase?",
    "No, and the inverse is also true. Thesis 15/17: a Tamarindo lease is not an inversionista visa because title is the vehicle's until option. Buying later still does not automatically mint a visa.",
  ],
  [
    "Will you escrow the balloon in Colombia?",
    "ASSUMPTION: the balloon is a US payment to Intervest. Colombian escrow is a counsel design, not current product copy.",
  ],
  [
    "What if the peso moves between notice and escritura?",
    "CONTEXT: the lease balloon is a USD figure. The escritura price is often COP. FX and BanRep canalization are counsel's wire design. Nico does not promise a freeze.",
  ],
  [
    "Can I pay the balloon from a non-US account?",
    "Possible as money. CONTEXT: OFAC still screens the payor. BanRep still cares if funds become FDI. Source-of-funds policy still applies. The receiving bank will CIP its customer.",
  ],
];

homeQs.forEach(([q, a], i) => {
  add("title-home", rotate(i), q, a);
  add(
    "title-home",
    rotate(i + 1),
    `Prospect follow-up: ${q.replace(/\?$/, "")} — same answer?`,
    a,
  );
});

const autoQs = [
  [
    "Do plates change when I take the car?",
    "Usually no. FACT, thesis 17: plates stay with the vehicle. Traspaso changes the named owner on RUNT.",
  ],
  [
    "What is RUNT inscription and how long does it take?",
    "FACT/CONTEXT: buyer and seller must be inscritos en RUNT before traspaso. Foreign adult: cédula, valid passport, or PPT. Timing is operational, not a Nico promise.",
  ],
  [
    "Do I need SOAT in my name before traspaso?",
    "FACT: SOAT (and RTM when applicable) must be loaded on the vehicle. The checklist is vehicle-state plus party identity, not only a bill of sale.",
  ],
  [
    "What if the car has a SIMIT comparendo?",
    "FACT: paz y salvo de comparendos is on the typical checklist. Unpaid tickets stop traspaso.",
  ],
  [
    "Can the sucursal stay on RUNT and just give me a bill of sale?",
    "That is not title. FACT: dominio of a used car moves by traspaso at the organismo of matrícula. A private contrato without RUNT is not the close.",
  ],
  [
    "Is PPT enough if I don't have a passport on me?",
    "FACT: RUNT lists cédula de extranjería, valid passport, or PPT. PPT works. Bring the document that is actually on the inscription.",
  ],
  [
    "Can I register the car to my US LLC?",
    "CONTEXT: a company can be on RUNT with NIT/RUES. Launch is still individuals. Same assignee-KYC idea as the home.",
  ],
  [
    "Does the six-month tourist import convert at option exercise?",
    "No. FACT: temporary import is not matrícula. Tamarindo's path is a locally plated car and a local traspaso.",
  ],
];

autoQs.forEach(([q, a], i) => {
  add("title-auto", rotate(i), q, a);
  add("title-auto", rotate(i + 2), `Auto close: ${q}`, a);
});

const usVariants = [
  [
    "Are we secretly a bank for CIP purposes?",
    "No. FACT, thesis 18: we are not a § 1020.220 bank. Do not talk like we opened a deposit account.",
  ],
  [
    "Why collect SSN if FinCEN does not make us?",
    "CONTEXT: FICO, OFAC, launch policy (individuals only), and the receiving bank. Policy, not impersonation of a BSA program.",
  ],
  [
    "Does a cashier's check count as cash for 8300?",
    "FACT/CONTEXT: Form 8300 covers currency and certain cash equivalents as defined in the form instructions. Wires/ACH do not. Counsel reads the instrument; Nico does not guess every monetary instrument.",
  ],
  [
    "If two related cash payments are $6k and $5k, is that 8300?",
    "FACT: related deals that exceed $10,000 in currency can aggregate. 31 U.S.C. § 5331 / 26 U.S.C. § 6050I / 31 CFR § 1010.330. File within 15 days; annual payer statement.",
  ],
  [
    "Do foreign branches of a US parent get OFAC?",
    "Typically yes. FACT, thesis 18: US persons include US entities and their foreign branches. The Colombian sucursal of a US parent is usually in that picture.",
  ],
  [
    "Is screening only at origination enough?",
    "No. FACT: screen at origination, payment, and list updates. The balloon is a new dealing.",
  ],
  [
    "Can we skip OFAC because the asset is in Colombia?",
    "No. FACT: OFAC is not BSA-gated and is not limited to US-situs assets. A US person dealing with an SDN is the problem, wherever the house sits.",
  ],
  [
    "Did FinCEN delete our old BOI data?",
    "FACT as of the 11 Aug 2026 release: FinCEN will delete previously reported US-person data. US companies no longer file after 14 Aug 2026. Confirm on fincen.gov/boi; do not keep a stale CTA calendar.",
  ],
  [
    "What is FIN-2026-R001?",
    "FACT, thesis 18: 13 Feb 2026 ruling letting covered FIs skip repeat beneficial-owner collection at every new account. It is a bank CDD relief, not a lessor duty.",
  ],
  [
    "Does ECOA apply to a Colombian apartment lease signed in New York?",
    "CONTEXT: consumer leases have been held in ECOA scope (Brothers v. First Leasing, 9th Cir.). The corridor does not erase US credit-decision law if we are creditors pulling US credit. Counsel writes the adverse-action stack.",
  ],
  [
    "If the balloon is economically a $1 buyout, what breaks?",
    "CONTEXT, thesis 16/18: bargain option is the true-lease / UCC 1-203 fail and the NY lending recharacterization risk. That is why the floor is 20% of asset, not $1.",
  ],
  [
    "Is collecting the down payment money transmission?",
    "No on the intended facts. FACT: own receivables integral to the service are not MT. Transmitting a third party's money to a fourth party would be a different product.",
  ],
];

usVariants.forEach(([q, a], i) => {
  add("us-kyc", rotate(i), q, a);
  add("us-kyc", P.regulator, `US book: ${q}`, a);
});

const coVariants = [
  [
    "What is a ROS versus a RON?",
    "FACT, thesis 18: ROS is reporte de operación sospechosa — immediate. RON is operaciones notariales — quarterly. Absence-of-ROS is also quarterly. Notary SIPLAFT, UIAF/SIREL.",
  ],
  [
    "Is SuperSociedades' 2026 circular still SAGRILAFT plus PTEE separately?",
    "No. FACT: CE 100-000020 (2 Jul 2026) unified SAGRILAFT + PTEE into one Sistema de Autocontrol y Gestión de Riesgos LA/FT/FP y C/ST (new Cap. IX).",
  ],
  [
    "What UVB number do I quote for the full system?",
    "Practitioner restatement of CE 100-000020, thesis 18: ~4,929,017 UVB (ingresos or activos). Lower sectoral ~3,696,762 UVB. Confirm on SuperSociedades pedagogía; do not treat a chat number as the gazette.",
  ],
  [
    "If we are under the UVB line, do we ignore LA/FT?",
    "CONTEXT: you may not be a sujeto obligado yet. OFAC (US) and notary SIPLAFT still exist. Do not use 'below threshold' as a reason to onboard an SDN.",
  ],
  [
    "Does a fiduciaria title structure change the AML map?",
    "Yes. FACT: the fiduciaria is SFC-supervised and runs SARLAFT. The sucursal may still have SuperSociedades exposure if it meets UVB. Two different supervisors possible.",
  ],
  [
    "Art. 90 ET — say it in one line.",
    "FACT: cash paid for real estate does not enter fiscal cost. Do not close a residual home sale in cash if the buyer cares about basis.",
  ],
  [
    "SFC cash report to UIAF — does that hit us?",
    "FACT: SFC entities report individual cash ≥ COP 10m to UIAF. A non-SFC sucursal is not that reporter. The notary and, if used, the bank still have their own eyes.",
  ],
  [
    "Does DIAN need the buyer's passport on the escritura?",
    "FACT/CONTEXT: buyer/seller IDs, price, and destino go into the deed and withholding file. Foreign buyers commonly need passport + RUT/NIT. The notary is agente de retención on many conveyances (ET 398 and related).",
  ],
];

coVariants.forEach(([q, a], i) => {
  add("co-aml", rotate(i), q, a);
  add("co-aml", P.regulator, `Colombia AML: ${q}`, a);
});

const personaBeats = [
  [
    P.prospect,
    "Walk me through buying the place like I am tired.",
    "You already use it under comodato. Near term you give notice, wire the balloon to Intervest, then a Colombian notary writes the sale and the ORIP stamps the folio. Passport and RUT. No visa. If you skip it, you do not keep the house. Thesis 17.",
  ],
  [
    P.prospect,
    "Walk me through buying the car like I am tired.",
    "Both of you on RUNT. Passport is enough. SOAT, RTM, tax and ticket paz y salvos, then traspaso at the tránsito of the placa. You cannot import your old US daily driver into that story. Thesis 17.",
  ],
  [
    P.friend,
    "Is this just paperwork theater?",
    "The US balloon is real money. The Colombian folio is real title. They are not the same stamp. Skipping the escritura is how you pay and still do not own. Thesis 17.",
  ],
  [
    P.investor,
    "What KYC risk actually kills a deal at month 120?",
    "OFAC hit on the payor, a dirty folio, a poder that does not name the matrícula, missing RUT, or a notary who will not identify a passport foreigner. Not 'we forgot FinCEN CIP' — we are not that FI. Thesis 17–18.",
  ],
  [
    P.founder,
    "What do we tell counsel is still open?",
    "Ganancia ocasional, the Colombian KYC pack for the final step, BanRep wire design for a US balloon, sucursal UVB/CIIU, and whether residual vehicle CIIU trips the lower LA/FT threshold. Thesis 17–18.",
  ],
  [
    P.regulator,
    "Say the license sentence again.",
    "Treat Tamarindo as an unlicensed US specialty lessor plus a Colombian title sucursal unless counsel confirms otherwise. OFAC still applies. Notary SIPLAFT still applies. CIP-like is policy. Thesis 18.",
  ],
  [
    P.stakeholder,
    "How does this change the ICP-1 month-120 story in thesis 13?",
    "The $84k still zeros the vehicle. The client still intends to own the $420k home. The missing sentence was: escritura + registro, not the wire alone. Thesis 13 now points at 17 and 18.",
  ],
];

personaBeats.forEach(([persona, q, a]) => add("cross", persona, q, a));

// Rotate short drills so retrieval has many phrasings
const drills = [
  ["balloon vs title", "Balloon = US money. Title = escritura + ORIP (home) or RUNT traspaso (auto). Thesis 17."],
  ["visa to buy land", "Not required. Tourist can buy. Passport + RUT. Thesis 17."],
  ["visa to take the car", "Not required. Passport on RUNT. Thesis 17."],
  ["used-car import", "Permanent used-passenger import not authorized. Temporary tourist import ≠ matrícula. Thesis 17."],
  ["Form 8300", "Trade or business receiving currency > $10k. Not a bank CTR. Wires are not currency. Thesis 18."],
  ["OFAC at balloon", "Re-screen. New payment. Not optional because CIP is off. Thesis 18."],
  ["CTA 2026", "US companies: no BOI after 14 Aug 2026. Thesis 18."],
  ["notary SIPLAFT", "The Colombian KYC gate. ROS now, RON quarterly. Thesis 18."],
  ["SFC SARLAFT", "Only SFC-supervised entities. Plain sucursal ≠ fiduciaria. Thesis 18."],
  ["UVB threshold", "Sucursal is in only if SuperSociedades + UVB. ~4.93m full / ~3.70m sectoral. Thesis 18."],
  ["early buyout", "ASSUMPTION: no penalty; residual + remaining principal; same Colombian close, earlier. Thesis 17."],
  ["walk-away", "No put. Title stays with the vehicle. Comodato ends. Thesis 17."],
  ["assign option", "Allowed subject to local KYC. Assignee is screened. Thesis 17–18."],
  ["poder apostille", "US notary → apostille + Spanish. Consulate → no apostille. Name the folio. Thesis 17."],
  ["BanRep vs ORIP", "Missing FDI canalization hurts repatriation, not the registro stamp. Thesis 17."],
  ["individual vs LLC withholding", "Individual→sucursal usually no 398/401. Legal-person buyer withholds (Concepto 5148/2026). Thesis 17."],
  ["named-owner only", "After 6 Feb 2026, no persona indeterminada transfers. Thesis 17."],
  ["launch KYC", "Individuals, SSNs, Plaid, DL. Corporate KYC deferred. Thesis 18."],
  ["no DFS license invented", "True lease ≠ licensed lender. Own receivables ≠ MT. Bargain balloon is the risk. Thesis 18."],
  ["no BSA program invented", "No mandatory SAR, no bank CIP, no Part 1029 RMLO on these facts. OFAC yes. Thesis 18."],
];

drills.forEach(([topic, a], i) => {
  add("drill", rotate(i), `In one line: ${topic}.`, a);
  add("drill", rotate(i + 1), `What does Nico say about ${topic}?`, a);
  add("drill", P.regulator, `Drill for the file: ${topic}.`, a);
  add("drill", rotate(i + 3), `Remind me — ${topic}?`, a);
});

CITIES.forEach((city, i) => {
  add(
    "foreigner",
    rotate(i),
    `I am not Colombian and I want the ${city} unit in my name. Visa?`,
    `No visa required for title in ${city} or anywhere else in this design. FACT, thesis 17. Passport + RUT. Escritura + ORIP. The 50 km myth is still a myth on the coast.`,
  );
  add(
    "poder",
    rotate(i + 2),
    `Can my attorney in ${city} sign while I stay in the US?`,
    `Yes with a poder especial that names the matrícula, price, and act. Consulate or apostilled US notary + Spanish. Thesis 17. ${city} is the notary's city, not a different legal system.`,
  );
});

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

mkdirSync(OUT, { recursive: true });

const parts = [
  "# Purchase, title, and KYC",
  "",
  "Generated Q&A from thesis 17 (end-of-lease title) and 18 (US/Colombia KYC). As of 24 Aug 2026. Grades: FACT / CONTEXT / OPINION / ASSUMPTION. Not legal advice. Do not invent licenses.",
  "",
];
for (const row of qa) {
  parts.push(`### [${row.persona}] ${row.q}`);
  parts.push(row.a);
  parts.push("");
}
writeFileSync(FILE, parts.join("\n"));

const counts = new Map();
for (const row of qa) counts.set(row.bucket, (counts.get(row.bucket) ?? 0) + 1);

const line = `- purchase-kyc.md: ${qa.length} end-of-lease title + US/Colombia KYC Qs from \`scripts/generate-purchase-kyc-qa.mjs\` (thesis 17–18, 24 Aug 2026)`;
let readme = readFileSync(README, "utf8");
if (!readme.includes("purchase-kyc.md")) {
  if (!readme.endsWith("\n")) readme += "\n";
  readme += `\n${line}\n`;
  writeFileSync(README, readme);
} else {
  writeFileSync(README, readme.replace(/^- purchase-kyc\.md:.*$/m, line));
}

console.log(`Wrote ${qa.length} Q&As to knowledge/qa/purchase-kyc.md`);
for (const [bucket, n] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`  ${bucket}: ${n}`);
}
