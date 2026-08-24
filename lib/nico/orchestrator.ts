import type { Actor } from "@/lib/contracts/procedure";
import type { StreamEvent } from "@/lib/contracts/events";
import { asAgent } from "@/lib/nico/agent-actor";
import { invokeAgentTool } from "@/lib/nico/registry-tools";
import { appendMessage, ensureConversation } from "@/lib/nico/session";
import { composeAnswer } from "@/lib/nico/composer";
import { needsKnowledgeSearch } from "@/lib/nico/knowledge-intent";
import {
  isCashflowModelRequest,
  parseVariableSet,
} from "@/lib/nico/model-intent";
import {
  entitiesForWorkbook,
  isWorkbookRequest,
} from "@/lib/nico/workbook-intent";
import { parseWorldAsk } from "@/lib/nico/world-intent";
import { runWorldAsk, worldActivityLabel } from "@/lib/nico/world-tools";
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

  let artifactNote: string | undefined;
  const variableSet = parseVariableSet(message);
  const modelAction =
    Boolean(variableSet) ||
    isCashflowModelRequest(message) ||
    isWorkbookRequest(message);
  if (variableSet) {
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
        const successNote = `Updated ${updated.applied.join(", ")}. Consolidated cash FY1 ${updated.model.summary.fy1ClosingCashUsd}, FY10 ${updated.model.summary.fy10ClosingCashUsd}. Open Model or Variables to see the rest.`;
        artifactNote = adminOnlyNote
          ? `${successNote} ${adminOnlyNote}`
          : successNote;
      }
    } catch (err) {
      artifactNote = `I tried to change a variable and hit: ${
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
      artifactNote = `Queued a 10-year Excel covering ${entities.join(", ")}. Artifact ${created.id}. Open Artifacts in the left rail. Cited fees and Y1–2 headcount are filled; salaries and unlabeled rates stay blank for us to load together.`;
    } catch (err) {
      artifactNote = `I tried to queue the worksheet and hit: ${
        err instanceof Error ? err.message : "unknown error"
      }. I can still walk the thesis numbers with you.`;
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

  yield { type: "activity", state: "drafting", label: "Drafting a reply…" };

  // Routing signal for the composer's fast tier. A world check (weather,
  // markets) still counts as conversation; grounded or model work does not.
  const conversational = passages.length === 0 && !artifactNote && !modelAction;

  let reply = "";
  try {
    for await (const chunk of composeAnswer(message, passages, {
      artifactNote,
      worldNote,
      conversational,
    })) {
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
    yield { type: "activity", state: "idle", label: "Ready" };
    yield { type: "done" };
    return;
  }

  await persistSafely(() =>
    appendMessage({ conversationId, role: "assistant", content: reply }),
  );

  yield { type: "activity", state: "idle", label: "Ready" };
  yield { type: "done" };
}

async function persistSafely(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.warn("[nico] conversation persist skipped", err);
  }
}
