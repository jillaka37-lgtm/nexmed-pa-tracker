export type ContactSource = "contact_form" | "chatbot" | "manual";
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type DealStatus = "open" | "won" | "lost";
export type ActivityType = "call" | "meeting" | "note" | "task" | "stage_change";

export type Lead = {
  id: string;
  source: ContactSource;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: LeadStatus;
  contactId: string | null;
  aiScore: number | null;
  aiScoreRationale: string | null;
  aiScoredAt: string | null;
  createdAt: string;
};

export type Company = {
  id: string;
  name: string;
  industry: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
};

export type Contact = {
  id: string;
  companyId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  source: ContactSource;
  notes: string | null;
  createdAt: string;
};

export type DealStage = {
  key: string;
  label: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
};

export type Deal = {
  id: string;
  title: string;
  contactId: string;
  companyId: string | null;
  stageKey: string;
  status: DealStatus;
  amountCents: number;
  expectedClose: string | null;
  lostReason: string | null;
  stageEnteredAt: string;
  createdAt: string;
};

export type Activity = {
  id: string;
  contactId: string | null;
  dealId: string | null;
  type: ActivityType;
  title: string;
  body: string | null;
  dueAt: string | null;
  doneAt: string | null;
  createdBy: string | null;
  createdAt: string;
};
