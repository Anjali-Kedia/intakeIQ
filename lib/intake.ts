export type DeviceType = "phone" | "laptop" | "tablet";
export type DocumentationStatus = "invoice" | "partial" | "none";
export type CheckStatus = "pass" | "minor" | "major" | "unchecked";
export type DecisionClass = "buy" | "review" | "reject";
export type RiskLevel = "Low" | "Medium" | "High";
export type RecordStatus = "ready_to_sell" | "technician_review" | "rejected" | "owner_override" | "returned";
export type ReturnReason = "battery" | "screen" | "charging" | "performance" | "camera_audio" | "changed_mind" | "other";

export type CatalogItem = {
  model: string;
  baseResale: number;
};

export type EvidenceKey = "front" | "back" | "damage" | "port" | "proof";

export type EvidenceState = Record<EvidenceKey, boolean>;

export type TechnicianReview = {
  repairCost: number;
  expectedResaleAfterRepair: number;
  decision: "pending" | "repair" | "sell_as_is" | "reject";
  note: string;
};

export type ReturnInfo = {
  reason: ReturnReason;
  note: string;
};

export type IntakeRecord = {
  id: string;
  type: DeviceType;
  model: string;
  storage: string;
  askingPrice: number;
  documentation: DocumentationStatus;
  sellerClaim: string;
  checks: Record<string, CheckStatus>;
  status?: RecordStatus;
  evidence?: EvidenceState;
  technicianReview?: TechnicianReview;
  returnInfo?: ReturnInfo;
  decisionNote?: string;
};

export type EnrichedRecord = IntakeRecord & {
  status: RecordStatus;
  evidence: EvidenceState;
  recommendation: Recommendation;
};

export type Recommendation = {
  grade: "A" | "B" | "C" | "D";
  risk: RiskLevel;
  riskScore: number;
  confidence: number;
  decision: string;
  decisionClass: DecisionClass;
  baseResale: number;
  targetResale: number;
  buyLow: number;
  buyHigh: number;
  projectedMargin: number;
  rationale: string[];
  followUps: string[];
  customerExplanation: string;
};

export const pricingCatalog: Record<DeviceType, CatalogItem[]> = {
  phone: [
    { model: "iPhone 13", baseResale: 28500 },
    { model: "iPhone 12", baseResale: 22500 },
    { model: "Samsung Galaxy S22", baseResale: 26000 },
    { model: "OnePlus 11R", baseResale: 24500 }
  ],
  laptop: [
    { model: "MacBook Air M1", baseResale: 52000 },
    { model: "Dell Inspiron 14", baseResale: 28500 },
    { model: "Lenovo ThinkPad T14", baseResale: 36000 }
  ],
  tablet: [
    { model: "iPad 9th Gen", baseResale: 23000 },
    { model: "Samsung Tab S8", baseResale: 34500 },
    { model: "Lenovo Tab P11", baseResale: 14500 }
  ]
};

export const inspectionItems = [
  {
    id: "identity",
    title: "Identity and lock status",
    help: "Device identity checked without storing the actual serial/IMEI in this prototype."
  },
  {
    id: "screen",
    title: "Screen and touch",
    help: "Look for replacement signs, dead pixels, touch issues and brightness problems."
  },
  {
    id: "body",
    title: "Body and cosmetic condition",
    help: "Cosmetic damage is subjective, so the checklist makes the judgement explicit."
  },
  {
    id: "battery",
    title: "Battery health",
    help: "Low battery health can reduce resale price or create a likely warranty return."
  },
  {
    id: "water",
    title: "Water damage indicators",
    help: "Unclear water history is treated as risk even if the device currently works."
  },
  {
    id: "ports",
    title: "Charging, ports and buttons",
    help: "Faulty charging or buttons often needs repair before resale."
  },
  {
    id: "cameraAudio",
    title: "Camera, speaker and microphone",
    help: "Checks common customer-return triggers."
  },
  {
    id: "performance",
    title: "Basic performance test",
    help: "Device should restart cleanly and handle basic use without lag or overheating."
  }
] as const;

export const evidenceItems: { id: EvidenceKey; title: string; help: string }[] = [
  { id: "front", title: "Front screen", help: "Useful for scratches, dead pixels and display disputes." },
  { id: "back", title: "Back body", help: "Captures dents, cracks, colour and cosmetic grade." },
  { id: "damage", title: "Damage close-up", help: "Attach specific evidence for the issue that affects price." },
  { id: "port", title: "Charging port", help: "Common return trigger; helps technician review." },
  { id: "proof", title: "Proof seen", help: "Mark proof captured/seen without storing sensitive ID numbers." }
];

