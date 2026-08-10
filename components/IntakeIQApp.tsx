"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type CheckStatus,
  type DeviceType,
  type DocumentationStatus,
  type EnrichedRecord,
  type EvidenceState,
  type IntakeRecord,
  type RecordStatus,
  type ReturnReason,
  checkLabels,
  calculateTechnicianEconomics,
  defaultChecks,
  defaultEvidence,
  defaultRecords,
  enrichRecord,
  evidenceItems,
  formatCurrency,
  inspectionItems,
  pricingCatalog,
  returnReasonLabels
} from "@/lib/intake";

type View = "dashboard" | "intake" | "inspection" | "recommendation" | "inventory";

type DraftInput = {
  type: DeviceType;
  model: string;
  storage: string;
  askingPrice: string;
  documentation: DocumentationStatus;
  sellerClaim: string;
};

const initialDraft: DraftInput = {
  type: "phone",
  model: pricingCatalog.phone[0].model,
  storage: "128 GB",
  askingPrice: "21000",
  documentation: "none",
  sellerClaim: "Works fine. Battery drains slightly fast."
};

const views: { id: View; label: string; short: string }[] = [
  { id: "dashboard", label: "Dashboard", short: "Overview" },
  { id: "intake", label: "New intake", short: "Details" },
  { id: "inspection", label: "Inspection", short: "Checks + evidence" },
  { id: "recommendation", label: "Recommendation", short: "Decision" },
  { id: "inventory", label: "Inventory", short: "Workflow" }
];

const sellerClaimChips = [
  "No issues claimed",
  "Battery drains fast",
  "Screen replaced",
  "Charging issue",
  "No box/accessories",
  "Urgent sale",
  "Minor dents",
  "Water exposure denied"
];

const documentationHelp: Record<DocumentationStatus, { title: string; copy: string; tone: string }> = {
  invoice: {
    title: "Lower ownership risk",
    copy: "Proof was seen. Do not store sensitive document or identity numbers in this prototype.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800"
  },
  partial: {
    title: "Some uncertainty remains",
    copy: "Partial proof reduces confidence. The recommendation keeps a small risk buffer.",
    tone: "border-amber-200 bg-amber-50 text-amber-900"
  },
  none: {
    title: "Owner approval likely",
    copy: "Missing proof increases ownership and return risk. The buy ceiling will be more conservative.",
    tone: "border-red-200 bg-red-50 text-red-800"
  }
};

const statusCopy: Record<RecordStatus, { label: string; tone: string }> = {
  ready_to_sell: { label: "Ready to sell", tone: "low" },
  technician_review: { label: "Technician review", tone: "review" },
  rejected: { label: "Rejected", tone: "reject" },
  owner_override: { label: "Owner override", tone: "medium" },
  returned: { label: "Returned", tone: "high" }
};


