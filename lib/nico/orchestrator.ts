import type { Actor } from "@/lib/contracts/procedure";
import type { StreamEvent } from "@/lib/contracts/events";
import { asAgent } from "@/lib/nico/agent-actor";
import { agentToolSet, invokeAgentTool } from "@/lib/nico/registry-tools";
import { isLiveWriteTurn, LIVE_READ_PROCEDURE_SET } from "@/lib/nico/live-tools";
import { appendMessage, ensureConversation } from "@/lib/nico/session";
import { composeAnswer } from "@/lib/nico/composer";
import { learnFromTurn, recallLearned } from "@/lib/nico/memory";
import { loadWho } from "@/lib/nico/who";
import { needsKnowledgeSearch } from "@/lib/nico/knowledge-intent";
import {
  formatScenarioDiffGlance,
  isAssumptionsAsk,
  matchScenarioByName,
  namedScenarioCount,
  parseScenarioAsk,
  type ScenarioAsk,
  type ScenarioDiffGlanceRow,
} from "@/lib/nico/assumption-intent";
import {
  isCashflowModelRequest,
  parseVariableSet,
} from "@/lib/nico/model-intent";
import { formatVariableValue } from "@/lib/model/variable-display";
import { DEFAULT_OPEN_SECTIONS } from "@/lib/model/variable-groups";
import type { ModelVariableView } from "@/lib/model/types";
import { parseReportAsk } from "@/lib/nico/report-intent";
import { buildReportGlance, formatReportFence } from "@/lib/model/report-glance";
import type { ReportKind, ReportWorkbook } from "@/lib/model/report-workbook";
import {
  formatHelpList,
  formatHelpTopic,
  parseHelpAsk,
} from "@/lib/nico/help-intent";
import {
  formatBusinessBrief,
  parseBusinessExplainAsk,
} from "@/lib/nico/business-intent";
import { parseUnitCalcAsk } from "@/lib/nico/unit-intent";
import { detectReplyLanguage } from "@/lib/nico/reply-language";
import {
  calcTicketEconomics,
  formatTicketNote,
  formatTicketTable,
} from "@/lib/model/unit-economics";
import { parseIcpAsk, type IcpAsk } from "@/lib/nico/icp-intent";
import {
  entitiesForWorkbook,
  isWorkbookRequest,
} from "@/lib/nico/workbook-intent";
import { parseWorldAsk } from "@/lib/nico/world-intent";
import { runWorldAsk, worldActivityLabel } from "@/lib/nico/world-tools";
import { parseMediaAsk } from "@/lib/nico/media-intent";
import { parseDeckAsk, type DeckAsk } from "@/lib/nico/deck-intent";
import { UnpublishedTermsError } from "@/lib/artifacts/deck";
import { peopleNoteFor } from "@/lib/nico/people";
import { profileIdFor } from "@/lib/procedures/profile";
import { ProcedureError } from "@/lib/procedures/registry";
import type { KnowledgePassage } from "@/lib/procedures/knowledge-search";

export type TurnOptions = {
  conversationId?: string;
};

/**
 * Nico's conversation turn. Yields StreamEvents consumed by every surface.
 * Tools always invoke as `kind: "agent"` with the session authSubject.
 */
