# CONTRACT — Admin-gated catalogs

**Status:** Accepted in norfolk-kit as ADR 0022
([`docs/decisions/0022-admin-gated-catalogs.md`](https://github.com/Norfolk-Group/norfolk-kit/blob/main/docs/decisions/0022-admin-gated-catalogs.md))
and [`docs/admin-catalog-contract.md`](https://github.com/Norfolk-Group/norfolk-kit/blob/main/docs/admin-catalog-contract.md).  
**First implemented in:** Tamarindo / Nico (`Admin → ICPs`).  
**Does not change the Tamarindo stack** (Workers + Prisma + Neon/Hyperdrive + WorkOS).

A kit default that still uses Railway + Drizzle should map the same nouns,
not copy Tamarindo’s host.

## Why

Some inputs are not blue what-ifs. They are **named profiles** — a countable
set with a who/what, a research seed, and live math. Members must not edit
them. Putting them on the general Assumptions list either leaks writes or
strips the explanation. The surface is a second-level Admin submenu; the
editor is the main pane. UI and the agent call the same procedures.

## Nouns

| Noun | Meaning |
|------|---------|
| **Catalog** | The closed set of named profiles for one domain (homes, cars, hulls, fee cards). |
| **Profile** | One named row: identity, explanation, seed, live computed outputs. |
| **Family** | A partition of the catalog (`property`, `auto`, `aircraft`). Mix weights sum inside a family, not across the whole catalog. |
| **Seed** | The researched default. Cited. Restorable. Not a silent constant. |
| **Research note** | Why this seed, with sources. FACT / OPINION / ASSUMPTION on the number. |
| **Admin wall** | Second-level rail that replaces the first-level sidebar. First command is Home. |

Blue variables stay on Assumptions. Ask, pre-money, and instrument stay on
published Deal Terms. Do not collapse the three.

## MUST

1. Count the profiles in the product contract (Tamarindo: six property, two
   auto, two aircraft). Do not hide a seventh behind a “more” menu.
2. Explain each profile in the admin editor: who, what, where, why this seed.
3. Restrict writes to **admin**. `list` / `get` may be investor-visible.
4. UI and the agent call the **same** set/list/get procedures.
5. Recalculate on the server after a write. The engine reads the live
   profile keys — not a leftover book-level ticket beside them.
6. Cite every seed. Offer **Restore research seed** per profile.
7. Open the catalog from Admin (or the product’s equivalent wall), not from
   the first-level rail. Home returns to the first-level sidebar.
8. Render the explained editor in the **main pane**. The rail is navigation.

## MUST NOT

1. Mark catalog keys `visibility: "user"` so a member can what-if the box.
2. Leave the only editor as a grey accordion on Assumptions.
3. Let chat `set` succeed for a non-admin (empty `applied` is not enough —
   the procedure is forbidden).
4. Keep a parallel ticket/term/rate field the engine still prefers.
5. Invent a seed without a source, or paste a screenshot as the live number.
6. Stack a second sidebar beside Home for this surface.
7. Put the explained cards inside the 240px rail.

## Procedures (map these nouns)

| Procedure | Does |
|-----------|------|
| `{domain}.list` | Every profile in the catalog, with explanation + live math |
| `{domain}.get` | One profile + whatever year slices the engine owns for that id |
| `{domain}.set` | Admin only. Writes that profile’s keys. Recalculates. |

Tamarindo names them `icp.list`, `icp.get`, `icp.set`. A future product may
say `catalog.*`. The verb set does not change.

Assumptions (`model.setVariables`) may persist the same keys for an admin
who is already on the catalog page. That is one store, two doors — not a
second write path with different authz.

## Tamarindo binding

| Family | Profiles | Engine |
|--------|----------|--------|
| Property | ICP-1 … ICP-6 | Home vintages / `computeContracts` |
| Auto | AUTO-1 Andes Family Prado, AUTO-2 City Hybrid CX-30 | Mix-weighted originations |
| Aircraft | AIR-1 Andes Caravan, AIR-2 Caribbean Light Jet | Mix-weighted originations |

Code: `lib/model/icp-catalog.ts`, `components/nico/icp-catalog-workspace.tsx`,
`AdminSectionId = "icps"`.

## Agent-native chat

Honor: “list the ICPs”, “what is AUTO-1”, “explain the Phenom”, “set ICP-1
purchase to 450000” (admin). Refuse a member who asks to change a profile.
Do not invent a hull price or a dealer sticker.

## Feed this back to the kit

The kit ADR is the why. The kit CONTRACT is the guardrail. This file is the
Tamarindo binding. Do not migrate Tamarindo toward Railway, Drizzle, Clerk,
or Vercel to “match the kit.”
