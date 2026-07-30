# Cloudscape gap roadmap

Inceptor already has a strong methodology layer: issue-driven workflow,
governance, modern Astro/React primitives, live demos, and a good test and
validation story. Cloudscape is stronger in a different dimension: it pairs a
large component library with a formal foundation, a pattern catalog, demo
pages, developer guides, and generative AI guidance.

This document turns that comparison into a practical roadmap. The goal is not
to clone Cloudscape component for component. The goal is to close the gaps that
make Inceptor less complete as a framework for building real product surfaces.

## What Inceptor already covers

Inceptor is already ahead of a generic starter in a few areas. It has a
methodology-first workflow, a clear contribution model, a live gallery, composed
demos, Base UI-backed primitives, visual theming, and backend archetypes for
opt-in API support. Those are good foundations to build on.

What is still missing is the surrounding product system: explicit foundation
guidance, a richer pattern library, more enterprise-oriented demo flows, and a
clear path for AI-assisted experiences.

## Gap map

| Area                 | Cloudscape signal                                                                      | Inceptor today                                                                     | Gap to close                                                      | Why it matters                                                         |
| -------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Foundation           | Visual foundation, key principles, get-started paths, and design tokens                | Tokens, light/dark theming, motion, and a good base layout                         | No formal foundation layer or design-language guide               | Makes the system easier to fork, extend, and keep consistent           |
| Component surface    | 113 components, including enterprise controls and layouts                              | A lean but useful component set around primitives, overlays, charts, and reporting | Missing higher-order app shell and workflow components            | Real products need more than atoms; they need ready-made workflows     |
| Patterns and demos   | 59 patterns and 33 demos                                                               | Gallery pages plus a few composed demos                                            | No dedicated pattern catalog or service-style templates           | Patterns teach when to use a component, not just how to import it      |
| Developer onboarding | Setup, testing, directory layout, component conventions, and docs for new contributors | README, CLAUDE.md, docs index, and component guide                                 | No single Cloudscape-style "start here" path for product builders | Reduces ramp-up time and helps teams ship safely                       |
| Gen-AI               | Dedicated AI guidance, components, and patterns                                        | AI-aware workflow and reporting, but no UI kit or guidance                         | No first-class AI interaction primitives                          | AI surfaces need explicit affordances, safety cues, and feedback loops |
| Scale and quality    | Docs, tests, and examples are tightly coupled                                          | Strong validation, but some checks are still advisory                              | CI should enforce the same quality bar everywhere                 | Prevents regressions as the component surface grows                    |

## Recommended roadmap

### Horizon 1: Foundation and service shell, 0-30 days

Start with the pieces that make Inceptor feel like a framework, not just a
collection of pages.

- Add a Cloudscape-style foundation area in docs for tokens, density, layout,
  accessibility, visual modes, and theming rules.
- Add a first-class service shell demo that combines navigation, tools, split
  panel, drawers, and content layout in one reusable composition.
- Ship a wizard blueprint for multi-step create flows.
- Add a resource details blueprint for read-only and tabbed detail views.
- Make these patterns visible in the gallery and cross-link them from the docs.

### Horizon 2: Enterprise workflows, 30-90 days

This horizon fills the gaps that teams hit when they start building real
product surfaces.

- Add filtering and collection patterns such as property filters, saved filter
  sets, collection preferences, and split view.
- Add inline edit and bulk-action patterns for tables and details pages.
- Add file handling and date/time inputs for forms that need more than plain
  text fields.
- Add an onboarding tutorial system with hotspots and contextual guidance.
- Promote `a11y`, `keyboard-nav`, `visual`, and `format:check` into blocking
  CI checks where possible.

### Horizon 3: AI, design resources, and polish, 90-180 days

This horizon raises the ceiling. It makes Inceptor more complete as a product
platform and more credible as a design system reference.

- Add a small Gen-AI component set: chat bubble, prompt input, support prompts,
  and AI annotation affordances.
- Add design-resource documentation for tokens, icons, and visual modes.
- Add a code editor surface for content-heavy or configuration-heavy workflows.
- Add Figma-oriented guidance so designers and developers can work from the
  same source of truth.
- Expand the docs site into a richer pattern library with examples, guidance,
  and accessibility notes.

## Suggested first slice

If you want one concrete starting point, build these four items first:

1. A documented foundation section for layout, density, theming, and tokens.
2. A reusable service shell with navigation, tools, and split panel support.
3. A resource details pattern with a tabbed variant.
4. A wizard flow for multi-step create forms.

Those four deliver the biggest jump in framework completeness per unit of work.

## Next steps

1. Turn Horizon 1 into individual issues with clear acceptance criteria.
2. Add the new patterns to the gallery so they are visible and testable.
3. Revisit the roadmap after the first wave to decide whether the next gap is
   deeper enterprise workflows or AI-specific UI.