export const checkLabels: Record<CheckStatus, string> = {
  pass: "Pass",
  minor: "Minor issue",
  major: "Major issue",
  unchecked: "Not checked"
};

export const returnReasonLabels: Record<ReturnReason, string> = {
  battery: "Battery issue",
  screen: "Screen issue",
  charging: "Charging issue",
  performance: "Performance issue",
  camera_audio: "Camera/audio issue",
  changed_mind: "Customer changed mind",
  other: "Other"
};

const scoreWeights: Record<CheckStatus, number> = {
  pass: 0,
  minor: 1,
  major: 3,
  unchecked: 2
};

export const defaultChecks: Record<string, CheckStatus> = {
  identity: "pass",
  screen: "minor",
  body: "minor",
  battery: "minor",
  water: "pass",
  ports: "pass",
  cameraAudio: "pass",
  performance: "pass"
};

export const defaultEvidence: EvidenceState = {
  front: true,
  back: true,
  damage: false,
  port: false,
  proof: false
};

export const defaultRecords: IntakeRecord[] = [
  {
    id: "demo-1",
    model: "iPhone 12",
    type: "phone",
    storage: "128 GB",
    askingPrice: 19000,
    documentation: "partial",
    sellerClaim: "Screen was replaced last year.",
    status: "ready_to_sell",
    evidence: { front: true, back: true, damage: true, port: true, proof: true },
    checks: {
      identity: "pass",
      screen: "minor",
      body: "minor",
      battery: "minor",
      water: "pass",
      ports: "pass",
      cameraAudio: "pass",
      performance: "pass"
    }
  },
  {
    id: "demo-2",
    model: "Samsung Galaxy S22",
    type: "phone",
    storage: "256 GB",
    askingPrice: 23000,
    documentation: "none",
    sellerClaim: "Urgent sale. No issues.",
    status: "technician_review",
    evidence: { front: true, back: true, damage: true, port: false, proof: false },
    technicianReview: {
      repairCost: 2500,
      expectedResaleAfterRepair: 24500,
      decision: "pending",
      note: "Confirm water indicator and charging reliability before purchase."
    },
    checks: {
      identity: "unchecked",
      screen: "pass",
      body: "minor",
      battery: "pass",
      water: "major",
      ports: "minor",
      cameraAudio: "pass",
      performance: "minor"
    }
  },
  {
    id: "demo-3",
    model: "iPhone 13",
    type: "phone",
    storage: "128 GB",
    askingPrice: 20500,
    documentation: "invoice",
    sellerClaim: "No issues claimed.",
    status: "returned",
    returnInfo: { reason: "battery", note: "Customer reported battery draining overnight." },
    evidence: { front: true, back: true, damage: false, port: true, proof: true },
    checks: {
      identity: "pass",
      screen: "pass",
      body: "minor",
      battery: "pass",
      water: "pass",
      ports: "pass",
      cameraAudio: "pass",
      performance: "pass"
    }
  }
];

export function formatCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function enrichRecord(record: IntakeRecord): EnrichedRecord {
  return {
    ...record,
    status: record.status ?? "ready_to_sell",
    evidence: record.evidence ?? defaultEvidence,
    recommendation: calculateRecommendation(record)
  };
}

export function calculateTechnicianEconomics(record: EnrichedRecord) {
  const review = record.technicianReview;
  if (!review) return null;

  const sellAsIsProfit = record.recommendation.targetResale - record.askingPrice;
  const repairProfit = review.expectedResaleAfterRepair - review.repairCost - record.askingPrice;
  const delta = repairProfit - sellAsIsProfit;

  return {
    sellAsIsProfit,
    repairProfit,
    delta,
    recommendation: delta > 1500 ? "Repair before resale" : delta < -500 ? "Sell as-is or reject" : "Owner judgement"
  };
}

