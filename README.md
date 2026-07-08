# Retention Agent Copilot

Retention Agent Copilot is a **portfolio static demo** for a telecom call-centre retention workflow.

It shows how an agent could quickly review a Rogers-style bill, identify price drivers such as expiring discounts, device financing, roaming, one-time charges, and bundle changes, then generate short talk-track guidance and a copy-ready service note.

## Live Demo

[Open the GitHub Pages demo](https://disonzzz.github.io/retention-agent-copilot/)

## Important Scope

This repository is **not a production product**.

- The public demo uses synthetic sample data only.
- It does not connect to Rogers, Maestro, CRM, billing systems, or offer eligibility systems.
- It does not store real customer bills, recordings, account numbers, payment IDs, addresses, or phone numbers.
- The Agent Assist logic is rule-based for demo purposes, not a live LLM production agent.
- Final prices, discounts, and retention offers must always be verified in the official system.

## What The Demo Shows

- Static single-page agent workspace.
- Synthetic wireless and internet / bundle bill breakdown.
- Original plan price, discount detail, visible expiry date, current before-tax monthly cost, and this-bill total.
- HUP / device financing details behind a click-to-expand line view.
- Bill driver flags for roaming, one-time charges, device payments, and promo expiry.
- Rule-based Agent Assist with call stage, suggested response, follow-up question, and Maestro note preview.
- GitHub Pages deployment and basic public-safety tests.

## Run Locally

```bash
cd app
node scripts/build.mjs
node --test
```

Open the static page from:

```text
app/dist/index.html
```

## Portfolio Materials

- [Project overview](portfolio/project-overview.md)
- [Architecture diagram](portfolio/architecture.md)
- [Demo walkthrough](portfolio/demo-walkthrough.md)
- [Telecom sales one-pager](portfolio/telecom-sales-one-pager.md)
- [Chinese sales guide](portfolio/telecom-sales-one-pager-zh.md)
- [GitHub Pages publishing notes](portfolio/github-pages-portfolio-setup-zh.md)

## Privacy Boundary

Use fake, synthetic, public, or redacted data only. Do not publish raw customer PDFs, screenshots, call recordings, transcripts, account numbers, phone numbers, addresses, or payment IDs.

