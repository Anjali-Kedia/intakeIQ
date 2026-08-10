# IntakeIQ — SwaVid Product Engineering Take-Home
 Submission by: Anjali Kedia

## Which scenario I selected
**Scenario C — The Second-Hand Electronics Market.**

## Problem I chose to address
The issue I address here is inconsistent, poorly evidenced device intake. The business loses money when staff miss faults, overpay, or cannot explain why two similar devices have different prices. I focused on the first 15 minutes of intake because that is when the business accepts financial risk before the seller leaves.

## Primary user
The primary user is a store employee inspecting an incoming used phone, laptop, or tablet. Secondary users are the owner, who reviews exceptions; the technician, who evaluates repair upside; and the customer, who needs a clear condition-based pricing explanation.

## What I chose not to solve and why
I did not build real IMEI/serial verification, marketplace price scraping, staff accounts, billing, real photo uploads, warranty-claim handling, or automated cosmetic scoring. Those are important, but they would add complexity outside the core product wedge: making intake decisions more consistent, explainable, and safe. The prototype uses mock market prices and mock evidence slots, and it does not store real sensitive identifiers.

## Assumptions I made
- Mock pricing is acceptable for demonstrating the decision flow.
- Staff can complete a tap-based checklist during a 15-minute inspection.
- Used-device pricing should be shown as a range, not a single exact number.
- High-risk devices should trigger review, but owner overrides should remain possible and visible.
- Return reasons can be used as feedback to improve future inspections.

## How the solution works from beginning to end
```text
Seller arrives
  ↓
Employee enters device details, seller ask, proof status, and seller claims
  ↓
Employee completes condition checklist and marks evidence captured
  ↓
App calculates grade, risk, confidence, safe buy range, resale target, and rationale
  ↓
Business chooses actual outcome: accept, technician review, reject, or owner override
  ↓
Technician-review items compare repair profit vs sell-as-is profit
  ↓
Returned devices feed insights back into future inspections
```

The product deliberately separates the app’s recommendation from the actual business outcome. That keeps human judgement visible instead of pretending automation is always right.

## How to run or view it
Deployed app: `https://intake-iq-beta.vercel.app`

```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

For a production check:
```bash
npm run check
```

## Working demonstration
This submission includes:
- A deployed Vercel link.
- A runnable Next.js repository.
- A functional local prototype with guided interactions.
- A 3–5 minute screen recording submitted separately.

## What I would do with five additional hours
- Add owner-configurable pricing and risk rules.
- Add printable inspection summaries for physical device tagging.
- Add clearer role-specific views for employee, owner, and technician.
- Add lightweight photo upload with masking/access rules for sensitive identifiers.
- Test checklist wording with a junior employee and an experienced technician.
