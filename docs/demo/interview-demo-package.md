# Retention Agent Copilot Interview Demo Package

## 90-second pitch

Retention Agent Copilot is a call-centre decision-support tool for telecom retention agents. It reads a Rogers-style bill PDF, extracts the services, plan prices, discounts, device financing, bundle expiry, and one-time bill drivers, then turns that into a compact live workspace.

The goal is simple: reduce the 5-7 minutes agents spend checking bills, avoid misquoting prices, and help agents explain why the customer bill changed before offering retention options.

This is not an auto-selling bot. It is a verified assistant for human agents: it highlights what changed, shows source-backed price details, supports live transcript prompts, and generates a copy-ready Maestro note at the end of the call.

## Demo story

Use this sample scenario:

> A customer calls because the bill went up. The agent needs to check whether the increase is caused by promo expiry, roaming or one-time charges, device financing, or internet bundle changes.

Walkthrough:

1. Upload a sample Rogers bill PDF.
2. Show the top summary cards:
   - Total due
   - Estimated next bill
   - Bill change explanation
   - Change flags
3. Point to the compact bill table:
   - Service and source page
   - Tier and line label
   - Original plan price
   - Current monthly price before tax
   - This bill total
   - Bill drivers such as roaming, one-time charge, or device payment
   - Contract end
4. Click a wireless line with HUP/device financing.
5. Show the collapsible financing detail:
   - Device model
   - Monthly device payment
   - Device tax payment
   - Current financing balance
   - Save & Return amount and return date
6. Type a short customer statement in Live Agent Assist:
   - "My bill went up and I want something cheaper."
7. Show:
   - Current call stage
   - Suggested response
   - Follow-up question
   - What AI understood
   - Maestro note preview
8. Press Generate Summary and explain that the note can be copied into Maestro.

## What to say in an interview

"I built this from a real workflow pain point. In retention calls, agents often need to open multiple systems and compare bills manually. The risky part is not just speed; it is accuracy. If an agent forgets a device payment, roaming charge, or promo expiry, the customer gets the wrong expectation and the next agent has to clean it up."

"My product focuses on one screen: bill facts on the left, transcript and AI assist on the right. The agent can see original price, current monthly before tax, this-bill total, discounts, expiry dates, contract end, and bill drivers without scrolling through the full bill."

"For safety, it does not quote final offers by itself. It tells the agent what to verify in the official system before quoting."

## Features to highlight

- PDF bill upload and local analysis.
- Wireless and internet / bundle extraction.
- Original plan price versus current monthly price.
- Discount breakdown with expiry date when visible.
- Device financing and Save & Return detail.
- Bill driver explanation for one-time, roaming, or device charges.
- Agent Assist based on live transcript text.
- Stage detection based on call-flow logic.
- Copy-ready Maestro note.
- Validation matrix and automated tests.

## Technical summary

- Frontend: single-page HTML / JavaScript prototype.
- Backend: local Python server for PDF analysis and local audio workflow.
- Parser: Rogers bill text parser with wireless, bundle, discount, financing, and bill-driver extraction.
- AI layer: deterministic Agent Assist logic for safe demo behavior.
- Tests: unit tests, parser tests, PDF analyzer tests, and Playwright end-to-end checks.

## Demo safety framing

This demo uses sample or redacted data. It should not store customer PII. In production, it should connect to official telecom systems through approved APIs, enforce role-based access, log source references, and require agent verification before final quote.

