# IntakeIQ Product Brief

## 1. Problem Statement

We chose **Scenario C — The Second-Hand Electronics Market**.

A local business buys and sells used smartphones, laptops, and tablets. It purchases devices from individuals, inspects them, sometimes repairs them, and then resells them through a physical store and online marketplaces.

The owner’s pain is that two devices can look identical but have very different histories and risk levels. One may have a replaced screen, one may have water damage, one may be stolen, and one may work perfectly. Staff inspect devices inconsistently, pricing decisions are hard to justify, and problems are sometimes discovered only after the business has already bought the device.

The business currently manages information across handwritten intake forms, device photographs, marketplace listings, repair invoices, and a shared spreadsheet.

They handle approximately:

- 25–40 incoming devices per day
- 200–250 devices in inventory
- 10–15 customer returns per week
- 4 employees inspecting and pricing devices
- 2 technicians performing repairs

Important constraints:

- Employees have different technical knowledge.
- Inspection should not take more than 15 minutes per device.
- Cosmetic damage is subjective.
- Battery and performance can change after inspection.
- Some faults appear only after extended use.
- Marketplace prices change frequently.
- Customers expect some warranty.
- Wrong purchase decisions can wipe out profit from multiple good sales.
- Device identifiers like serial numbers and IMEIs must be handled carefully.

## 2. Underlying Problem

The obvious symptom is inconsistent pricing, but the deeper problem is:

> The business does not have a standardized, evidence-backed intake process that helps employees make consistent buy, reject, repair-review, and pricing decisions before the seller leaves.

This matters because the intake moment is where the business takes on financial and operational risk. If an employee overpays for a risky phone, misses water damage, ignores a bad battery, or fails to ask for proof of purchase, the business may only discover the issue later. At that point, the seller may be gone and the business absorbs the loss.

So the core problem is not generic inventory tracking. It is **purchase-risk control at intake**.

## 3. What We Are Building

We are building **IntakeIQ**, a guided device intake and pricing assistant.

It is a Next.js, TypeScript, and Tailwind CSS web app that helps a store employee inspect a used device in a structured way and receive a recommendation.

The product helps answer:

1. Should we buy this device?
2. Should we reject it?
3. Should it go to the owner or technician for review?
4. What is a safe buy price range?
5. What resale price should we target?
6. Why did the system recommend this?
7. How can we explain the condition to a customer without exposing sensitive identifiers?

## 4. Primary and Secondary Users

### Primary user

The primary user is a store employee inspecting an incoming second-hand phone, laptop, or tablet. This employee may not be an expert technician, so the app needs to be fast, simple, and repeatable.

### Secondary users

#### Owner

The owner wants to reduce bad purchase decisions, review risky buys, understand margin exposure, and grow the business without personally inspecting every device.

#### Technician

The technician needs to know which devices require repair review before they can be resold.

#### Customer

The customer wants to understand why one device is priced differently from another similar device. The app generates a customer-safe explanation that avoids sensitive identifiers and technical overload.

## 5. Current End-to-End Flow

```text
Seller arrives
   ↓
Employee enters basic device details and asking price
   ↓
Guided checklist: identity, screen, body, battery, water, ports, camera/audio, performance
   ↓
Risk + grade + pricing range are calculated from checklist issues and documentation quality
   ↓
App recommends Buy, Buy below ceiling, Technician/owner review, or Reject
   ↓
Accepted devices become inventory records with internal rationale and customer-safe explanation
```

## 6. Current Product Decisions

### Focus on intake, not full inventory

A generic inventory tool would not solve the owner’s highest-risk problem. The critical moment is before buying the device.

### Use a checklist, not free-form notes

Free-form notes depend heavily on employee quality. A checklist makes the process more consistent across employees.

### Use pricing ranges, not exact prices

Used-device pricing is uncertain. A range is more honest than pretending the system knows the exact correct price.

### Treat “not checked” as risk

If something was not checked, the business should not treat it as safe. Uncertainty has a cost.

### Do not store sensitive identifiers

IMEI and serial numbers are sensitive. The prototype intentionally avoids storing them and tracks only whether identity/lock status was checked.

### Generate internal and customer-facing explanations

The business needs two explanations:

- Internal: useful for staff, owner, and technician decisions.
- Customer-facing: simple, non-technical, and safe.

## 7. What We Are Deliberately Not Solving Yet

We are not solving:

- Real IMEI/serial verification
- Real marketplace price scraping
- Staff accounts and permissions
- Billing/accounting
- Warranty claims lifecycle
- Full repair workflow
- Automated image-based cosmetic scoring
- Multi-store syncing

These are valid problems, but they are downstream of the core intake-risk decision.

---

# 8. Additional Capabilities the App Could Handle

The current app is a strong MVP, but the real product could expand into several adjacent workflows. The important point is to add capabilities that reinforce the intake decision rather than turning the product into a bloated inventory system too early.

## 8.1 Technician Review Queue

### Problem

Some devices should not be immediately accepted or rejected. For example, a phone with a weak battery or charging issue may still be profitable after repair.