export async function* runTurn(
  message: string,
  actor: Actor,
  options: TurnOptions = {},
): AsyncGenerator<StreamEvent> {
  const traceId = crypto.randomUUID();
  const toolActor = asAgent(actor);
  const conversationId = options.conversationId ?? crypto.randomUUID();

  await persistSafely(async () => {
    const profileId = await profileIdFor(actor.id);
    await ensureConversation(profileId, conversationId);
    await appendMessage({ conversationId, role: "user", content: message });
  });

  yield { type: "activity", state: "listening", label: "Heard you…" };
  yield { type: "activity", state: "thinking", label: "Reading your message…" };

  let passages: KnowledgePassage[] = [];
  const search = needsKnowledgeSearch(message);
  if (search) {
    yield {
      type: "activity",
      state: "researching",
      label: "Searching the Tamarindo knowledge base…",
    };
    try {
      const result = (await invokeAgentTool(
        "knowledge.search",
        { query: message, limit: 6 },
        toolActor,
        traceId,
      )) as { passages: KnowledgePassage[] };
      passages = result.passages;
    } catch (err) {
      if (err instanceof ProcedureError && err.code === "approval_required") {
        yield {
          type: "activity",
          state: "awaiting_approval",
          label: "Waiting for approval…",
        };
        yield { type: "error", message: err.message };
        yield { type: "done" };
        return;
      }
      // Retrieval failing must not kill the turn; Nico says so instead.
    }
  }

  for (const passage of passages) {
    yield {
      type: "source",
      title: passage.title,
      path: passage.path,
      excerpt: passage.excerpt,
    };
  }

  const language = detectReplyLanguage(message);
  let artifactNote: string | undefined;
  let reportPreface = "";
  let waitPreface = "";
  const scenarioAsk = parseScenarioAsk(message);
  const variableSet = parseVariableSet(message);
  const deckAsk = parseDeckAsk(message);
  const reportAsk = parseReportAsk(message);
  const icpAsk = parseIcpAsk(message);
  const helpAsk = parseHelpAsk(message);
  const businessAsk = parseBusinessExplainAsk(message);
  const unitAsk = parseUnitCalcAsk(message);
  const modelAction =
    Boolean(scenarioAsk) ||
    Boolean(variableSet) ||
    Boolean(icpAsk) ||
    Boolean(helpAsk) ||
    Boolean(businessAsk) ||
    Boolean(unitAsk) ||
    Boolean(reportAsk) ||
    isCashflowModelRequest(message) ||
    isWorkbookRequest(message) ||
    Boolean(deckAsk) ||
    isAssumptionsAsk(message);
  if (scenarioAsk) {
    yield {
      type: "activity",
      state: "drafting",
      label: scenarioActivityLabel(scenarioAsk),
    };
    try {
      const result = await runScenarioAsk(scenarioAsk, toolActor, traceId);
      if (result.preface) {
        reportPreface = result.preface;
        yield { type: "token", text: reportPreface };
      }
      artifactNote = result.note;
    } catch (err) {
      artifactNote = `I tried to handle that what-if and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }.`;
    }
  } else if (variableSet) {
    yield {
      type: "activity",
      state: "drafting",
      label: "Updating model variables…",
    };
    try {
      const updated = (await invokeAgentTool(
        "model.setVariables",
        { values: variableSet },
        toolActor,
        traceId,
      )) as {
        applied: string[];
        model: { summary: { fy1ClosingCashUsd: number; fy10ClosingCashUsd: number } };
      };
      const skipped = Object.keys(variableSet).filter(
        (key) => !updated.applied.includes(key),
      );
      const adminOnlyNote = skipped.length
        ? `The variable(s) ${skipped.join(", ")} are admin-only. Your role can change the published set; ask an admin to change these.`
        : undefined;
      if (updated.applied.length === 0) {
        artifactNote = adminOnlyNote;
      } else {
        const successNote = `Updated ${updated.applied.join(", ")}. Consolidated cash FY1 ${updated.model.summary.fy1ClosingCashUsd}, FY10 ${updated.model.summary.fy10ClosingCashUsd}. Open Assumptions or Statements to see the rest.`;
        artifactNote = adminOnlyNote
          ? `${successNote} ${adminOnlyNote}`
          : successNote;
      }
    } catch (err) {
      artifactNote = `I tried to change a variable and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }.`;
    }
  } else if (isAssumptionsAsk(message)) {
    yield {
      type: "activity",
      state: "drafting",
      label: "Reading your assumptions…",
    };
    try {
      const data = (await invokeAgentTool(
        "model.get",
        {},
        toolActor,
        traceId,
      )) as { variables?: ModelVariableView[] };
      const rows = (data.variables ?? []).filter((row) =>
        DEFAULT_OPEN_SECTIONS.includes(row.group),
      );
      const table = [
        "| Input | Value |",
        "| --- | --- |",
        ...rows.map(
          (row) =>
            `| ${row.label} | ${formatVariableValue(row.type, row.value)} |`,
        ),
      ].join("\n");
      reportPreface = `${table}\n\n`;
      yield { type: "token", text: reportPreface };
      artifactNote =
        "Glance is the meeting levers. The rest is in Assumptions. Do not reprint the table.";
    } catch (err) {
      artifactNote = `I tried to read the assumptions and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }.`;
    }
  } else if (icpAsk) {
    yield {
      type: "activity",
      state: "drafting",
      label: icpActivityLabel(icpAsk),
    };
    try {
      artifactNote = await runIcpAsk(icpAsk, toolActor, traceId);
    } catch (err) {
      artifactNote = `I tried to read the ICP catalog and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }.`;
    }
  } else if (reportAsk) {
    if (reportAsk.liveBuild) {
      waitPreface = `${reportAsk.waitLine ?? "Give me a moment — building that from the live model."}\n\n`;
      yield { type: "token", text: waitPreface };
      yield {
        type: "activity",
        state: "drafting",
        label: "Building the report from the live model…",
        progress: 0.2,
      };
    } else {
      yield {
        type: "activity",
        state: "drafting",
        label:
          reportAsk.kind === "returns"
            ? "Calculating investor returns…"
            : reportAsk.kind === "sensitivity"
              ? "Running sensitivity…"
              : `Slicing FY${reportAsk.fromFy ?? 1}–FY${reportAsk.toFy ?? 10}…`,
      };
    }
    try {
      const data = (await invokeAgentTool(
        "model.report",
        {
          kind: reportAsk.kind,
          fromFy: reportAsk.fromFy,
          toFy: reportAsk.toFy,
        },
        toolActor,
        traceId,
      )) as {
        kind: ReportKind;
        fromFy: number;
        toFy: number;
        previewPath?: string;
        workbook?: ReportWorkbook;
        consolidated: {
          years: Array<{
            fy: number;
            label: string;
            closingCashUsd: number;
            originated?: number;
            byIcp?: Array<{ originated: number }>;
          }>;
        };
      };
      if (reportAsk.liveBuild) {
        yield {
          type: "activity",
          state: "drafting",
          label: "Laying out the sheet…",
          progress: 0.7,
        };
      }
      const glance = buildReportGlance({
        kind: data.kind,
        fromFy: data.fromFy,
        toFy: data.toFy,
        workbook: data.workbook,
        consolidated: data.consolidated,
        depth: reportAsk.depth,
      });
      if (glance) {
        reportPreface = formatReportFence(glance);
        yield { type: "token", text: reportPreface };
      }
      const preview =
        " Glance is already on screen — Summary first, Extended is every line. Same numbers. Do not reprint the fence. Full book opens in a new tab; PDF, CSV, and Excel export from that glance.";
      if (data.kind === "income") {
        artifactNote = `I built a cash-basis OpCo income statement from the live model — receipts, payments, cash from operations. It is not an accrual accountant's P&L.${preview}`;
      } else if (data.kind === "returns") {
        artifactNote = `Investor returns, live from the blue-variable set. Unit vehicle IRR is the Intervest-style lease return. OpCo has cash-on-cash, not a fake exit IRR.${preview}`;
      } else if (data.kind === "sensitivity") {
        artifactNote = `Sensitivity grid: down payment, balloon floor, spread, and activation — each shocked, engine rerun. Shocks are not saved.${preview}`;
      } else {
        const years = data.consolidated.years;
        const first = years[0];
        const last = years[years.length - 1];
        const originated = years.reduce(
          (sum, year) =>
            sum +
            (year.byIcp ?? []).reduce((n, row) => n + (row.originated ?? 0), 0),
          0,
        );
        artifactNote =
          first && last
            ? `Period report FY${data.fromFy}–FY${data.toFy} from the cash-flow engine. ${first.label} close ${first.closingCashUsd}; ${last.label} close ${last.closingCashUsd}. Homes originated in the slice: ${originated}.${preview}`
            : `Period report FY${data.fromFy}–FY${data.toFy} came back empty. Open the full book in a new tab.`;
      }
    } catch (err) {
      artifactNote = `I tried to slice that period and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }.`;
    }
  } else if (isCashflowModelRequest(message)) {
    yield {
      type: "activity",
      state: "drafting",
      label: "Running the cash-flow engine…",
    };
    try {
      const data = (await invokeAgentTool(
        "model.get",
        {},
        toolActor,
        traceId,
      )) as {
        model: {
          summary: {
            homesOriginated: number;
            autosOriginated: number;
            aircraftOriginated: number;
            fy1ClosingCashUsd: number;
            fy10ClosingCashUsd: number;
            januaryCohortYear: number;
            lineStepUpPct: number;
          };
        };
      };
      const s = data.model.summary;
      artifactNote = `Cash-flow statement is ready in Model (table, HTML, PDF, Excel). ${s.homesOriginated} homes, ${s.autosOriginated} autos, ${s.aircraftOriginated} aircraft. Year-10 book target $100M property / $30M auto / $20M aircraft; Intervest walks a KPI curve to $75M (50%). January cohort ${s.januaryCohortYear}. Consolidated cash FY1 ${s.fy1ClosingCashUsd}, FY10 ${s.fy10ClosingCashUsd}. Colombia is a for-profit sucursal with its own client fees — not a nonprofit cost center.`;
    } catch (err) {
      artifactNote = `I tried to run the cash-flow model and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }.`;
    }
  } else if (isWorkbookRequest(message)) {
    yield {
      type: "activity",
      state: "drafting",
      label: "Building the Tamarindo worksheet…",
    };
    try {
      const entities = entitiesForWorkbook(message);
      const created = (await invokeAgentTool(
        "artifacts.create",
        {
          kind: "excel",
          title: "Tamarindo family — 10-year worksheet",
          entities,
        },
        toolActor,
        traceId,
      )) as { id: string };
      artifactNote = `Queued a 10-year Excel covering ${entities.join(", ")}. File ${created.id}. Open Files in the left rail. Cited fees and Y1–2 headcount are filled; salaries and unlabeled rates stay blank for us to load together.`;
    } catch (err) {
      artifactNote = `I tried to queue the worksheet and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }. I can still walk the thesis numbers with you.`;
    }
  } else if (deckAsk) {
    yield {
      type: "activity",
      state: "drafting",
      label:
        deckAsk.kind === "memo"
          ? "Writing the structure memo…"
          : "Building the deck…",
    };
    try {
      const created = (await invokeAgentTool(
        "artifacts.create",
        {
          kind: deckAsk.kind,
          title: deckTitle(deckAsk),
          variant: deckAsk.variant,
        },
        toolActor,
        traceId,
      )) as { id: string };
      artifactNote = deckQueuedNote(deckAsk, created.id);
    } catch (err) {
      if (err instanceof UnpublishedTermsError) {
        artifactNote =
          "Deal Terms are not published. I will not invent the ask. I can queue a structure deck or an admin raise-draft instead.";
      } else {
        artifactNote = `I tried to queue that artifact and hit: ${
          err instanceof Error ? err.message : "unknown error"
        }.`;
      }
    }
  } else if (unitAsk) {
    yield {
      type: "activity",
      state: "drafting",
      label:
        unitAsk.kind === "quote"
          ? "Reading live fee seeds…"
          : "Calculating the ticket…",
    };
    try {
      const data = (await invokeAgentTool(
        "model.get",
        {},
        toolActor,
        traceId,
      )) as {
        variables?: Array<{ key: string; value?: unknown }>;
      };
      const views = data.variables ?? [];
      const seeds = {
        originationFeePct: variableNum(views, "originationFeePct", 0.01),
        servicingBps: variableNum(views, "servicingBps", 0.0075),
        activationFeePct: variableNum(views, "activationFeePct", 0.02),
        spreadSharePct: variableNum(views, "spreadSharePct", 0.2),
        clientRate: variableNum(views, "icp.icp1.clientRate", 0.115),
      };
      if (unitAsk.kind === "quote") {
        artifactNote = [
          `Live fee seeds: origination ${(seeds.originationFeePct * 100).toFixed(2)}% of funded, servicing ${(seeds.servicingBps * 10_000).toFixed(0)} bps of outstanding, activation ${(seeds.activationFeePct * 100).toFixed(0)}% of draw, spread ${(seeds.spreadSharePct * 100).toFixed(0)}% of interest.`,
          "WhatsApp 1.50% / 40 bps is a complementary ask. Dollars = funded × rate. Give me a ticket size and I will calculate year one.",
        ].join(" ");
      } else {
        const calc = calcTicketEconomics({
          ...seeds,
          fundedUsd: unitAsk.fundedUsd,
          drawUsd: unitAsk.drawUsd ?? unitAsk.fundedUsd,
        });
        reportPreface = `\n${formatTicketTable(calc)}\n`;
        yield { type: "token", text: reportPreface };
        artifactNote = formatTicketNote(calc);
      }
    } catch (err) {
      artifactNote = `I tried to calculate that ticket and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }.`;
    }
  } else if (businessAsk) {
    yield {
      type: "activity",
      state: "drafting",
      label: "Reading the live book…",
    };
    try {
      const data = (await invokeAgentTool(
        "model.get",
        {},
        toolActor,
        traceId,
      )) as {
        model: {
          summary: {
            homesOriginated: number;
            autosOriginated: number;
            aircraftOriginated: number;
            fy1ClosingCashUsd: number;
            fy10ClosingCashUsd: number;
          };
        };
        variables?: Array<{ key: string; value?: unknown }>;
      };
      const views = data.variables ?? [];
      artifactNote = formatBusinessBrief({
        ...data.model.summary,
        originationFeePct: variableNum(views, "originationFeePct", 0.01),
        servicingBps: variableNum(views, "servicingBps", 0.0075),
        activationFeePct: variableNum(views, "activationFeePct", 0.02),
        spreadSharePct: variableNum(views, "spreadSharePct", 0.2),
      });
    } catch (err) {
      artifactNote = `I tried to read the live book and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }.`;
    }
  } else if (helpAsk) {
    yield {
      type: "activity",
      state: "drafting",
      label: "Opening help…",
    };
    try {
      if (helpAsk.kind === "list") {
        const data = (await invokeAgentTool(
          "help.list",
          { query: helpAsk.query },
          toolActor,
          traceId,
        )) as { topics: Array<{ title: string; tip: string; body: string }> };
        artifactNote = formatHelpList(data.topics);
      } else {
        const data = (await invokeAgentTool(
          "help.get",
          { id: helpAsk.id },
          toolActor,
          traceId,
        )) as { topic: { title: string; body: string } };
        artifactNote = formatHelpTopic(data.topic);
      }
    } catch (err) {
      artifactNote = `I tried to open help and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }.`;
    }
  }

  let mediaNote: string | undefined;
  let mediaPreface = "";
  const mediaAsk = parseMediaAsk(message);
  if (mediaAsk) {
    yield {
      type: "activity",
      state: "generating",
      label:
        mediaAsk.kind === "video"
          ? "Directing a Veo clip…"
          : "Painting with Nano Banana Pro…",
      progress: 0.15,
    };
    try {
      const made = (await invokeAgentTool(
        "media.generate",
        { kind: mediaAsk.kind, prompt: mediaAsk.prompt },
        toolActor,
        traceId,
      )) as {
        kind: "image" | "video";
        status: "ready" | "pending";
        url?: string;
        alt: string;
        title: string;
        operation?: string;
        model: string;
      };
      if (made.status === "ready" && made.url) {
        yield {
          type: "media",
          kind: made.kind,
          url: made.url,
          alt: made.alt,
          title: made.title,
        };
        const fence = made.kind === "video" ? "video" : "image";
        const block = `\n\`\`\`${fence}\n${JSON.stringify({
          url: made.url,
          alt: made.alt,
          title: made.title,
        })}\n\`\`\`\n`;
        mediaPreface = block;
        yield { type: "token", text: block };
        mediaNote = `Ready via ${made.model}. Title: ${made.title}. Already shown in the chat.`;
      } else {
        mediaNote = `Veo is still rendering (${made.operation ?? "queued"}). I will not invent a finished clip.`;
      }
    } catch (err) {
      mediaNote = `I tried to make that ${mediaAsk.kind} and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }.`;
    }
  }

  let worldNote: string | undefined;
  const worldAsk = parseWorldAsk(message);
  if (worldAsk) {
    yield {
      type: "activity",
      state: "researching",
      label: worldActivityLabel(worldAsk),
    };
    try {
      worldNote = await runWorldAsk(
        worldAsk,
        invokeAgentTool,
        toolActor,
        traceId,
      );
    } catch (err) {
      worldNote = `I looked outside and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }.`;
    }
  }

  let memoryNote: string | undefined;
  try {
    const recalled = await recallLearned(message);
    if (recalled) memoryNote = recalled;
  } catch (err) {
    console.warn("[nico] memory recall skipped", err);
  }

  let whoNote: string | undefined;
  let givenName: string | null = null;
  let askGivenName = false;
  let pendingNameAsk = false;
  try {
    const who = await loadWho({
      actor,
      conversationId,
      userMessage: message,
      memoryNote,
    });
    whoNote = who.whoNote;
    givenName = who.givenName;
    askGivenName = who.askGivenName;
    pendingNameAsk = who.pendingNameAsk;
  } catch (err) {
    console.warn("[nico] who skipped", err);
  }

  yield {
    type: "activity",
    state: "thinking",
    label: "Nico is thinking…",
  };

  // Routing signal for the composer's fast tier. A world check (weather,
  // markets) still counts as conversation; grounded or model work does not.
  // Recalled memory is orientation, not analysis — it must not force Sonnet.
  const peopleNote = peopleNoteFor(message);

  const conversational =
    passages.length === 0 &&
    !artifactNote &&
    !modelAction &&
    !mediaNote &&
    !peopleNote;

  // Writes the switchboard already performed stay off the model. Read
  // turns keep live tools so the spoken answer can refresh numbers, tape,
  // and headlines instead of reciting a canned brief.
  const liveWrite = isLiveWriteTurn({
    variableSet,
    workbook: isWorkbookRequest(message),
    deck: deckAsk,
    scenarioKind: scenarioAsk?.kind,
    media: Boolean(mediaNote),
  });
  let tools: Awaited<ReturnType<typeof agentToolSet>> | undefined;
  if (!liveWrite) {
    try {
      tools = await agentToolSet(
        toolActor,
        traceId,
        modelAction ? { allow: LIVE_READ_PROCEDURE_SET } : undefined,
      );
    } catch (err) {
      console.warn("[nico] agent tool set skipped", err);
    }
  }

  let reply = `${mediaPreface}${waitPreface}${reportPreface}`;
  const pendingThoughts: string[] = [];
  const pendingToolCalls: string[] = [];
  let speaking = false;
  try {
    for await (const chunk of composeAnswer(message, passages, {
      artifactNote,
      worldNote,
      memoryNote,
      whoNote,
      givenName,
      askGivenName,
      conversational,
      language,
      mediaNote,
      peopleNote,
      tools,
      onToolCall: (toolName) => {
        pendingToolCalls.push(toolName);
      },
      onThinking: (snippet) => {
        const line = snippet.replace(/\s+/g, " ").trim().slice(0, 140);
        if (line) pendingThoughts.push(line);
      },
    })) {
      while (pendingToolCalls.length) {
        const toolName = pendingToolCalls.shift();
        if (toolName) {
          yield {
            type: "activity",
            state: "researching",
            label: `Running ${toolName.replace(/_/g, ".")}…`,
          };
        }
      }
      while (pendingThoughts.length) {
        const thought = pendingThoughts.shift();
        if (thought) {
          yield {
            type: "activity",
            state: "thinking",
            label: thought,
          };
        }
      }
      if (!chunk) continue;
      if (!speaking) {
        speaking = true;
        yield { type: "activity", state: "speaking", label: "Answering…" };
      }
      reply += chunk;
      yield { type: "token", text: chunk };
      // AE2 live probe (`scripts/ae2-resume.mjs`) uses conversationId `ae2-*`
      // so leftover tokens still exist after a mid-stream disconnect.
      if (conversationId.startsWith("ae2-")) {
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    }
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "Model failed",
    };
    yield { type: "activity", state: "idle", label: "Here to help" };
    yield { type: "done" };
    return;
  }

  await persistSafely(() =>
    appendMessage({ conversationId, role: "assistant", content: reply }),
  );

  await persistSafely(async () => {
    const profileId = await profileIdFor(actor.id);
    await learnFromTurn({
      userMessage: message,
      reply,
      profileId,
      conversationId,
      pendingNameAsk,
      givenName,
    });
  });

  yield { type: "activity", state: "idle", label: "Here to help" };
  yield { type: "done" };
}

