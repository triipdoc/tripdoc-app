import { z } from "zod";

export const humanReviewWorkflowStatusSchema = z.enum([
  "new",
  "contacted",
  "reviewed",
  "closed",
]);

export const humanReviewListStatusSchema = z.union([
  humanReviewWorkflowStatusSchema,
  z.literal("all"),
]);

const nullableAdminNotesSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed || null;
}, z.string().max(5000).nullable().optional());

export const adminHumanReviewUpdateSchema = z
  .object({
    status: humanReviewWorkflowStatusSchema.optional(),
    admin_notes: nullableAdminNotesSchema,
  })
  .strict()
  .refine((value) => value.status || value.admin_notes !== undefined, {
    message: "Provide a status or admin notes update.",
  });

export type HumanReviewWorkflowStatus = z.infer<
  typeof humanReviewWorkflowStatusSchema
>;

export type HumanReviewListStatus = z.infer<typeof humanReviewListStatusSchema>;

export type HumanReviewWorkflowRow = {
  status?: string | null;
  contacted_at?: string | null;
  reviewed_at?: string | null;
  closed_at?: string | null;
};

export function normalizeHumanReviewStatus(
  value?: string | null
): HumanReviewWorkflowStatus {
  const parsed = humanReviewWorkflowStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "new";
}

export function getHumanReviewStatusLabel(status?: string | null) {
  switch (normalizeHumanReviewStatus(status)) {
    case "new":
      return "New";
    case "contacted":
      return "Contacted";
    case "reviewed":
      return "Reviewed";
    case "closed":
      return "Closed";
    default:
      return "New";
  }
}

export function buildHumanReviewStatusUpdate({
  current,
  nextStatus,
  adminNotes,
  now = new Date(),
}: {
  current: HumanReviewWorkflowRow;
  nextStatus?: HumanReviewWorkflowStatus;
  adminNotes?: string | null;
  now?: Date;
}) {
  const timestamp = now.toISOString();
  const payload: {
    status?: HumanReviewWorkflowStatus;
    admin_notes?: string | null;
    contacted_at?: string;
    reviewed_at?: string;
    closed_at?: string;
    updated_at: string;
  } = {
    updated_at: timestamp,
  };

  if (nextStatus) {
    payload.status = nextStatus;

    if (nextStatus === "contacted" && !current.contacted_at) {
      payload.contacted_at = timestamp;
    }

    if (nextStatus === "reviewed" && !current.reviewed_at) {
      payload.reviewed_at = timestamp;
    }

    if (nextStatus === "closed" && !current.closed_at) {
      payload.closed_at = timestamp;
    }
  }

  if (adminNotes !== undefined) {
    payload.admin_notes = adminNotes;
  }

  return payload;
}
