import { z } from "zod";
import { CapabilitySchema } from "@/lib/contracts/procedure";
import { ProcedureRegistry, defineProcedure } from "@/lib/procedures/registry";
import { knowledgeSearch } from "@/lib/procedures/knowledge-search";
import {
  artifactsCreate,
  artifactsGet,
  artifactsList,
} from "@/lib/procedures/artifacts";
import { dealTermsGet, dealTermsPublish } from "@/lib/procedures/deal-terms";
import {
  approvalsDecide,
  approvalsList,
  approvalsRequest,
} from "@/lib/procedures/approvals";
import { communicationsSend } from "@/lib/procedures/communications";
import { profileConfirmBio, profileUpdate } from "@/lib/procedures/profile-mutations";
import { ndaPrepare, ndaSign } from "@/lib/procedures/nda";
import {
  dataroomDownload,
  dataroomList,
  dataroomPublish,
} from "@/lib/procedures/dataroom";
import { invitationsSend } from "@/lib/procedures/invitations";
import { conversationsGet } from "@/lib/procedures/conversations";
import { meetingsJoin } from "@/lib/procedures/meetings";
import {
  modelDiffScenarios,
  modelExplain,
  modelExport,
  modelGet,
  modelListScenarios,
  modelSaveScenario,
  modelSetVariables,
} from "@/lib/procedures/model";
import { modelReport } from "@/lib/procedures/reports";
import { icpGet, icpList, icpSet, icpVintages } from "@/lib/procedures/icp";
import { tickerList } from "@/lib/procedures/ticker";
import { weatherGet } from "@/lib/procedures/weather";
import { horoscopeGet } from "@/lib/procedures/horoscope";
import { marketsGet } from "@/lib/procedures/markets";
import { newsHeadlines } from "@/lib/procedures/news";
import { mediaGenerate } from "@/lib/procedures/media";

const capabilitiesList = defineProcedure({
  name: "capabilities.list",
  description:
    "List every procedure the caller may invoke — the same map agents introspect.",
  input: z.object({}),
  output: z.object({ capabilities: z.array(CapabilitySchema) }),
  minRole: "guest",
  requiresApproval: false,
  handler: async (_input, ctx) => ({
    capabilities: registry.capabilities({
      role: ctx.actor.role,
      kind: ctx.actor.kind,
    }),
  }),
});

export const registry = new ProcedureRegistry()
  .register(knowledgeSearch)
  .register(artifactsList)
  .register(artifactsCreate)
  .register(artifactsGet)
  .register(dealTermsGet)
  .register(dealTermsPublish)
  .register(approvalsRequest)
  .register(approvalsList)
  .register(approvalsDecide)
  .register(communicationsSend)
  .register(profileUpdate)
  .register(profileConfirmBio)
  .register(ndaPrepare)
  .register(ndaSign)
  .register(dataroomList)
  .register(dataroomDownload)
  .register(dataroomPublish)
  .register(invitationsSend)
  .register(conversationsGet)
  .register(meetingsJoin)
  .register(modelGet)
  .register(modelSetVariables)
  .register(modelReport)
  .register(modelExport)
  .register(icpList)
  .register(icpGet)
  .register(icpSet)
  .register(icpVintages)
  .register(modelSaveScenario)
  .register(modelListScenarios)
  .register(modelExplain)
  .register(modelDiffScenarios)
  .register(tickerList)
  .register(weatherGet)
  .register(horoscopeGet)
  .register(marketsGet)
  .register(newsHeadlines)
  .register(mediaGenerate)
  .register(capabilitiesList);