export default function IntakeIQApp() {
  const [view, setView] = useState<View>("dashboard");
  const [records, setRecords] = useState<EnrichedRecord[]>(() => defaultRecords.map(enrichRecord));
  const [draft, setDraft] = useState<DraftInput>(initialDraft);
  const [currentIntake, setCurrentIntake] = useState<IntakeRecord | null>(null);
  const [checks, setChecks] = useState<Record<string, CheckStatus>>(defaultChecks);
  const [evidence, setEvidence] = useState<EvidenceState>(defaultEvidence);
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  useEffect(() => {
    const stored = window.localStorage.getItem("intakeiq-records-next");
    const hasSeenGuide = window.localStorage.getItem("intakeiq-guide-seen") === "true";
    setShowGuide(!hasSeenGuide);

    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as IntakeRecord[];
      setRecords(parsed.map(enrichRecord));
    } catch {
      setRecords(defaultRecords.map(enrichRecord));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("intakeiq-records-next", JSON.stringify(records));
  }, [records]);

  const metrics = useMemo(() => {
    const highRisk = records.filter((record) => record.recommendation.risk === "High").length;
    const reviewCount = records.filter((record) => record.status === "technician_review").length;
    const returned = records.filter((record) => record.status === "returned").length;
    const margin = records
      .filter((record) => record.status !== "rejected")
      .reduce((sum, record) => sum + record.recommendation.projectedMargin, 0);

    return [
      { label: "Devices assessed", value: records.length.toString(), helper: "Saved intake decisions" },
      { label: "High-risk", value: highRisk.toString(), helper: "Needs owner attention" },
      { label: "Tech queue", value: reviewCount.toString(), helper: "Repair economics pending" },
      { label: "Returns", value: returned.toString(), helper: "Feedback into checklist" },
      { label: "Projected margin", value: formatCurrency(margin), helper: "Excludes rejected devices" }
    ];
  }, [records]);

  function navigate(nextView: View) {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openGuide() {
    setGuideStep(0);
    setShowGuide(true);
  }

  function closeGuide() {
    window.localStorage.setItem("intakeiq-guide-seen", "true");
    setShowGuide(false);
  }

  function resetDemo() {
    setRecords(defaultRecords.map(enrichRecord));
    setCurrentIntake(null);
    setChecks(defaultChecks);
    setEvidence(defaultEvidence);
    setDraft(initialDraft);
    navigate("dashboard");
  }

  function updateDraft<K extends keyof DraftInput>(key: K, value: DraftInput[K]) {
    setDraft((previous) => {
      const next = { ...previous, [key]: value };
      if (key === "type") next.model = pricingCatalog[value as DeviceType][0].model;
      return next;
    });
  }

  function toggleSellerChip(chip: string) {
    setDraft((previous) => {
      const parts = previous.sellerClaim
        .split(". ")
        .map((part) => part.replace(/\.$/, ""))
        .filter(Boolean);
      const exists = parts.includes(chip);
      const nextParts = exists ? parts.filter((part) => part !== chip) : [...parts, chip];
      return { ...previous, sellerClaim: nextParts.join(". ") + (nextParts.length ? "." : "") };
    });
  }

  function startInspection() {
    setCurrentIntake({ id: "draft", ...draft, askingPrice: Number(draft.askingPrice || 0), checks: defaultChecks, evidence: defaultEvidence });
    setChecks(defaultChecks);
    setEvidence(defaultEvidence);
    navigate("inspection");
  }

  function saveDecision(status: RecordStatus) {
    if (!currentIntake) return;

    const saved = enrichRecord({
      ...currentIntake,
      checks,
      evidence,
      status,
      id: `intake-${Date.now()}`,
      decisionNote: status === "owner_override" ? "Owner accepted despite review/reject recommendation." : undefined,
      technicianReview:
        status === "technician_review"
          ? {
              repairCost: 2500,
              expectedResaleAfterRepair: Math.round((currentIntake.askingPrice || 0) * 1.25),
              decision: "pending",
              note: "Review issue, estimate repair cost, then decide repair vs sell as-is."
            }
          : undefined
    });

    setRecords((previous) => [saved, ...previous]);
    setCurrentIntake(null);
    setChecks(defaultChecks);
    setEvidence(defaultEvidence);
    navigate("inventory");
  }

  function updateTechnicianReview(id: string, patch: Partial<NonNullable<EnrichedRecord["technicianReview"]>>) {
    setRecords((previous) =>
      previous.map((record) =>
        record.id === id
          ? enrichRecord({
              ...record,
              technicianReview: {
                repairCost: record.technicianReview?.repairCost ?? 0,
                expectedResaleAfterRepair: record.technicianReview?.expectedResaleAfterRepair ?? Math.round(record.recommendation.targetResale),
                decision: record.technicianReview?.decision ?? "pending",
                note: record.technicianReview?.note ?? "",
                ...patch
              }
            })
          : record
      )
    );
  }

  function resolveTechnicianReview(id: string, status: RecordStatus) {
    setRecords((previous) => previous.map((record) => (record.id === id ? enrichRecord({ ...record, status }) : record)));
  }

  function markReturned(id: string, reason: ReturnReason, note: string) {
    setRecords((previous) =>
      previous.map((record) =>
        record.id === id
          ? enrichRecord({
              ...record,
              status: "returned",
              returnInfo: { reason, note }
            })
          : record
      )
    );
  }

  const riskyRecords = records.filter(
    (record) => record.recommendation.risk !== "Low" || record.status === "owner_override" || record.status === "returned"
  );
  const technicianQueue = records.filter((record) => record.status === "technician_review");
  const returnInsights = buildReturnInsights(records);

  return (
    <main className="min-h-screen px-4 py-5 text-ink md:px-8 xl:px-10">
      <header className="mx-auto mb-6 max-w-7xl overflow-hidden rounded-[2rem] border border-white/70 bg-[#102a22] p-6 text-white shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber">SwaVid take-home · Scenario C</p>
            <h1 className="mt-2 text-5xl font-black tracking-[-0.075em] md:text-7xl">IntakeIQ</h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-white/72">
              A guided intake operating system: decide, document, repair, sell, and learn from returns.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            <button onClick={() => navigate("intake")} className="rounded-full bg-white px-5 py-3 font-black text-brand shadow-lg shadow-black/10">
              Start intake
            </button>
            <button onClick={resetDemo} className="rounded-full border border-white/20 px-5 py-3 font-black text-white/90 hover:bg-white/10">
              Reset demo
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[20rem_1fr]">
        <aside className="h-fit rounded-[1.75rem] border border-line/80 bg-paper/90 p-5 shadow-soft backdrop-blur lg:sticky lg:top-5">
          <div className="rounded-3xl bg-[#fff4dc] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber">Product wedge</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">15-minute intake control</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Standardise the buy, reject, repair, and return-feedback loop before mistakes scale.
            </p>
          </div>
          <FlowNav active={view} onNavigate={navigate} />
          <div className="mt-5 rounded-3xl border border-line bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Founder-level loop</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Intake → evidence → decision → repair economics → inventory → return learning.
            </p>
          </div>
        </aside>

        <section>
          {view === "dashboard" && (
            <Dashboard
              metrics={metrics}
              riskyRecords={riskyRecords}
              technicianQueue={technicianQueue}
              returnInsights={returnInsights}
              onStart={() => navigate("intake")}
              onGoInventory={() => navigate("inventory")}
            />
          )}
          {view === "intake" && <IntakeForm draft={draft} onChange={updateDraft} onSubmit={startInspection} onToggleChip={toggleSellerChip} />}
          {view === "inspection" && (
            <Inspection
              currentIntake={currentIntake}
              checks={checks}
              evidence={evidence}
              setChecks={setChecks}
              setEvidence={setEvidence}
              onBack={() => navigate("intake")}
              onScore={() => navigate("recommendation")}
            />
          )}
          {view === "recommendation" && (
            <RecommendationView currentIntake={currentIntake} checks={checks} evidence={evidence} onEdit={() => navigate("inspection")} onSave={saveDecision} />
          )}
          {view === "inventory" && (
            <Inventory
              records={records}
              onAdd={() => navigate("intake")}
              onTechnicianChange={updateTechnicianReview}
              onResolveTechnician={resolveTechnicianReview}
              onReturn={markReturned}
            />
          )}
        </section>
      </div>

      <button
        onClick={openGuide}
        className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-brand text-2xl font-black text-white shadow-2xl shadow-brand/30 transition hover:-translate-y-1"
        aria-label="Open help walkthrough"
        title="Help"
      >
        ?
      </button>

      {showGuide && (
        <WalkthroughModal
          step={guideStep}
          setStep={setGuideStep}
          onClose={closeGuide}
        />
      )}
    </main>
  );
}

function FlowNav({ active, onNavigate }: { active: View; onNavigate: (view: View) => void }) {
  return (
    <nav className="mt-5 grid gap-2" aria-label="Intake steps">
      {views.map((item, index) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`group flex items-center gap-3 rounded-2xl p-3 text-left transition ${
            active === item.id ? "bg-brand text-white shadow-lg shadow-brand/15" : "text-muted hover:bg-white"
          }`}
        >
          <span className={`grid size-9 place-items-center rounded-full text-sm font-black ${active === item.id ? "bg-white text-brand" : "bg-[#fff4dc] text-amber group-hover:bg-brand group-hover:text-white"}`}>
            {index + 1}
          </span>
          <span>
            <strong className="block text-sm">{item.label}</strong>
            <small className={active === item.id ? "text-white/70" : "text-muted"}>{item.short}</small>
          </span>
        </button>
      ))}
    </nav>
  );
}

