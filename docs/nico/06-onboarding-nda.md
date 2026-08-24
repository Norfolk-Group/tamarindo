# 06 — Onboarding & NDA

Nico is the front door. New team members and investors don't fill out forms —
they meet Nico. The interview is the form.

## Flow

1. **Invite.** An admin (or Nico, gated by approval) sends a role-tagged
   invitation — team member or investor — via the WorkOS Invitations API.
   Sign-up is protected by Cloudflare Turnstile.

2. **Interview.** First AuthKit login drops the person into the copilot.
   Nico runs a conversational intake: name, organization, how they know
   Tamarindo, investing context if relevant. Under the hood this is
   structured-output extraction filling a `profiles` record.

3. **Bio.** Nico drafts a clean two-paragraph bio from the interview. The
   person approves or edits it in one click.

4. **NDA.** Nico takes the custom Tamarindo NDA template (a document with
   merge fields, controlled in Admin), fills in the counterparty details,
   renders the PDF, and presents it in the conversation. Signing is
   click-wrap:
   - review the document
   - type full legal name
   - draw a signature
   - check the consent box

   We embed the signature into the PDF (pdf-lib), hash the document, and
   record timestamp, IP, and user agent in an audit table. This combination
   (identity + intent + record retention) is what makes it enforceable under
   ESIGN/UETA — the same legal basis DocuSign relies on. The signed PDF is
   stored in R2 and a copy is emailed to the signer via Resend.

   Upgrade path: if certificate-grade signing is ever wanted, swap in the
   Documenso API without changing the flow.

5. **Access.** Only now does the data room unlock. Confidential documents,
   briefs, and meeting materials all check `nda_signed_at` on the profile —
   enforced inside the procedures, so neither a human clicking nor an agent
   calling can leak around it. Until signed, investors see only the public
   tier.

## Data model (summary)

- `profiles` — identity, role (team | investor), org, bio, `nda_signed_at`
- `nda_signatures` — document hash, typed name, signature image ref,
  timestamp, IP, user agent, template version
- `invitations` — role tag, inviter, status