function scenarioActivityLabel(ask: ScenarioAsk): string {
  if (ask.kind === "save") return "Saving that what-if…";
  if (ask.kind === "load") return "Loading that what-if…";
  return "Comparing what-ifs…";
}

async function runScenarioAsk(
  ask: ScenarioAsk,
  toolActor: Actor,
  traceId: string,
): Promise<{ note: string; preface?: string }> {
  if (ask.kind === "save") {
    await invokeAgentTool(
      "model.saveScenario",
      { name: ask.name },
      toolActor,
      traceId,
    );
    return {
      note: `Saved this live case as "${ask.name}". Sensitivity grids and unsaved form edits are not in it. Your working set is unchanged.`,
    };
  }

  const listed = (await invokeAgentTool(
    "model.listScenarios",
    {},
    toolActor,
    traceId,
  )) as { scenarios: Array<{ id: string; name: string }> };
  const scenarios = listed.scenarios ?? [];

  if (ask.kind === "load") {
    const match = matchScenarioByName(scenarios, ask.name);
    if (!match) {
      return {
        note: `I don't have a what-if named "${ask.name}". I will not create one.`,
      };
    }
    await invokeAgentTool(
      "model.applyScenario",
      { scenarioId: match.id },
      toolActor,
      traceId,
    );
    const latestNote =
      namedScenarioCount(scenarios, ask.name) > 1
        ? `Loaded the latest "${match.name}" onto your personal case.`
        : `Loaded "${match.name}" onto your personal case.`;
    return {
      note: `${latestNote} That replaces the live case. Reset returns to the company case, not the previous one.`,
    };
  }

  const matchA = matchScenarioByName(scenarios, ask.nameA);
  const matchB = matchScenarioByName(scenarios, ask.nameB);
  if (!matchA || !matchB) {
    const missing = [
      !matchA ? `"${ask.nameA}"` : null,
      !matchB ? `"${ask.nameB}"` : null,
    ]
      .filter(Boolean)
      .join(" and ");
    return {
      note: `I don't have a what-if named ${missing}. I will not create one.`,
    };
  }
  const diff = (await invokeAgentTool(
    "model.diffScenarios",
    { scenarioA: matchA.id, scenarioB: matchB.id },
    toolActor,
    traceId,
  )) as {
    scenarioA: { name: string };
    scenarioB: { name: string };
    changed: ScenarioDiffGlanceRow[];
    totalChanged: number;
  };
  const preface = formatScenarioDiffGlance(diff);
  return {
    preface,
    note: "Glance is the input deltas plus FY cash when it moved. Not the book. Do not reprint the table.",
  };
}

