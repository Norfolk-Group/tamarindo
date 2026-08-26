export type HelpFamily =
  | "nav"
  | "conversation"
  | "statements"
  | "assumptions"
  | "icp"
  | "admin"
  | "glossary";

export type HelpTopic = {
  id: string;
  title: string;
  family: HelpFamily;
  tip: string;
  body: string;
};

export const HELP_FAMILIES: Array<{ id: HelpFamily; title: string }> = [
  { id: "nav", title: "The sidebar" },
  { id: "conversation", title: "Talking to Nico" },
  { id: "statements", title: "Statements and reports" },
  { id: "assumptions", title: "Assumptions and what-ifs" },
  { id: "icp", title: "Ideal Contract Profiles" },
  { id: "admin", title: "Admin" },
  { id: "glossary", title: "Glossary" },
];

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "nav.conversation",
    title: "Conversation",
    family: "nav",
    tip: "Chat with Nico. He uses the same procedures as the rest of the app — he is not a second product.",
    body: "Conversation is the default. Ask for statements, returns, ICPs, or a what-if. Nico does not invent a raise or an exit IRR. A new conversation only clears the window; he keeps what he learned.",
  },
  {
    id: "nav.statements",
    title: "Statements",
    family: "nav",
    tip: "The live cash-flow book — US, Colombia sucursal, consolidated, and the Intervest vehicle.",
    body: "Opens in the main pane. Numbers are recalculated on the server from your live model. Click a cell to trace its formula. Export Income, Statements, Returns, or Sensitivity to a new tab; from there, PDF (landscape) or CSV.",
  },
  {
    id: "nav.assumptions",
    title: "Assumptions",
    family: "nav",
    tip: "Published inputs you can change. Blue cells are yours. ICP tickets live under Admin.",
    body: "Members edit published (blue) keys and save a personal live model. Reset drops you back to the company model. Named what-ifs snapshot the live model — they are not a second working set. Ideal Contract Profiles are admin-only.",
  },
  {
    id: "nav.artifacts",
    title: "Artifacts",
    family: "nav",
    tip: "Decks, workbooks, and files Nico or you queued. Open from here or from chat.",
    body: "Artifacts are generated documents — raise drafts, structure decks, Excel. They are not the live statements book. Refresh if a job is still building.",
  },
  {
    id: "nav.dataroom",
    title: "Data Room",
    family: "nav",
    tip: "Published files. Confidential rows need an executed NDA.",
    body: "The data room is the file cabinet, not the model. Drafts stay hidden from members. Admins can list drafts. Signing the NDA is a click-wrap in this app, not a scanned PDF.",
  },
  {
    id: "nav.admin",
    title: "Admin",
    family: "nav",
    tip: "Replaces this sidebar. Home comes back. Approvals, capabilities, ICPs, and every assumption.",
    body: "Admin is a second-level rail. It does not stack next to Home. ICPs open in the main pane. Assumptions here include grey operating detail members never see.",
  },
  {
    id: "nav.preferences",
    title: "Preferences",
    family: "nav",
    tip: "Your published assumptions. Same Save / Reset as Assumptions on the first-level rail.",
    body: "Non-admins get Preferences instead of Admin. It is the same live-model inputs, not a second set of numbers.",
  },
  {
    id: "nav.help",
    title: "Help",
    family: "nav",
    tip: "This catalog. Hover any (i) in the app for the short version.",
    body: "Help is the same text Nico uses when you ask “how do I…”. (i) buttons are tooltips. They do not change numbers.",
  },
  {
    id: "nav.home",
    title: "Home",
    family: "nav",
    tip: "Back to the first-level sidebar — Conversation, Statements, Assumptions.",
    body: "Home is always the first command on a second-level rail. It does not reset your live model.",
  },
  {
    id: "nav.signout",
    title: "Sign out",
    family: "nav",
    tip: "Ends the WorkOS session and returns you to sign-in.",
    body: "Sign out does not discard a saved live model. It only ends this browser session.",
  },
  {
    id: "conversation.nico",
    title: "Who Nico is",
    family: "conversation",
    tip: "Tamarindo’s in-house person. He can talk about the work and ordinary life.",
    body: "Nico is not a help desk. Ask him like a colleague. He grounds Tamarindo claims in the thesis and labels FACT / OPINION / ASSUMPTION. For “how does this screen work?”, Help or an (i) is faster than a long chat.",
  },
  {
    id: "statements.live",
    title: "Live model",
    family: "statements",
    tip: "The book you are looking at. Your saved numbers if you have them; otherwise the company model.",
    body: "There is one working set. Named what-ifs sit on a shelf. Sensitivity grids do not save unless you name them. Intervest is the funding vehicle — not OpCo cash and not on the cap table.",
  },
  {
    id: "statements.income",
    title: "Income report",
    family: "statements",
    tip: "Cash-basis operating P&L in a new tab. Not accrual earnings.",
    body: "Income is built from the same engine as Statements. Summary is totals; Extended is every line. Export PDF (landscape) or CSV from that tab.",
  },
  {
    id: "statements.book",
    title: "Statements report",
    family: "statements",
    tip: "The full cash-flow book in a new tab — same cells as this screen.",
    body: "Use this when you want the print/export surface. Hover a cell there for its formula. Blue means input.",
  },
  {
    id: "statements.returns",
    title: "Returns report",
    family: "statements",
    tip: "Unit and book investor returns the engine can compute without inventing an exit.",
    body: "Returns do not invent a sale year or an exit IRR. If a number is missing, the cell stays blank.",
  },
  {
    id: "statements.sensitivity",
    title: "Sensitivity report",
    family: "statements",
    tip: "Shocks published levers in memory. Does not save unless you name a what-if.",
    body: "Sensitivity reruns the engine. It is not a second live model. “Save this as {name}” in chat or Assumptions snapshots the live case, not the shock grid.",
  },
  {
    id: "statements.csv",
    title: "CSV",
    family: "statements",
    tip: "The same tables as the HTML tab, for Excel or a data room.",
    body: "CSV is the book as tables. It is not a second set of math.",
  },
  {
    id: "statements.pdf",
    title: "PDF",
    family: "statements",
    tip: "Landscape print of the same cells. Repeating headers. Not a screenshot of this screen.",
    body: "PDF is always landscape. Summary or Extended is chosen on the report tab.",
  },
  {
    id: "statements.excel",
    title: "Excel",
    family: "statements",
    tip: "A workbook spec of the live run — not a stale PNG.",
    body: "Excel is generated from the current live model. It lands as a download, not as the Statements pane.",
  },
  {
    id: "statements.fy1",
    title: "FY1 cash",
    family: "statements",
    tip: "Closing cash after the first fiscal year (Nov–Oct).",
    body: "FY1 is the pilot year. Click the number (or a cell in the grid) to trace the formula.",
  },
  {
    id: "statements.fy10",
    title: "FY10 cash",
    family: "statements",
    tip: "Closing cash at the end of the ten-year plan.",
    body: "FY10 is the planning horizon, not a promise. Partner lines and AUM sit in the other tiles.",
  },
  {
    id: "statements.probe",
    title: "Trace a cell",
    family: "statements",
    tip: "Click a number to see the formula and the inputs it used.",
    body: "Trace is `model.explain`. It reads the live model. It does not edit anything.",
  },
  {
    id: "assumptions.blue",
    title: "Blue inputs",
    family: "assumptions",
    tip: "You type these. Teal border. Same convention as Excel.",
    body: "Members may change every blue key. Admins also see grey operating detail. Percents are typed as 40, not 0.40.",
  },
  {
    id: "assumptions.save",
    title: "Save",
    family: "assumptions",
    tip: "Writes your personal live model. Nobody else’s reports move.",
    body: "First save copies you off the company model. After that, Save updates your copy. Admin Publish is a different door — it writes the shared company model.",
  },
  {
    id: "assumptions.reset",
    title: "Reset",
    family: "assumptions",
    tip: "Drops your personal copy. You inherit the company model again.",
    body: "Reset does not load the previous what-if. It goes to the published company numbers.",
  },
  {
    id: "assumptions.publish",
    title: "Publish",
    family: "assumptions",
    tip: "Admin only. Writes the shared company model. Agents cannot do this.",
    body: "Publish is human-only. Members keep their own live model until they Reset.",
  },
  {
    id: "whatif.shelf",
    title: "Named what-ifs",
    family: "assumptions",
    tip: "Snapshots of the live model. Not a second working set.",
    body: "Save as keeps the live model as it is. Load replaces the live model. Compare shows input and FY cash deltas. Sensitivity grids stay off this shelf.",
  },
  {
    id: "whatif.saveas",
    title: "Save as",
    family: "assumptions",
    tip: "Name a snapshot. The live model does not change.",
    body: "Use this when you like the current numbers and want them on the shelf. Chat: “save this as Rate shock”.",
  },
  {
    id: "whatif.load",
    title: "Load",
    family: "assumptions",
    tip: "Replaces the live model with that snapshot. Reset still goes to the company model.",
    body: "Load is not undo. If you need the previous live numbers, save them first.",
  },
  {
    id: "whatif.compare",
    title: "Compare",
    family: "assumptions",
    tip: "Two named snapshots. Input deltas plus FY1 / FY10 cash — not a second report book.",
    body: "Compare does not change the live model. Open Statements if you want the full book for one of them — load it first.",
  },
  {
    id: "icp.catalog",
    title: "ICPs",
    family: "icp",
    tip: "Ideal Contract Profiles — the permission slip. Six homes, two cars, two aircraft.",
    body: "If a deal does not match an active ICP, it is not done. Only an admin edits them (Admin → ICPs). Members see the effect on Statements. Chat: “list the ICPs” or “what is AUTO-1”.",
  },
  {
    id: "icp.property",
    title: "Property ICPs",
    family: "icp",
    tip: "Six named home contracts. Medellín and Cartagena at launch.",
    body: "These drive home originations and mix. Prices are seeded from 2026 Colombia housing research and the thesis. Rent factor and share-of-time-rented apply only to homes.",
  },
  {
    id: "icp.auto",
    title: "Car ICPs",
    family: "icp",
    tip: "Two Colombia dealer tickets: Prado-class and a city hybrid.",
    body: "The engine picks between AUTO-1 and AUTO-2 by mix. Volume still follows homes × the auto multiple. Tickets are not on member Assumptions.",
  },
  {
    id: "icp.aircraft",
    title: "Aircraft ICPs",
    family: "icp",
    tip: "Two hulls: Andes Caravan and a US–Colombia light jet.",
    body: "This is a finance lease on the hull, not an hourly charter quote. AIR-2 is a large ticket — mix is intentionally light. Volume is aircraft per year after the start month.",
  },
  {
    id: "icp.price",
    title: "Purchase price",
    family: "icp",
    tip: "USD ticket the lease is written on. Restore research seed puts the cited default back.",
    body: "Homes use the property LTV (down payment). Autos fund at 80% LTV; aircraft at 70%. Changing price recalculates funded, residual, and the monthly lease on the server.",
  },
  {
    id: "icp.term",
    title: "Term",
    family: "icp",
    tip: "Months to the purchase option. Not every lease is ten years.",
    body: "Shorter terms raise the monthly lease. Property ICPs already vary (7–12 years). Autos seed 36–48 months; aircraft 7–10 years.",
  },
  {
    id: "icp.rate",
    title: "Client rate",
    family: "icp",
    tip: "Base lease rate before the blended FICO spread.",
    body: "The book then adds the FICO-tier mix (~+34 bps at defaults). This is the US-law Tamarindo rate, not a Colombian bank EA quote.",
  },
  {
    id: "icp.mix",
    title: "Mix weight",
    family: "icp",
    tip: "Share of originations inside this family — homes with homes, cars with cars.",
    body: "Weights are not a percent of the whole book. Property mix is among ICP-1…6. Auto mix is AUTO-1 vs AUTO-2. Aircraft mix is AIR-1 vs AIR-2.",
  },
  {
    id: "icp.rented",
    title: "Share of time rented",
    family: "icp",
    tip: "Homes only. People enjoy the house — default 30%, one-month minimum.",
    body: "Not nightly stays. Gross rent is price × %-of-value × rent factor, then occupied this share of the year.",
  },
  {
    id: "icp.rent-factor",
    title: "Rental strength",
    family: "icp",
    tip: "Homes only. 1 = the standard %-of-value rule. Llanogrande seeds at 0.4.",
    body: "A country house does not rent like a Bocagrande tower. Factor scales the pricing rule, not occupancy.",
  },
  {
    id: "icp.seed",
    title: "Restore research seed",
    family: "icp",
    tip: "Puts the cited default back in the form. Save to write it.",
    body: "Seeds are researched (Colombia 2026 housing and dealer lists; used-aircraft tapes). Restore does not save until you click Save this ICP.",
  },
  {
    id: "admin.approvals",
    title: "Approvals",
    family: "admin",
    tip: "Outward actions waiting on a human. Agents cannot decide these.",
    body: "Email, invites, and similar sends sit here until an admin approves or rejects. One consume per approval.",
  },
  {
    id: "admin.capabilities",
    title: "Capabilities",
    family: "admin",
    tip: "The procedure map — the same list agents introspect.",
    body: "If a button exists, a procedure exists. If a procedure is missing, Nico cannot do it either.",
  },
  {
    id: "admin.icps",
    title: "Admin · ICPs",
    family: "admin",
    tip: "The only place Ideal Contract Profiles can be edited.",
    body: "Opens in the main pane. Members never get this command. See Help → Ideal Contract Profiles.",
  },
  {
    id: "glossary.icp",
    title: "Ideal Contract Profile",
    family: "glossary",
    tip: "A named permission slip: who, what, where, price, term, rate, mix.",
    body: "Not a legal case. Not “your case.” If the deal does not match an ICP, Tamarindo does not do it. Ten profiles: six property, two auto, two aircraft.",
  },
  {
    id: "glossary.live-model",
    title: "Live model",
    family: "glossary",
    tip: "The one working set of numbers. Reports and Nico use this.",
    body: "Company model until you Save; then it is yours. You can keep several named what-ifs on the shelf. Only one is live.",
  },
  {
    id: "glossary.company-model",
    title: "Company model",
    family: "glossary",
    tip: "The shared published numbers. Reset returns you here.",
    body: "Admin Publish writes this. It is not a personal what-if.",
  },
  {
    id: "glossary.residual",
    title: "Residual / balloon",
    family: "glossary",
    tip: "What remains at term end — the purchase-option floor.",
    body: "Homes: the greater of residual-of-funded and a floor of asset value (seed 20%). Autos residual 20% of ticket; aircraft 25% of ticket.",
  },
  {
    id: "glossary.ltv",
    title: "LTV / down payment",
    family: "glossary",
    tip: "Homes seed 40% down (60% LTV). Autos 80% LTV. Aircraft 70% LTV.",
    body: "Down payment is a blue assumption for homes. Auto and aircraft LTVs are product rules, not member what-ifs.",
  },
  {
    id: "artifacts.list",
    title: "Artifacts list",
    family: "nav",
    tip: "Queued files. A kind plus a title. Not the live book.",
    body: "If chat just built a deck or workbook, it appears here. Confidential legal history never goes in this list.",
  },
  {
    id: "dataroom.list",
    title: "Data room list",
    family: "nav",
    tip: "Published documents. NDA gates confidential rows.",
    body: "Drafts are admin-visible. Members see published files. Download is a procedure, same as Nico.",
  },
];

