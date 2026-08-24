import { createHash } from "node:crypto";
import { CURRENT_NDA_TEMPLATE_VERSION } from "@/lib/domain/access";

/**
 * Admin-controlled NDA body for click-wrap. pdf-lib render is U8 leftover
 * (ask before that package). The hash is what `nda.sign` binds to.
 */
export const NDA_TEMPLATE_BODY = `Tamarindo Mutual Non-Disclosure Agreement
Template ${CURRENT_NDA_TEMPLATE_VERSION}

The signer agrees to keep Tamarindo confidential materials — data-room
files, unpublished deal terms, and internal knowledge — confidential,
and not to share them with anyone who has not signed this same template.
This is click-wrap, not legal advice.
`;

export function ndaTemplateHash(): string {
  return createHash("sha256").update(NDA_TEMPLATE_BODY).digest("hex");
}

export function currentNdaPrepare() {
  return {
    templateVersion: CURRENT_NDA_TEMPLATE_VERSION,
    documentHash: ndaTemplateHash(),
    body: NDA_TEMPLATE_BODY,
  };
}