### How we can handle it

Add a technician queue for devices marked as:

- major issue in ports/buttons
- battery issue
- screen issue
- water damage uncertainty
- performance issue

Each queue item would show:

- device model
- issue summary
- estimated repair cost
- estimated resale upside
- recommended deadline
- technician decision: repair, reject, accept as-is

### Why it matters

This helps the owner decide whether repair increases profit or only delays the sale.

## 8.2 Repair vs Resell Decision Support

### Problem

Repairing a device may increase its selling price but delay the sale and consume technician time.

### How we can handle it

For devices with repairable issues, calculate:

```text
Expected resale after repair
- repair cost
- delay/risk buffer
= adjusted profit after repair
```

Compare that against:

```text
Profit if sold as-is
```

Then recommend:

- Repair first
- Sell as-is with condition note
- Reject purchase
- Owner review required

### Why it matters

This makes the repair decision commercial, not just technical.

## 8.3 Photo Evidence Slots

### Problem

Condition grading is subjective. Without photos, employees and customers may later disagree about the original condition.

### How we can handle it

Add structured photo slots:

- front screen
- back body
- corners/edges
- charging port
- invoice/proof, if available
- issue-specific photo

Important privacy/product decision: do not require actual IMEI/serial photos in the prototype. If implemented later, sensitive areas should be masked or access-controlled.

### Why it matters

Photo evidence reduces disputes and makes condition grading more defensible.

## 8.4 Price Rule Configuration for Owner

### Problem

The owner may have different margin expectations for phones, laptops, and tablets.

### How we can handle it

Add an owner settings screen with configurable rules:

- target gross margin by category
- maximum allowed buy price as percentage of resale
- extra penalty for missing invoice
- extra penalty for water damage
- auto-review threshold
- auto-reject threshold

### Why it matters

This turns the product from a fixed calculator into a business tool that reflects the owner’s actual risk appetite.

## 8.5 Return Risk Tracking

### Problem

The business gets 10–15 customer returns per week. Returns may reveal inspection blind spots.

### How we can handle it

When a device is returned, link the return reason back to the original intake checklist.

Example:

```text
Return reason: battery drains fast
Original intake: battery marked pass
Pattern: battery checks may be too weak or rushed
```

The dashboard could show:

- most common return reasons
- employees with repeated missed checks
- device models with high return rates
- checklist sections that need improvement

### Why it matters

This creates a feedback loop that improves inspection quality over time.

## 8.6 Warranty Recommendation

### Problem

Customers expect warranty, but the business cannot guarantee every component equally.

### How we can handle it

Based on inspection results, suggest a warranty type:

- Standard limited warranty
- Battery excluded
- Screen excluded
- No warranty / final sale
- Owner approval required

The app could generate warranty-safe language aligned with the condition grade.

### Why it matters

This reduces disputes and aligns customer expectations with device condition.

## 8.7 Marketplace Listing Draft

### Problem

Staff may write inconsistent online listings, leading to customer confusion or returns.

### How we can handle it

Generate a listing draft from the inspection record:

- title
- short description
- condition grade
- included accessories
- known issues
- warranty note
- target selling price

### Why it matters

This saves time and ensures the listing matches the inspection record.

## 8.8 Employee Consistency and Training

### Problem

Employees have different levels of technical knowledge.

### How we can handle it

Add lightweight coaching:

- examples of minor vs major damage
- tooltip photos for grading
- required checks for high-value models
- warning when an employee skips too many checks
- review mode for new employees

### Why it matters

The app should not only record decisions; it should improve inspection quality.

## 8.9 Seller Reliability Notes

### Problem

Sellers sometimes provide incomplete or misleading information.

### How we can handle it

Without storing unnecessary personal information, the app can track seller-risk indicators:

- no invoice
- inconsistent claim
- refuses checks
- urgent sale pressure
- repeated issue after purchase

For privacy reasons, a real implementation should define clear retention rules and access controls.

### Why it matters

Seller context affects purchase risk.

## 8.10 Basic Analytics Dashboard

### Problem

The owner needs to understand patterns, not just individual devices.

### How we can handle it

Add dashboard sections for:

- average buy price vs target range
- risky purchases by employee
- high-return models
- most common inspection issues
- projected margin by category
- devices pending technician review

### Why it matters

This helps the owner scale without personally inspecting every device.

---

# 9. Must-Have Features for a Stronger Version

If we were improving this beyond the current MVP, these would be the must-haves.

## Must-have 1: Cleaner intake form

The current intake form works, but it looks too basic and form-heavy. It should feel like a guided workflow, not a spreadsheet.

### Improvement

Split intake into cards:

1. Device identity
2. Commercial details
3. Seller documentation
4. Seller claim

Use larger touch-friendly controls, better spacing, and clearer helper text.

## Must-have 2: Progress indicator

The user should always know where they are:

```text
Device details → Inspection → Recommendation → Inventory
```

This is especially important for non-technical staff.

## Must-have 3: Better recommendation hierarchy

The recommendation screen should make the main action impossible to miss.

Better hierarchy:

