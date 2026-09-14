function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toTitleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeCountry(value: string) {
  const raw = value.trim().toLowerCase();

  const map: Record<string, string> = {
    uk: "United Kingdom",
    "u.k.": "United Kingdom",
    britain: "United Kingdom",
    england: "United Kingdom",
    usa: "United States",
    us: "United States",
    "u.s.a.": "United States",
    "u.s.": "United States",
    worldwide: "Global",
    international: "Global",
    global: "Global",
    "all round": "Global",
    commonwealth: "Multiple Countries",
    "commonwealth countries": "Multiple Countries",
    multiple: "Multiple Countries",
    multicountry: "Multiple Countries",
    "multi country": "Multiple Countries",
  };

  return map[raw] || toTitleCase(value);
}

function normalizeType(value: string) {
  const raw = value.trim().toLowerCase();

  const map: Record<string, string> = {
    scholarship: "Scholarship",
    scholarships: "Scholarship",
    internship: "Internship",
    internships: "Internship",
    fellowship: "Fellowship",
    fellowships: "Fellowship",
    research: "Research",
    job: "Job",
    jobs: "Job",
    volunteer: "Volunteer",
    volunteering: "Volunteer",
    conference: "Conference",
    grant: "Grant",
    grants: "Grant",
    programme: "Programme",
    program: "Programme",
    "exchange program": "Exchange Program",
    "exchange programme": "Exchange Program",
    training: "Training",
    "paid internship": "Internship",
    "research scientist intern": "Internship",
    "paid student programme": "Programme",
    "paid student program": "Programme",
    "daad scholarship fully": "Scholarship",
  };

  return map[raw] || toTitleCase(value);
}

function normalizeFunding(value: string) {
  const raw = value.trim().toLowerCase();

  const map: Record<string, string> = {
    "full funded": "Fully Funded",
    "fully funded": "Fully Funded",
    "fully-funded": "Fully Funded",
    "partial funded": "Partially Funded",
    "partially funded": "Partially Funded",
    funded: "Funded",
    paid: "Paid",
    unpaid: "Unpaid",
    stipend: "Stipend",
    "paid internship": "Paid",
    "paid professional program": "Paid",
    "paid professional programme": "Paid",
    "tuition waiver": "Tuition Waiver",
  };

  return map[raw] || toTitleCase(value);
}

export function normalizeProgramBody(body: Record<string, unknown> | null) {
  return {
    ...(body || {}),
    country: normalizeText(body?.country)
      ? normalizeCountry(normalizeText(body?.country))
      : "",
    type: normalizeText(body?.type) ? normalizeType(normalizeText(body?.type)) : "",
    funding_type: normalizeText(body?.funding_type)
      ? normalizeFunding(normalizeText(body?.funding_type))
      : "",
  };
}