const walkthroughPages = [
  {
    eyebrow: "Welcome",
    title: "IntakeIQ guides the used-device decision loop",
    role: "Everyone",
    body: "This prototype is not a generic inventory app. It helps the shop decide whether to buy a used device, at what price, what evidence supports the grade, and what to do after intake.",
    steps: ["Start with a seller/device intake.", "Inspect condition and evidence.", "Review the recommendation.", "Choose the real business outcome."]
  },
  {
    eyebrow: "Employee flow",
    title: "When a seller arrives",
    role: "Store employee",
    body: "Use New intake to capture the commercial context before touching the checklist.",
    steps: ["Select device type, model and storage.", "Enter seller asking price.", "Mark invoice/proof status.", "Use seller-claim chips for common claims like battery issue or urgent sale."]
  },
  {
    eyebrow: "Inspection",
    title: "Condition checks plus evidence",
    role: "Store employee",
    body: "The checklist keeps inspection consistent. Evidence slots make subjective grading easier to explain later.",
    steps: ["Mark each check as Pass, Minor, Major or Not checked.", "Use Not checked when uncertain; confidence will drop.", "Mark evidence captured for screen, body, damage, port and proof.", "Then calculate the recommendation."]
  },
  {
    eyebrow: "Decision",
    title: "Recommendation is advice, outcome is accountability",
    role: "Employee + owner",
    body: "The system recommends a buy range, risk and confidence. The business still chooses the actual outcome.",
    steps: ["Read risk, confidence and rationale.", "Accept as-is if clean.", "Send to technician if repair economics matter.", "Reject or owner-override when risk is high."]
  },
  {
    eyebrow: "After intake",
    title: "Technician review and return learning",
    role: "Owner + technician",
    body: "Inventory is where decisions continue after intake. This is the operational loop that helps the business improve.",
    steps: ["Edit repair cost and expected resale after repair.", "Compare repair profit vs sell-as-is profit.", "Mark returned devices with a reason.", "Use dashboard insights to improve future inspections."]
  }
];