function icpActivityLabel(ask: IcpAsk): string {
  if (ask.kind === "list") return "Reading the ICP catalog…";
  if (ask.kind === "get") return `Opening ${ask.id}…`;
  if (ask.kind === "set") return `Updating ${ask.id}…`;
  return "Reading planned vintages…";
}

async function runIcpAsk(
  ask: IcpAsk,
  toolActor: Actor,
  traceId: string,
): Promise<string> {
  if (ask.kind === "list") {
    const data = (await invokeAgentTool("icp.list", {}, toolActor, traceId)) as {
      icps: Array<{ code: string; name: string; city: string }>;
    };
    const lines = data.icps
      .map((icp) => `${icp.code} ${icp.name} (${icp.city})`)
      .join("; ");
    return `Ten Ideal Contract Profiles from the live engine: ${lines}. Ask for one by id to see lease, residual, and mix.`;
  }
  if (ask.kind === "get") {
    const data = (await invokeAgentTool(
      "icp.get",
      { id: ask.id },
      toolActor,
      traceId,
    )) as {
      icp: {
        code: string;
        name: string;
        city: string;
        purchasePriceUsd: number;
        monthlyLeaseUsd: number;
        residualUsd: number;
        clientRate: number;
        termMonths: number;
      };
    };
    const icp = data.icp;
    return `${icp.code} ${icp.name} in ${icp.city}. Purchase ${icp.purchasePriceUsd}, lease ${icp.monthlyLeaseUsd}/mo, residual ${icp.residualUsd}, rate ${icp.clientRate}, term ${icp.termMonths} months. Numbers are from the cash-flow engine, not a PDF.`;
  }
  if (ask.kind === "set") {
    const updated = (await invokeAgentTool(
      "icp.set",
      { id: ask.id, values: ask.values },
      toolActor,
      traceId,
    )) as {
      applied: string[];
      icp: { code: string; purchasePriceUsd: number; monthlyLeaseUsd: number };
    };
    if (updated.applied.length === 0) {
      return `No ${ask.id} variables were applied. Only an admin can edit Ideal Contract Profiles (Admin → ICPs).`;
    }
    return `Updated ${updated.applied.join(", ")}. ${updated.icp.code} purchase ${updated.icp.purchasePriceUsd}, lease ${updated.icp.monthlyLeaseUsd}/mo. Open Model to see the rest of the book.`;
  }
  const data = (await invokeAgentTool(
    "icp.vintages",
    { year: ask.year, month: ask.month },
    toolActor,
    traceId,
  )) as {
    total: number;
    byMonth: Array<{ year: number; month: number; count: number }>;
    byIcp: Array<{ icpId: string; count: number }>;
  };
  const window =
    ask.year && ask.month
      ? `${ask.year}-${String(ask.month).padStart(2, "0")}`
      : ask.year
        ? String(ask.year)
        : "the plan horizon";
  const mix = data.byIcp
    .filter((row) => row.count > 0)
    .map((row) => `${row.icpId}:${row.count}`)
    .join(", ");
  return `Planned originations in ${window}: ${data.total} homes${mix ? ` (${mix})` : ""}. This is the plan, not a write.`;
}

function deckTitle(ask: DeckAsk): string {
  if (ask.kind === "memo") return "Tamarindo structure memo";
  if (ask.variant === "raise-draft") return "Tamarindo raise (working draft)";
  if (ask.variant === "structure") return "Tamarindo corporate structure";
  return "Tamarindo investor raise";
}

function deckQueuedNote(ask: DeckAsk, id: string): string {
  if (ask.kind === "memo") {
    return `Queued the entity / Ashoka memo. File ${id}. Open Files in the left rail.`;
  }
  if (ask.variant === "raise-draft") {
    return `Queued an admin working raise deck. File ${id}. The ask slide stays unpublished — I did not invent a number.`;
  }
  if (ask.variant === "structure") {
    return `Queued the corporate-structure deck. File ${id}. No raise amount on this one.`;
  }
  return `Queued the investor raise deck. File ${id}. Open Files in the left rail.`;
}

function variableNum(
  views: Array<{ key: string; value?: unknown }>,
  key: string,
  fallback: number,
): number {
  const row = views.find((item) => item.key === key);
  return typeof row?.value === "number" && Number.isFinite(row.value)
    ? row.value
    : fallback;
}

async function persistSafely(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.warn("[nico] conversation persist skipped", err);
  }
}
