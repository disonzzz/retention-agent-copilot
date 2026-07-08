# Retention Agent Copilot

Retention Agent Copilot is a portfolio-ready AI product prototype for a telecom call-centre retention workflow.

The goal is to help an agent read a Rogers-style bill faster, break down charges clearly, avoid missing add-ons, device payments, one-time charges, roaming, or expiring promotions, and generate short live talk-track suggestions during a customer call.

## Portfolio Demo

The public demo uses synthetic sample data only. It is safe to publish as a static GitHub Pages portfolio demo.

Static demo entry:

`app/dist/index.html`

To refresh the static demo:

```bash
cd app
node scripts/build.mjs
```

GitHub Pages can publish the static files from `app/dist`. The static version shows the product workflow and synthetic sample account. The full PDF upload and local audio transcription workflows require the local server.

## Local Full Workflow

Run the local server when you want PDF upload analysis and local audio test routes:

```bash
cd app
python scripts/server.py
```

Then open:

`http://127.0.0.1:8765/`

## Current Features

- Synthetic public demo data for safe portfolio viewing.
- Compact bill breakdown with source page, original price, current before-tax monthly price, this-bill total, bill drivers, and contract end.
- Line-level discount detail with expiry dates when visible.
- HUP / device financing detail behind a click-to-expand line workflow.
- Internet / bundle service display.
- Live Agent Assist with call stage, suggested response, follow-up question, AI-understood bullets, and Maestro note preview.
- Local PDF analysis and local audio transcription workflow for development testing.
- Automated tests and validation matrix.

## Design Docs

- English design: `docs/superpowers/specs/2026-06-16-retention-agent-copilot-design.md`
- Chinese design: `docs/superpowers/specs/2026-06-16-retention-agent-copilot-design-zh.md`
- Interview demo package: `docs/demo/interview-demo-package.md`
- Chinese interview guide: `docs/demo/interview-demo-package-zh.md`
- Telecom sales one-pager: `docs/demo/telecom-sales-one-pager.md`
- Chinese sales guide: `docs/demo/telecom-sales-one-pager-zh.md`

## Important Safety Boundary

This project should use fake, synthetic, public, or redacted data only.

It should not store real customer bills, real customer recordings, account numbers, addresses, payment IDs, or phone numbers.

The tool should not promise offer eligibility or final prices. Final offers must always be verified in the official system.

Do not publish raw customer bill PDFs, extracted private text, call recordings, or screenshots containing real customer identifiers.