1. Main decision
2. Risk and grade
3. Buy range
4. Why
5. Follow-up
6. Customer explanation

## Must-have 4: Technician review state

Currently, the app flags review but does not manage it. Add a queue state:

```text
Pending technician review → Repair recommended → Accepted after repair / Rejected
```

## Must-have 5: Evidence capture

Even if photo upload is mocked, the UI should show where evidence belongs. This makes the product feel more real.

## Must-have 6: Configurable pricing assumptions

The current pricing logic is hardcoded. A stronger product would let the owner adjust margin and risk rules.

## Must-have 7: Export or print summary

The shop may still rely on physical tags or paper folders. Add a printable inspection summary.

## Must-have 8: Empty states and sample scenario prompts

The app should help reviewers and first-time users understand what to do next.

Example:

> Try inspecting an iPhone 13 with no invoice and low battery health.

---

# 10. UI Improvement Plan

The current UI has a good product structure, but the intake form can be improved significantly.

## 10.1 Problems with the current intake form

The current intake form feels too plain because:

- all fields have similar visual weight
- it does not guide the user step by step
- there is not enough hierarchy between device details and seller risk
- the seller claim text area feels like an afterthought
- there is no immediate price context
- the form does not feel optimized for fast shop-floor use

## 10.2 Better intake form design

### Proposed layout

```text
New Device Intake

[Device card]
Device type     Model
Storage         Estimated market anchor

[Commercial card]
Seller asking price
Safe buy range preview: calculated after inspection

[Documentation card]
Invoice seen / Partial proof / No invoice
Risk helper text changes based on selection

[Seller claim card]
What does the seller say is wrong?
Quick chips: Battery issue, Screen replaced, No issues claimed, Urgent sale

[Continue to inspection]
```

## 10.3 Add quick chips

Instead of only a free text field for seller claim, add selectable chips:

- No issues claimed
- Battery drains fast
- Screen replaced
- Charging issue
- Water exposure denied
- Urgent sale
- No box/accessories

This makes the form faster and produces better structured data.

## 10.4 Add risk-aware helper text

When the employee selects “No invoice,” show:

> Missing proof increases ownership and return risk. The recommendation will require a lower buy ceiling or owner review.

When they select “Invoice seen,” show:

> Proof seen. Do not store sensitive document details in this prototype.

## 10.5 Improve mobile usability

The transport/lab scenarios have explicit mobile constraints, but this shop-floor app also benefits from mobile-first design.

Changes:

- larger inputs
- card-based sections
- sticky bottom action button
- fewer fields visible at once
- stronger spacing
- tap-friendly checklist controls

## 10.6 Improve visual trust

The app should feel like a decision assistant, not a random calculator.

Add:

- clearer grade colors
- risk badges
- “why this matters” helper copy
- a small market anchor preview
- confidence indicator
- review-required warning states

## 10.7 Better dashboard UI

The dashboard can become more useful by separating:

- Today’s intake summary
- Devices needing owner attention
- Technician queue
- Margin risk
- Recently accepted inventory

## 10.8 Better inventory UI

Inventory cards should show:

- model and configuration
- grade badge
- risk badge
- buy range vs actual buy price
- target resale price
- review status
- customer explanation

Add filters:

- all
- high risk
- technician review
- ready to sell
- rejected

---

# 11. Recommended Next Product Iteration

The best next step is not to add every feature. The strongest next iteration should be:

## Iteration 1: Make the intake workflow feel premium and realistic

Scope:

1. Redesign the intake form into cards.
2. Add seller-claim chips.
3. Add documentation helper text.
4. Add a progress header.
5. Add a sticky primary action.
6. Add technician review queue as a lightweight status.

Why this is the right next step:

- It improves the weakest current UI area.
- It makes the product feel more realistic for shop-floor use.
- It strengthens the product story without over-expanding scope.
- It directly supports the 15-minute inspection constraint.

## Iteration 2: Add evidence and repair economics

Scope:

1. Mock photo evidence slots.
2. Repair estimate field.
3. Repair vs sell-as-is recommendation.
4. Technician review state.

Why this is valuable:

- It addresses subjective cosmetic damage.
- It helps decide whether repair is worth the delay.
- It makes the app more operationally complete.

## Iteration 3: Add owner controls and analytics

Scope:

1. Configurable margin rules.
2. Return reason tracking.
3. Employee consistency analytics.
4. Exportable inspection summary.

Why this is valuable:

- It helps the owner scale the business.
- It creates a feedback loop from returns to better inspections.
- It turns the product from a prototype into an operating system for used-device intake.

---

# 12. Interview Pitch

A concise way to explain the product:

> I chose Scenario C and focused on the intake decision because that is where the business accepts financial risk. A full inventory system would be too broad and would not directly fix inconsistent purchase decisions. IntakeIQ standardizes the first 15 minutes of inspection with a guided checklist, converts issues into risk and pricing guidance, and creates both an internal rationale and customer-safe explanation. The goal is not to replace employee judgment, but to make it repeatable, reviewable, and easier for the owner to scale.