function WalkthroughModal({ step, setStep, onClose }: { step: number; setStep: (step: number) => void; onClose: () => void }) {
  const page = walkthroughPages[step];
  const isLast = step === walkthroughPages.length - 1;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#102a22]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="IntakeIQ walkthrough">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-paper shadow-2xl">
        <div className="bg-[#102a22] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber">{page.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{page.title}</h2>
            </div>
            <button onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 font-black text-white hover:bg-white/20" aria-label="Skip walkthrough">
              ×
            </button>
          </div>
          <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-black text-brand">Role: {page.role}</span>
        </div>
        <div className="p-6">
          <p className="leading-7 text-muted">{page.body}</p>
          <ol className="mt-5 grid gap-3">
            {page.steps.map((item, index) => (
              <li key={item} className="flex gap-3 rounded-3xl border border-line bg-white p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-black text-white">{index + 1}</span>
                <span className="leading-7 text-muted">{item}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex gap-1.5">
              {walkthroughPages.map((item, index) => (
                <button
                  key={item.title}
                  onClick={() => setStep(index)}
                  className={`size-2.5 rounded-full ${index === step ? "bg-brand" : "bg-line"}`}
                  aria-label={`Go to walkthrough step ${index + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded-full bg-[#fff4dc] px-5 py-3 font-black text-brand">
                Skip
              </button>
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="rounded-full bg-white px-5 py-3 font-black text-brand">
                  Back
                </button>
              )}
              <button onClick={() => (isLast ? onClose() : setStep(step + 1))} className="rounded-full bg-brand px-5 py-3 font-black text-white shadow-lg shadow-brand/15">
                {isLast ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  metrics,
  riskyRecords,
  technicianQueue,
  returnInsights,
  onStart,
  onGoInventory
}: {
  metrics: { label: string; value: string; helper: string }[];
  riskyRecords: EnrichedRecord[];
  technicianQueue: EnrichedRecord[];
  returnInsights: string[];
  onStart: () => void;
  onGoInventory: () => void;
}) {
  return (
    <div>
      <SectionHeading eyebrow="Owner command centre" title="Today’s intake health" action={<PrimaryButton onClick={onStart}>Start new intake</PrimaryButton>} />
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric, index) => (
          <article key={metric.label} className={`rounded-3xl border border-line bg-paper p-5 shadow-sm ${index === 4 ? "md:col-span-2 xl:col-span-1" : ""}`}>
            <span className="text-sm font-bold text-muted">{metric.label}</span>
            <strong className="mt-2 block text-3xl font-black tracking-[-0.05em]">{metric.value}</strong>
            <p className="mt-1 text-xs font-semibold text-muted">{metric.helper}</p>
          </article>
        ))}
      </div>
      
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Owner attention">
          <div className="grid gap-3">
            {riskyRecords.length ? riskyRecords.slice(0, 4).map((record) => <CompactCard key={record.id} record={record} />) : <EmptyState />}
          </div>
        </Panel>
        <Panel title="Technician economics queue">
          <div className="grid gap-3">
            {technicianQueue.length ? technicianQueue.map((record) => <ReviewQueueCard key={record.id} record={record} />) : <EmptyState title="No technician queue" description="Devices sent to technician review will appear here with repair-vs-resale economics." />}
          </div>
          {technicianQueue.length > 0 && <SecondaryButton onClick={onGoInventory} className="mt-4">Open workflow</SecondaryButton>}
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel title="Return feedback loop">
          {returnInsights.length ? (
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
              {returnInsights.map((insight) => <li key={insight}>{insight}</li>)}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted">Returned devices will generate inspection insights here.</p>
          )}
        </Panel>
        <Panel title="Evidence discipline">
          <p className="text-sm leading-6 text-muted">Evidence slots make subjective condition grading defendable without requiring sensitive IMEI/serial storage.</p>
        </Panel>
        <Panel title="Human override, visible">
          <p className="text-sm leading-6 text-muted">The app records when the owner overrides the system, so automation supports judgement instead of hiding it.</p>
        </Panel>
      </div>
    </div>
  );
}

function IntakeForm({
  draft,
  onChange,
  onSubmit,
  onToggleChip
}: {
  draft: DraftInput;
  onChange: <K extends keyof DraftInput>(key: K, value: DraftInput[K]) => void;
  onSubmit: () => void;
  onToggleChip: (chip: string) => void;
}) {
  const selectedCatalogItem = pricingCatalog[draft.type].find((item) => item.model === draft.model) ?? pricingCatalog[draft.type][0];
  const docHelp = documentationHelp[draft.documentation];
  const selectedChips = sellerClaimChips.filter((chip) => draft.sellerClaim.includes(chip));
  const estimatedBuyCeiling = selectedCatalogItem.baseResale * 0.72;
  const askingPrice = Number(draft.askingPrice || 0);

  return (
    <div>
      <SectionHeading eyebrow="Employee workflow" title="New device intake" />
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="grid gap-5">
        <div className="rounded-[1.75rem] border border-line bg-paper/90 p-5 shadow-soft md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber">Step 1</p>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em]">Device identity</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Capture enough detail to price the device, without storing sensitive serial or IMEI values.</p>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow-sm lg:min-w-64">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-muted">Market anchor</span>
              <strong className="mt-1 block text-3xl font-black tracking-[-0.05em]">{formatCurrency(selectedCatalogItem.baseResale)}</strong>
              <p className="mt-1 text-xs font-semibold text-muted">Mock resale benchmark</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="Device type">
              <select value={draft.type} onChange={(event) => onChange("type", event.target.value as DeviceType)} className="premium-input">
                <option value="phone">Phone</option><option value="laptop">Laptop</option><option value="tablet">Tablet</option>
              </select>
            </Field>
            <Field label="Model">
              <select value={draft.model} onChange={(event) => onChange("model", event.target.value)} className="premium-input">
                {pricingCatalog[draft.type].map((item) => <option key={item.model}>{item.model}</option>)}
              </select>
            </Field>
            <Field label="Storage / configuration">
              <select value={draft.storage} onChange={(event) => onChange("storage", event.target.value)} className="premium-input">
                <option>64 GB</option><option>128 GB</option><option>256 GB</option><option>512 GB</option><option>8 GB RAM / 256 GB SSD</option><option>16 GB RAM / 512 GB SSD</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] border border-line bg-paper/90 p-5 shadow-soft md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber">Step 2</p>
            <h3 className="mt-1 text-2xl font-black tracking-[-0.04em]">Commercial risk</h3>
            <div className="mt-5 grid gap-4">
              <Field label="Seller asking price (₹)">
                <input value={draft.askingPrice} onChange={(event) => onChange("askingPrice", event.target.value)} className="premium-input text-2xl font-black tracking-[-0.04em]" type="number" min={0} step={500} placeholder="Enter seller ask" />
              </Field>
              <div className="rounded-3xl border border-line bg-white p-4">
                <div className="flex items-center justify-between gap-4"><span className="text-sm font-bold text-muted">Pre-inspection buy ceiling</span><strong>{formatCurrency(estimatedBuyCeiling)}</strong></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1e7d7]"><div className={`h-full rounded-full ${askingPrice > estimatedBuyCeiling ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (askingPrice / Math.max(1, estimatedBuyCeiling)) * 100)}%` }} /></div>
                <p className="mt-3 text-xs font-semibold text-muted">Final range adjusts after condition and evidence checks.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-line bg-paper/90 p-5 shadow-soft md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber">Step 3</p>
            <h3 className="mt-1 text-2xl font-black tracking-[-0.04em]">Seller documentation</h3>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {(["invoice", "partial", "none"] as DocumentationStatus[]).map((status) => (
                  <button key={status} type="button" onClick={() => onChange("documentation", status)} className={`rounded-3xl border p-4 text-left transition ${draft.documentation === status ? "border-brand bg-brand text-white shadow-lg shadow-brand/15" : "border-line bg-white text-ink hover:border-brand/40"}`}>
                    <strong className="block">{status === "none" ? "No invoice" : status === "partial" ? "Partial proof" : "Invoice seen"}</strong>
                    <small className={draft.documentation === status ? "text-white/70" : "text-muted"}>{status === "invoice" ? "Best case" : status === "partial" ? "Some risk" : "Highest risk"}</small>
                  </button>
                ))}
              </div>
              <div className={`rounded-3xl border p-4 ${docHelp.tone}`}><strong>{docHelp.title}</strong><p className="mt-1 text-sm leading-6">{docHelp.copy}</p></div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-line bg-paper/90 p-5 shadow-soft md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-amber">Step 4</p><h3 className="mt-1 text-2xl font-black tracking-[-0.04em]">Seller claim</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Chips make common claims searchable. Free text keeps nuance.</p></div>
            <StatusPill tone={selectedChips.length ? "medium" : "low"}>{selectedChips.length || "No"} chips selected</StatusPill>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {sellerClaimChips.map((chip) => {
              const selected = draft.sellerClaim.includes(chip);
              return <button key={chip} type="button" onClick={() => onToggleChip(chip)} className={`rounded-full border px-4 py-2 text-sm font-black transition ${selected ? "border-brand bg-brand text-white" : "border-line bg-white text-muted hover:border-brand/40 hover:text-brand"}`}>{chip}</button>;
            })}
          </div>
          <textarea value={draft.sellerClaim} onChange={(event) => onChange("sellerClaim", event.target.value)} rows={4} className="premium-input mt-4" placeholder="What did the seller claim about condition, repairs, battery, or urgency?" />
        </div>

        <div className="sticky bottom-4 z-10 rounded-[1.5rem] border border-line bg-[#102a22]/95 p-4 shadow-soft backdrop-blur md:flex md:items-center md:justify-between">
          <div><strong className="text-white">Ready for guided inspection</strong><p className="mt-1 text-sm text-white/65">Next: checks plus evidence capture for defensible grading.</p></div>
          <PrimaryButton type="submit" className="mt-4 !bg-white !text-brand md:mt-0">Continue to inspection</PrimaryButton>
        </div>
      </form>
    </div>
  );
}

function Inspection({
  currentIntake,
  checks,
  evidence,
  setChecks,
  setEvidence,
  onBack,
  onScore
}: {
  currentIntake: IntakeRecord | null;
  checks: Record<string, CheckStatus>;
  evidence: EvidenceState;
  setChecks: React.Dispatch<React.SetStateAction<Record<string, CheckStatus>>>;
  setEvidence: React.Dispatch<React.SetStateAction<EvidenceState>>;
  onBack: () => void;
  onScore: () => void;
}) {
  const completed = inspectionItems.filter((item) => checks[item.id] && checks[item.id] !== "unchecked").length;
  const evidenceCount = Object.values(evidence).filter(Boolean).length;

  return (
    <div>
      <SectionHeading eyebrow="15-minute checklist" title="Guided inspection" action={<span className="rounded-full bg-[#fff4dc] px-3 py-2 text-xs font-black text-brand">{currentIntake ? `${currentIntake.model} · ${currentIntake.storage}` : "No intake started"}</span>} />
      <div className="rounded-[1.75rem] border border-line bg-paper/90 p-5 shadow-soft md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl leading-7 text-muted">Checks capture condition. Evidence slots capture why staff believed that condition, without storing sensitive device identifiers.</p>
          <div className="grid grid-cols-2 gap-3 text-center"><StatBox value={`${completed}/${inspectionItems.length}`} label="checks" /><StatBox value={`${evidenceCount}/${evidenceItems.length}`} label="evidence" /></div>
        </div>
        <div className="mt-5 grid gap-4">
          {inspectionItems.map((item, index) => (
            <div key={item.id} className="grid gap-4 rounded-3xl border border-line bg-white p-4 shadow-sm xl:grid-cols-[1.1fr_2fr] xl:items-center">
              <div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff4dc] text-sm font-black text-amber">{index + 1}</span><div><strong>{item.title}</strong><p className="mt-1 text-sm leading-6 text-muted">{item.help}</p></div></div>
              <div className="grid gap-2 sm:grid-cols-4">
                {(Object.keys(checkLabels) as CheckStatus[]).map((status) => (
                  <label key={status} className="cursor-pointer"><input type="radio" name={item.id} checked={checks[item.id] === status} onChange={() => setChecks((previous) => ({ ...previous, [item.id]: status }))} className="peer sr-only" /><span className="block rounded-full border border-line bg-[#fbf7ef] px-3 py-2 text-center text-xs font-black text-muted peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white">{checkLabels[status]}</span></label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-line bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber">Evidence for condition grade</p>
              <h3 className="mt-1 text-xl font-black tracking-[-0.03em]">Mark what proof was captured</h3>
              <p className="mt-1 text-sm leading-6 text-muted">These are mock capture slots. They show what evidence the shop should attach before resale.</p>
            </div>
            <div className="rounded-2xl bg-[#fff4dc] px-4 py-3 text-sm font-black text-brand">
              {evidenceCount}/{evidenceItems.length} evidence items marked
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {evidenceItems.map((item) => (
              <button key={item.id} type="button" onClick={() => setEvidence((previous) => ({ ...previous, [item.id]: !previous[item.id] }))} className={`rounded-3xl border p-4 text-left transition ${evidence[item.id] ? "border-brand bg-brand text-white" : "border-line bg-[#fbf7ef] text-ink hover:border-brand/40"}`}>
                <strong className="block text-sm">{item.title}</strong><small className={evidence[item.id] ? "text-white/70" : "text-muted"}>{item.help}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col justify-end gap-3 sm:flex-row"><SecondaryButton onClick={onBack}>Back to details</SecondaryButton><PrimaryButton onClick={onScore} disabled={!currentIntake}>Calculate recommendation</PrimaryButton></div>
      </div>
    </div>
  );
}

function RecommendationView({ currentIntake, checks, evidence, onEdit, onSave }: { currentIntake: IntakeRecord | null; checks: Record<string, CheckStatus>; evidence: EvidenceState; onEdit: () => void; onSave: (status: RecordStatus) => void; }) {
  const record = currentIntake ? enrichRecord({ ...currentIntake, checks, evidence }) : null;
  const rec = record?.recommendation;
  if (!record || !rec) return <EmptyState title="No recommendation yet" description="Complete the intake and inspection first." />;

  return (
    <div>
      <SectionHeading eyebrow="Decision support" title="Recommendation" action={<SecondaryButton onClick={onEdit}>Edit checklist</SecondaryButton>} />
      <div className="grid gap-5 xl:grid-cols-2">
        <article className="overflow-hidden rounded-[1.75rem] bg-[#102a22] text-white shadow-soft xl:col-span-2">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-amber">System recommendation</p><h2 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-5xl">{rec.decision}</h2><p className="mt-3 text-white/70">{record.model} · Grade {rec.grade} · {rec.risk} risk · {rec.confidence}% confidence</p></div>
            <div className="rounded-3xl bg-white/10 p-5"><span className="text-sm font-bold text-white/60">Safe buy range</span><strong className="mt-2 block text-3xl font-black tracking-[-0.05em]">{formatCurrency(rec.buyLow)}–{formatCurrency(rec.buyHigh)}</strong><p className="mt-2 text-sm text-white/60">Use this as the negotiation guardrail.</p></div>
          </div>
          <div className="grid border-t border-white/10 md:grid-cols-4"><HeroStat label="Adjusted resale" value={formatCurrency(rec.targetResale)} /><HeroStat label="Seller ask" value={formatCurrency(record.askingPrice)} /><HeroStat label="Projected margin" value={formatCurrency(rec.projectedMargin)} /><HeroStat label="Evidence" value={`${Object.values(evidence).filter(Boolean).length}/${evidenceItems.length}`} /></div>
        </article>

        <Panel title="Choose actual outcome">
          <p className="mb-4 text-sm leading-6 text-muted">The product separates system advice from business action. Overrides are allowed, but recorded.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <OutcomeButton title="Accept as-is" copy="Ready for inventory and resale." onClick={() => onSave("ready_to_sell")} />
            <OutcomeButton title="Send to technician" copy="Estimate repair economics first." onClick={() => onSave("technician_review")} />
            <OutcomeButton title="Reject device" copy="Do not buy; risk is too high." onClick={() => onSave("rejected")} danger />
            <OutcomeButton title="Owner override" copy="Accept despite system caution." onClick={() => onSave("owner_override")} warning />
          </div>
        </Panel>
        <Panel title="Internal rationale"><ul className="list-disc space-y-2 pl-5 leading-7 text-muted">{rec.rationale.length ? rec.rationale.map((item) => <li key={item}>{item}</li>) : <li>No material issues found in intake.</li>}</ul></Panel>
        <Panel title="Follow-up path"><ul className="list-disc space-y-2 pl-5 leading-7 text-muted">{rec.followUps.length ? rec.followUps.map((item) => <li key={item}>{item}</li>) : <li>No technician review required before resale.</li>}</ul></Panel>
        <Panel title="Customer-safe explanation"><p className="leading-7 text-muted">{rec.customerExplanation}</p></Panel>
      </div>
    </div>
  );
}

function Inventory({ records, onAdd, onTechnicianChange, onResolveTechnician, onReturn }: { records: EnrichedRecord[]; onAdd: () => void; onTechnicianChange: (id: string, patch: Partial<NonNullable<EnrichedRecord["technicianReview"]>>) => void; onResolveTechnician: (id: string, status: RecordStatus) => void; onReturn: (id: string, reason: ReturnReason, note: string) => void; }) {
  const [filter, setFilter] = useState<"all" | RecordStatus>("all");
  const filtered = records.filter((record) => (filter === "all" ? true : record.status === filter));
  return (
    <div>
      <SectionHeading eyebrow="Operational workflow" title="Inventory and decisions" action={<PrimaryButton onClick={onAdd}>Add another device</PrimaryButton>} />
      <div className="mb-5 flex flex-wrap gap-2">
        {[["all", "All"], ["ready_to_sell", "Ready"], ["technician_review", "Tech review"], ["owner_override", "Overrides"], ["returned", "Returned"], ["rejected", "Rejected"]].map(([id, label]) => <button key={id} onClick={() => setFilter(id as "all" | RecordStatus)} className={`rounded-full border px-4 py-2 text-sm font-black ${filter === id ? "border-brand bg-brand text-white" : "border-line bg-white text-muted"}`}>{label}</button>)}
      </div>
      <div className="grid gap-4">{filtered.length ? filtered.map((record) => <InventoryCard key={record.id} record={record} onTechnicianChange={onTechnicianChange} onResolveTechnician={onResolveTechnician} onReturn={onReturn} />) : <EmptyState />}</div>
    </div>
  );
}

function InventoryCard({ record, onTechnicianChange, onResolveTechnician, onReturn }: { record: EnrichedRecord; onTechnicianChange: (id: string, patch: Partial<NonNullable<EnrichedRecord["technicianReview"]>>) => void; onResolveTechnician: (id: string, status: RecordStatus) => void; onReturn: (id: string, reason: ReturnReason, note: string) => void; }) {
  const [returnReason, setReturnReason] = useState<ReturnReason>("battery");
  const [returnNote, setReturnNote] = useState("");
  const economics = calculateTechnicianEconomics(record);
  const status = statusCopy[record.status];

  return (
    <article className="rounded-3xl border border-line bg-paper p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div><strong className="text-lg">{record.model} · {record.storage}</strong><p className="mt-1 text-muted">Grade {record.recommendation.grade} · {record.recommendation.risk} risk · {record.recommendation.confidence}% confidence</p></div>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </div>
      <div className="grid gap-3 md:grid-cols-4"><PriceTile label="Seller ask" value={formatCurrency(record.askingPrice)} /><PriceTile label="Buy range" value={`${formatCurrency(record.recommendation.buyLow)}–${formatCurrency(record.recommendation.buyHigh)}`} /><PriceTile label="Target resale" value={formatCurrency(record.recommendation.targetResale)} /><PriceTile label="Evidence" value={`${Object.values(record.evidence).filter(Boolean).length}/${evidenceItems.length}`} /></div>
      <p className="mt-4 leading-7 text-muted"><strong className="text-ink">Customer explanation:</strong> {record.recommendation.customerExplanation}</p>

      {record.status === "technician_review" && record.technicianReview && (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="font-black tracking-[-0.02em]">Repair economics</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Repair cost (₹)"><input className="premium-input" type="number" value={record.technicianReview.repairCost} onChange={(event) => onTechnicianChange(record.id, { repairCost: Number(event.target.value) })} /></Field>
            <Field label="Expected resale after repair (₹)"><input className="premium-input" type="number" value={record.technicianReview.expectedResaleAfterRepair} onChange={(event) => onTechnicianChange(record.id, { expectedResaleAfterRepair: Number(event.target.value) })} /></Field>
          </div>
          {economics && <div className="mt-3 grid gap-3 md:grid-cols-3"><PriceTile label="Sell as-is profit" value={formatCurrency(economics.sellAsIsProfit)} /><PriceTile label="Repair profit" value={formatCurrency(economics.repairProfit)} /><PriceTile label="Recommendation" value={economics.recommendation} /></div>}
          <div className="mt-4 flex flex-wrap gap-2"><SecondaryButton onClick={() => onResolveTechnician(record.id, "ready_to_sell")}>Clear as ready</SecondaryButton><SecondaryButton onClick={() => onResolveTechnician(record.id, "rejected")}>Reject after review</SecondaryButton></div>
        </div>
      )}

      {record.status !== "returned" && record.status !== "rejected" && (
        <div className="mt-5 rounded-3xl border border-line bg-white p-4">
          <h4 className="font-black tracking-[-0.02em]">Return feedback</h4>
          <p className="mt-1 text-sm text-muted">If a customer returns this device, link the reason back to the original intake checks.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[0.7fr_1fr_auto] md:items-end">
            <Field label="Reason"><select className="premium-input" value={returnReason} onChange={(event) => setReturnReason(event.target.value as ReturnReason)}>{Object.entries(returnReasonLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
            <Field label="Note"><input className="premium-input" value={returnNote} onChange={(event) => setReturnNote(event.target.value)} placeholder="What did the customer report?" /></Field>
            <SecondaryButton onClick={() => onReturn(record.id, returnReason, returnNote || returnReasonLabels[returnReason])}>Mark returned</SecondaryButton>
          </div>
        </div>
      )}

      {record.status === "returned" && record.returnInfo && (
        <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-red-800"><strong>Returned: {returnReasonLabels[record.returnInfo.reason]}</strong><p className="mt-1 text-sm">{record.returnInfo.note}</p><p className="mt-2 text-sm">Original related check: {relatedCheckForReturn(record.returnInfo.reason)} was marked <strong>{checkLabels[record.checks[relatedCheckForReturn(record.returnInfo.reason)] ?? "unchecked"]}</strong>.</p></div>
      )}
    </article>
  );
}

function CompactCard({ record }: { record: EnrichedRecord }) {
  const status = statusCopy[record.status];
  return <article className="rounded-3xl border border-line bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><strong>{record.model}</strong><p className="mt-1 text-sm text-muted">{record.recommendation.decision}</p></div><StatusPill tone={status.tone}>{status.label}</StatusPill></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><PriceTile label="Confidence" value={`${record.recommendation.confidence}%`} /><PriceTile label="Buy ceiling" value={formatCurrency(record.recommendation.buyHigh)} /></div></article>;
}

function ReviewQueueCard({ record }: { record: EnrichedRecord }) {
  const economics = calculateTechnicianEconomics(record);
  return <article className="rounded-3xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start justify-between gap-3"><div><strong>{record.model}</strong><p className="mt-1 text-sm text-amber-900">{economics?.recommendation ?? "Repair economics pending"}</p></div><StatusPill tone="review">Review</StatusPill></div></article>;
}

function buildReturnInsights(records: EnrichedRecord[]) {
  const returned = records.filter((record) => record.status === "returned" && record.returnInfo);
  const counts = returned.reduce<Record<string, number>>((acc, record) => {
    const reason = record.returnInfo?.reason ?? "other";
    acc[reason] = (acc[reason] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([reason, count]) => `${count} return${count > 1 ? "s" : ""} related to ${returnReasonLabels[reason as ReturnReason].toLowerCase()}. Tighten the ${relatedCheckForReturn(reason as ReturnReason)} check.`);
}

function relatedCheckForReturn(reason: ReturnReason) {
  if (reason === "battery") return "battery";
  if (reason === "screen") return "screen";
  if (reason === "charging") return "ports";
  if (reason === "performance") return "performance";
  if (reason === "camera_audio") return "cameraAudio";
  return "performance";
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-amber">{eyebrow}</p><h2 className="text-4xl font-black tracking-[-0.05em] md:text-5xl">{title}</h2></div>{action}</div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <article className="rounded-[1.75rem] border border-line bg-paper/90 p-5 shadow-soft md:p-6"><h3 className="mb-4 text-xl font-black tracking-[-0.03em]">{title}</h3>{children}</article>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-bold text-muted">{label}{children}</label>; }
function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className={`rounded-full bg-brand px-5 py-3 font-black text-white shadow-lg shadow-brand/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`} />; }
function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className={`rounded-full bg-[#fff4dc] px-5 py-3 font-black text-brand transition hover:-translate-y-0.5 ${props.className ?? ""}`} />; }
function OutcomeButton({ title, copy, onClick, danger, warning }: { title: string; copy: string; onClick: () => void; danger?: boolean; warning?: boolean }) { return <button type="button" onClick={onClick} className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${danger ? "border-red-200 bg-red-50 text-red-800" : warning ? "border-amber-200 bg-amber-50 text-amber-900" : "border-line bg-white text-ink"}`}><strong className="block">{title}</strong><small className="mt-1 block opacity-75">{copy}</small></button>; }
function PriceTile({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-line bg-white p-4"><span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</span><strong className="mt-1 block">{value}</strong></div>; }
function HeroStat({ label, value }: { label: string; value: string }) { return <div className="border-white/10 p-5 md:border-r md:last:border-r-0"><span className="text-sm font-bold text-white/55">{label}</span><strong className="mt-1 block text-xl font-black">{value}</strong></div>; }
function StatBox({ value, label }: { value: string; label: string }) { return <div className="rounded-3xl bg-white p-4 shadow-sm"><strong className="block text-2xl font-black">{value}</strong><span className="text-xs font-bold text-muted">{label}</span></div>; }
function StatusPill({ tone, children }: { tone: string; children: React.ReactNode }) { const color = tone === "high" || tone === "reject" ? "bg-red-100 text-red-700" : tone === "medium" || tone === "review" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"; return <span className={`w-fit rounded-full px-3 py-2 text-xs font-black ${color}`}>{children}</span>; }
function EmptyState({ title = "No records yet", description = "Complete an intake to create an evidence-backed device record." }) { return <div className="rounded-3xl border border-dashed border-line bg-paper/70 p-8 text-center text-muted"><strong className="block text-ink">{title}</strong><span>{description}</span></div>; }