export function calculateRecommendation(record: IntakeRecord): Recommendation {
  const catalogItem = findCatalogItem(record.type, record.model);
  let riskScore = 0;
  let pricePenalty = 0;
  let confidence = 96;
  const rationale: string[] = [];
  const customerNotes: string[] = [];
  const followUps: string[] = [];

  Object.entries(record.checks).forEach(([key, value]) => {
    riskScore += scoreWeights[value];
    if (value === "minor") {
      pricePenalty += 0.05;
      confidence -= 3;
    }
    if (value === "major") {
      pricePenalty += 0.16;
      confidence -= 8;
    }
    if (value === "unchecked") {
      pricePenalty += 0.08;
      confidence -= 10;
    }

    const item = inspectionItems.find((entry) => entry.id === key);
    if (!item) return;

    if (value === "minor") rationale.push(`${item.title} has a minor issue.`);
    if (value === "major") {
      rationale.push(`${item.title} has a major issue and needs review.`);
      followUps.push(`Technician review: ${item.title}`);
    }
    if (value === "unchecked") {
      rationale.push(`${item.title} was not checked, so the recommendation adds uncertainty risk.`);
    }
  });

  if (record.documentation === "partial") {
    riskScore += 1;
    pricePenalty += 0.04;
    confidence -= 5;
    rationale.push("Seller provided only partial proof of purchase.");
  }

  if (record.documentation === "none") {
    riskScore += 3;
    pricePenalty += 0.1;
    confidence -= 12;
    rationale.push("Seller has no invoice, increasing ownership and return risk.");
    followUps.push("Owner approval before purchase");
  }

  const evidence = record.evidence ?? defaultEvidence;
  const missingEvidence = Object.values(evidence).filter((captured) => !captured).length;
  if (missingEvidence >= 3) {
    confidence -= 9;
    rationale.push("Limited evidence captured; customer dispute confidence is lower.");
  } else if (missingEvidence >= 1) {
    confidence -= 3;
  }

  const adjustedResale = catalogItem.baseResale * Math.max(0.48, 1 - pricePenalty);
  const buyHigh = adjustedResale * 0.72;
  const buyLow = adjustedResale * 0.58;
  const askingTooHigh = record.askingPrice > buyHigh;

  if (askingTooHigh) {
    riskScore += 1;
    confidence -= 4;
    rationale.push("Seller asking price is above the recommended buy ceiling.");
  }

  const values = Object.values(record.checks);
  const majorCount = values.filter((value) => value === "major").length;
  const uncheckedCount = values.filter((value) => value === "unchecked").length;
  const minorCount = values.filter((value) => value === "minor").length;

  let grade: Recommendation["grade"] = "A";
  if (majorCount >= 1 || minorCount >= 4 || uncheckedCount >= 2) grade = "C";
  else if (minorCount >= 1 || uncheckedCount === 1 || record.documentation !== "invoice") grade = "B";
  if (majorCount >= 2 || record.checks.identity === "major" || record.checks.water === "major") grade = "D";

  let risk: RiskLevel = "Low";
  if (riskScore >= 9) risk = "High";
  else if (riskScore >= 4) risk = "Medium";

  let decision = "Buy";
  let decisionClass: DecisionClass = "buy";
  if (risk === "High" || grade === "D") {
    decision = "Technician / owner review";
    decisionClass = "review";
  }
  if ((grade === "D" && record.documentation === "none") || record.checks.identity === "major") {
    decision = "Reject";
    decisionClass = "reject";
  }
  if (decision === "Buy" && askingTooHigh) {
    decision = `Buy only below ${formatCurrency(buyHigh)}`;
    decisionClass = "review";
  }

  if (minorCount > 0) customerNotes.push("visible or functional wear reflected in the price");
  if (record.checks.battery === "minor" || record.checks.battery === "major") customerNotes.push("reduced battery condition");
  if (record.checks.screen === "minor" || record.checks.screen === "major") customerNotes.push("screen condition caveat");
  if (customerNotes.length === 0) customerNotes.push("core checks passed during intake");

  return {
    grade,
    risk,
    riskScore,
    confidence: Math.max(35, Math.min(99, confidence)),
    decision,
    decisionClass,
    baseResale: catalogItem.baseResale,
    targetResale: adjustedResale,
    buyLow,
    buyHigh,
    projectedMargin: adjustedResale - Math.min(record.askingPrice, buyHigh),
    rationale,
    followUps,
    customerExplanation: `This ${record.model} is graded ${grade}. It is priced based on ${customerNotes.join(
      ", "
    )}. Device identifiers are not shown on customer paperwork.`
  };
}

function findCatalogItem(type: DeviceType, model: string) {
  return pricingCatalog[type].find((item) => item.model === model) ?? pricingCatalog[type][0];
}
