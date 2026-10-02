import { toneMap, type StatusMeaning } from "@/lib/admin/status";

// ============================================================================
// lib/pages/status.ts — pomen stanj strani
// ----------------------------------------------------------------------------
// Domena pove samo POMEN, barvo izbere `lib/admin/status.ts` (standard §11.2).
// ============================================================================

export const PAGE_STATUS_MEANING: Record<"DRAFT" | "PUBLISHED", StatusMeaning> = {
  DRAFT: "waiting",
  PUBLISHED: "done",
};

export const pageStatusTone = toneMap(PAGE_STATUS_MEANING);

export const PAGE_STATUS_LABEL: Record<"DRAFT" | "PUBLISHED", string> = {
  DRAFT: "Osnutek",
  PUBLISHED: "Objavljeno",
};