const BY_ID = new Map(HELP_TOPICS.map((row) => [row.id, row]));

export function helpTopic(id: string): HelpTopic | undefined {
  return BY_ID.get(id);
}

export function helpTip(id: string): string {
  return BY_ID.get(id)?.tip ?? "";
}

const SEARCH_STOP = new Set([
  "a",
  "an",
  "and",
  "can",
  "do",
  "does",
  "for",
  "how",
  "i",
  "is",
  "me",
  "of",
  "or",
  "the",
  "this",
  "to",
  "what",
  "whats",
  "where",
]);

export function helpSearchTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !SEARCH_STOP.has(token));
}

export function searchHelp(query: string): HelpTopic[] {
  const q = query.trim().toLowerCase();
  if (!q) return HELP_TOPICS;
  const tokens = helpSearchTokens(q);
  if (tokens.length === 0) {
    return HELP_TOPICS.filter((row) =>
      `${row.id} ${row.title} ${row.tip} ${row.body}`.toLowerCase().includes(q),
    );
  }
  return HELP_TOPICS.filter((row) => {
    const hay = `${row.id} ${row.title} ${row.tip} ${row.body}`.toLowerCase();
    return tokens.every((token) => hay.includes(token));
  });
}

export function scoreHelpTopic(topic: HelpTopic, query: string): number {
  const tokens = helpSearchTokens(query);
  const title = topic.title.toLowerCase();
  const id = topic.id.toLowerCase();
  const tip = topic.tip.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 3;
    if (id.split(".").includes(token) || id.endsWith(`.${token}`)) score += 2;
    if (tip.includes(token)) score += 1;
  }
  return score;
}

export function fieldHelpId(key: string): string | undefined {
  if (key.endsWith(".purchasePriceUsd")) return "icp.price";
  if (key.endsWith(".termMonths")) return "icp.term";
  if (key.endsWith(".clientRate")) return "icp.rate";
  if (key.endsWith(".mixWeight")) return "icp.mix";
  if (key.endsWith(".rentedTimePct")) return "icp.rented";
  if (key.endsWith(".rentFactor")) return "icp.rent-factor";
  return undefined;
}
