type NotificationFetch = (
  input: string,
  init: RequestInit
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

export type VolunteerHumanReviewNotificationRequest = {
  id: string;
  session_id: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  preferred_contact_method: string | null;
  message: string | null;
  created_at: string | null;
};

export type VolunteerHumanReviewNotificationResult =
  | { sent: true }
  | { sent: false; skipped: true; reason: "missing_config" }
  | { sent: false; skipped?: false; reason: "resend_error"; status: number };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatValue(value?: string | null) {
  return value?.trim() || "Not provided";
}

function getAdminInboxUrl(origin?: string) {
  const configuredUrl = process.env.TRIPDOC_ADMIN_HUMAN_REVIEWS_URL?.trim();
  if (configuredUrl) return configuredUrl;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    origin?.trim() ||
    "https://app.tripdoc.net";

  return `${baseUrl.replace(/\/+$/, "")}/manage-tripdoc/human-reviews`;
}

function buildNotificationText({
  request,
  acquisitionSource,
  adminInboxUrl,
}: {
  request: VolunteerHumanReviewNotificationRequest;
  acquisitionSource?: string | null;
  adminInboxUrl: string;
}) {
  return [
    "New TripDoc Volunteer Human Review Request",
    "",
    `Name: ${formatValue(request.name)}`,
    `Submitted: ${formatValue(request.created_at)}`,
    `Email: ${formatValue(request.email)}`,
    `WhatsApp: ${formatValue(request.whatsapp)}`,
    `Preferred contact method: ${formatValue(request.preferred_contact_method)}`,
    `Acquisition source: ${formatValue(acquisitionSource)}`,
    `Request ID: ${request.id}`,
    `Session ID: ${request.session_id}`,
    "",
    "Message:",
    formatValue(request.message),
    "",
    `Admin inbox: ${adminInboxUrl}`,
  ].join("\n");
}

function buildNotificationHtml({
  request,
  acquisitionSource,
  adminInboxUrl,
}: {
  request: VolunteerHumanReviewNotificationRequest;
  acquisitionSource?: string | null;
  adminInboxUrl: string;
}) {
  const rows = [
    ["Name", formatValue(request.name)],
    ["Submitted", formatValue(request.created_at)],
    ["Email", formatValue(request.email)],
    ["WhatsApp", formatValue(request.whatsapp)],
    ["Preferred contact method", formatValue(request.preferred_contact_method)],
    ["Acquisition source", formatValue(acquisitionSource)],
    ["Request ID", request.id],
    ["Session ID", request.session_id],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:8px;border-bottom:1px solid #e5e7eb;color:#334155;">${escapeHtml(
          label
        )}</th><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#0f172a;">${escapeHtml(
          value
        )}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h1 style="font-size:22px;margin:0 0 12px;">New TripDoc Volunteer Human Review Request</h1>
      <p style="margin:0 0 16px;color:#475569;">A user requested optional human review after completing Volunteer Match.</p>
      <table style="border-collapse:collapse;width:100%;max-width:680px;margin-bottom:18px;">${rowsHtml}</table>
      <h2 style="font-size:16px;margin:0 0 8px;">Message</h2>
      <p style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:0 0 18px;">${escapeHtml(
        formatValue(request.message)
      )}</p>
      <p style="margin:0;">
        <a href="${escapeHtml(
          adminInboxUrl
        )}" style="display:inline-block;background:#0b5fff;color:#ffffff;text-decoration:none;border-radius:8px;padding:10px 14px;font-weight:700;">Open Human Reviews Inbox</a>
      </p>
    </div>
  `;
}

export async function sendVolunteerHumanReviewNotification({
  request,
  acquisitionSource,
  origin,
  fetchImpl = fetch as NotificationFetch,
}: {
  request: VolunteerHumanReviewNotificationRequest;
  acquisitionSource?: string | null;
  origin?: string;
  fetchImpl?: NotificationFetch;
}): Promise<VolunteerHumanReviewNotificationResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipient = process.env.TRIPDOC_ADMIN_NOTIFICATION_EMAIL?.trim();
  const from = process.env.TRIPDOC_NOTIFICATION_FROM?.trim();

  if (!apiKey || !recipient || !from) {
    return { sent: false, skipped: true, reason: "missing_config" };
  }

  const adminInboxUrl = getAdminInboxUrl(origin);
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: "New TripDoc Volunteer Human Review Request",
      text: buildNotificationText({
        request,
        acquisitionSource,
        adminInboxUrl,
      }),
      html: buildNotificationHtml({
        request,
        acquisitionSource,
        adminInboxUrl,
      }),
    }),
  });

  if (!response.ok) {
    await response.text().catch(() => "");
    return { sent: false, reason: "resend_error", status: response.status };
  }

  return { sent: true };
}
