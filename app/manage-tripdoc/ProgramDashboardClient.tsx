"use client";

import { useEffect, useRef, useState } from "react";
import SafeMarkdown from "../components/SafeMarkdown";
import { generateOpportunitySlug, validateProgramAdminPayload, publishingStatusValues, verificationStatusValues, availabilityStatusValues, deadlineModeValues, sponsorshipStatusValues, type ProgramAdminPayload } from "../../lib/opportunityPrograms";
import styles from "./admin.module.css";

type RecordRow = ProgramAdminPayload & { id: string; admin_version: number };
type History = { id: string; actor: string; action: string; created_at: string; changed_fields: string[]; previous_values: Record<string, unknown> | null; new_values: Record<string, unknown> | null };
const empty = (): ProgramAdminPayload => validateProgramAdminPayload({}).payload;
const label = (value: string) => value.replaceAll("_", " ");
const sections = ["Details", "Description", "Application", "Funding", "Verification", "Search & image", "History"] as const;
type Section = typeof sections[number];
async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({ error: "Unexpected server response. Your edits are still here." }));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
export default function ProgramDashboardClient() {
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [publishing, setPublishing] = useState("all");
  const [verification, setVerification] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [expired, setExpired] = useState(false);
  const [sort, setSort] = useState("newest");
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [form, setForm] = useState<ProgramAdminPayload | null>(null);
  const [saved, setSaved] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [section, setSection] = useState<Section>("Details");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const dirty = form !== null && JSON.stringify(form) !== saved;
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setListError("");
      const query = new URLSearchParams({ page: String(page), pageSize: "15", search, publishingStatus: publishing, verificationStatus: verification, availabilityStatus: availability, deadlineView: expired ? "expired" : "all", sortBy: sort });
      try {
        const data = await readResponse(await fetch(`/api/admin/programs?${query}`, { signal: controller.signal, cache: "no-store" }));
        setRows(data.programs); setPages(data.pagination.totalPages); setTotal(data.pagination.total);
      } catch (err) { if (!controller.signal.aborted) setListError((err as Error).message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, search, publishing, verification, availability, expired, sort, refresh]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest("a");
      if (anchor && anchor.target !== "_blank" && !anchor.getAttribute("href")?.startsWith("#") && !window.confirm("Leave this page? Unsaved edits will be lost.")) event.preventDefault();
    };
    window.addEventListener("beforeunload", prevent); document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", prevent); document.removeEventListener("click", navigate, true); };
  }, [dirty, busy]);
  function mayLeave() { return !busy && (!dirty || window.confirm("Discard unsaved edits?")); }
  function selectForm(next: ProgramAdminPayload, recordId: string | null, recordVersion: number | null, changes: History[] = []) {
    setForm(next); setSaved(JSON.stringify(next)); setId(recordId); setVersion(recordVersion); setHistory(changes); setError(""); setMessage(""); setSection("Details"); setPreview(false);
    setTimeout(() => editor.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }
  async function edit(row: RecordRow) {
    if (!mayLeave()) return;
    setBusy(true); setListError("");
    try {
      const data = await readResponse(await fetch(`/api/admin/programs/${row.id}`, { cache: "no-store" }));
      selectForm(validateProgramAdminPayload(data.program).payload, row.id, data.program.admin_version, data.history);
    } catch (err) { setListError((err as Error).message); }
    finally { setBusy(false); }
  }
  function change<K extends keyof ProgramAdminPayload>(key: K, value: ProgramAdminPayload[K]) {
    setForm(current => current ? { ...current, [key]: value } : current);
  }
  async function save(status?: ProgramAdminPayload["publishing_status"]) {
    if (!form || busy) return;
    const candidate = { ...form, publishing_status: status || form.publishing_status };
    const validation = validateProgramAdminPayload(candidate);
    if (validation.errors.length) { setError(validation.errors.join(" ")); setMessage(""); return; }
    if (candidate.publishing_status === "published" && (JSON.parse(saved || "{}").publishing_status !== "published") && !window.confirm("Publish this opportunity on TripDoc?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const data = await readResponse(await fetch(id ? `/api/admin/programs/${id}` : "/api/admin/programs", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...candidate, admin_version: version }) }));
      const next = validateProgramAdminPayload(data.program).payload;
      setForm(next); setSaved(JSON.stringify(next)); setId(data.program.id); setVersion(data.program.admin_version);
      setMessage(`Saved as ${next.publishing_status}.${data.warnings?.length ? " " + data.warnings.join(" ") : ""}`);
      setRefresh(n => n + 1);
      try {
        const detail = await readResponse(await fetch(`/api/admin/programs/${data.program.id}`, { cache: "no-store" })); setHistory(detail.history);
      } catch { setMessage(previous => previous + " History could not be refreshed; reopen the record to see it."); }
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function upload(file?: File) {
    if (!file || busy) return;
    if (file.size > 4 * 1024 * 1024) { setError("Choose an image under 4 MB."); return; }
    setBusy(true); setError("");
    try {
      const body = new FormData(); body.append("file", file);
      const data = await readResponse(await fetch("/api/admin/program-images", { method: "POST", body }));
      change("image_url", data.url); setMessage("Image uploaded. Add alternative text and save the opportunity to use it.");
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  function insert(before: string, after = "", fallback = "text") {
    if (!form) return;
    const area = textArea.current; const start = area?.selectionStart || 0; const end = area?.selectionEnd || 0;
    const content = form.description || ""; const selection = content.slice(start, end) || fallback;
    change("description", content.slice(0, start) + before + selection + after + content.slice(end));
    requestAnimationFrame(() => { area?.focus(); area?.setSelectionRange(start + before.length, start + before.length + selection.length); });
  }
  function field(key: keyof ProgramAdminPayload, title: string, type = "text", hint?: string, locked = false) {
    if (!form) return null;
    return <label className={styles.field}>{title}<input type={type} value={type === "date" ? String(form[key] ?? "").slice(0, 10) : String(form[key] ?? "")} readOnly={locked} onChange={event => change(key, type === "number" ? (event.target.value === "" ? null : Number(event.target.value)) : event.target.value)} step={type === "number" ? "0.01" : undefined} min={type === "number" ? "0" : undefined} />{hint && <small>{hint}</small>}</label>;
  }
  function area(key: keyof ProgramAdminPayload, title: string, hint?: string) {
    if (!form) return null;
    return <label className={styles.field}>{title}<textarea rows={4} value={String(form[key] ?? "")} onChange={event => change(key, event.target.value)} />{hint && <small>{hint}</small>}</label>;
  }
  function select(key: keyof ProgramAdminPayload, title: string, values: readonly string[]) {
    if (!form) return null;
    return <label className={styles.field}>{title}<select value={String(form[key] ?? "")} onChange={event => change(key, event.target.value as never)}>{values.map(value => <option key={value} value={value}>{label(value) || "Not specified"}</option>)}</select></label>;
  }
  return <main className={styles.dashboard}>
    <div className={styles.heading}><div><p className={styles.eyebrow}>TRIPDOC ADMIN</p><h1>Opportunities</h1><p>Prepare, check and publish opportunity information.</p></div><button className={styles.primary} disabled={busy} onClick={() => { if (mayLeave()) selectForm(empty(), null, null); }}>New opportunity</button></div>
    <nav className={styles.nav} aria-label="Admin"><a href="/manage-tripdoc/hiring-companies">Hiring companies</a><a href="/manage-tripdoc/hiring-jobs">Hiring jobs</a><a href="/manage-tripdoc/human-reviews">Human reviews</a><a href="/" target="_blank" rel="noreferrer">View website</a><button disabled={busy} onClick={async () => { if (!mayLeave()) return; try { await readResponse(await fetch("/api/admin-logout", { method: "POST" })); window.location.href = "/manage-tripdoc/login"; } catch (err) { setListError((err as Error).message); } }}>Sign out</button></nav>
    <section className={styles.panel} aria-label="Find opportunities">
      <div className={styles.filters}>
        <label className={styles.field}>Search<input value={search} placeholder="Title, organisation, country…" onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
        <label className={styles.field}>Publishing<select value={publishing} onChange={event => { setPublishing(event.target.value); setPage(1); }}>{["all", ...publishingStatusValues].map(v => <option key={v}>{v}</option>)}</select></label>
        <label className={styles.field}>Verification<select value={verification} onChange={event => { setVerification(event.target.value); setPage(1); }}>{["all", ...verificationStatusValues].map(v => <option key={v} value={v}>{label(v)}</option>)}</select></label>
        <label className={styles.field}>Availability<select value={availability} onChange={event => { setAvailability(event.target.value); setPage(1); }}>{["all", ...availabilityStatusValues].map(v => <option key={v}>{v}</option>)}</select></label>
        <label className={styles.field}>Sort<select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}>{["newest", "oldest", "title-asc", "title-desc", "deadline-asc", "deadline-desc", "featured-first"].map(v => <option key={v}>{v}</option>)}</select></label>
      </div>
      <div className={styles.actions}><label><input type="checkbox" checked={expired} onChange={event => { setExpired(event.target.checked); setPage(1); }} /> Past deadline dates (over a day ago)</label><button onClick={() => { setVerification("needs_review"); setPage(1); }}>Needs review</button><button onClick={() => { setSearch(""); setPublishing("all"); setVerification("all"); setAvailability("all"); setExpired(false); setPage(1); }}>Reset filters</button></div>
      {listError && <p role="alert" className={styles.error}>{listError} <a href="/manage-tripdoc/login" target="_blank" rel="noreferrer">Open sign-in</a></p>}
      <div className={styles.tableWrap}><table><caption>{loading ? "Loading opportunities…" : `${total} matching opportunities`}</caption><thead><tr><th>Opportunity</th><th>Publishing / verification</th><th>Availability / deadline</th><th>Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong>{row.title}</strong><small>{row.country || "Country not specified"} · {row.type || "Type not specified"}{row.featured ? " · Featured" : ""}</small></td><td>{label(row.publishing_status)}<small>{label(row.verification_status)}</small></td><td>{label(row.availability_status)}<small>{row.deadline_mode === "fixed_date" ? row.deadline || "Date missing" : label(row.deadline_mode)}</small></td><td><button disabled={busy || loading} onClick={() => edit(row)}>Edit</button></td></tr>)}</tbody></table>{!loading && !rows.length && <p>No opportunities match these filters.</p>}</div>
      <div className={styles.actions}><button disabled={page <= 1 || loading} onClick={() => setPage(n => n - 1)}>Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages || loading} onClick={() => setPage(n => n + 1)}>Next</button></div>
    </section>
    {form && <div ref={editor} className={styles.editor}>
      <div className={styles.heading}><div><h2>{id ? "Edit opportunity" : "New opportunity"}</h2><p>{dirty ? "Unsaved changes" : "No unsaved changes"}</p></div><button disabled={busy} onClick={() => { if (mayLeave()) setForm(null); }}>Close editor</button></div>
      {error && <p role="alert" className={styles.error}>{error} <a href="/manage-tripdoc/login" target="_blank" rel="noreferrer">Sign in in another tab</a></p>}
      {message && <p role="status" className={styles.message}>{message}</p>}
      <div className={styles.tabs} aria-label="Editor sections">{sections.map(tab => <button key={tab} type="button" aria-pressed={section === tab} onClick={() => setSection(tab)}>{tab}</button>)}</div>
      <form onSubmit={event => { event.preventDefault(); void save(); }}>
        <fieldset disabled={busy} className={styles.fields}><legend className={styles.srOnly}>{section}</legend>
          {section === "Details" && <>
            {field("title", "Title *")}
            <div className={styles.grid}>{field("slug", "URL slug *", "text", id ? "Locked to preserve existing links." : "Use a short, descriptive URL. It locks after the first save.", !!id)}{!id && <button type="button" onClick={() => change("slug", generateOpportunitySlug(form.title))}>Generate slug from title</button>}</div>
            <p className={styles.hint}>URL: /programs/{form.slug || generateOpportunitySlug(form.title) || "your-title"}</p>
            <div className={styles.grid}>{field("organisation", "Organisation")}{field("country", "Country / location", "text", "Use Global for home-based opportunities open across countries.")}{field("type", "Opportunity type", "text", "For example Internship, Scholarship, Fellowship, Research, Volunteer.")}{select("publishing_status", "Publishing status", publishingStatusValues)}{select("availability_status", "Availability", availabilityStatusValues)}{select("deadline_mode", "Deadline mode", deadlineModeValues)}</div>
            {form.deadline_mode === "fixed_date" && <div className={styles.grid}>{field("deadline", "Deadline date", "date")}{field("deadline_time", "Official closing time (optional)", "time")}{field("deadline_timezone", "Official timezone (optional)", "text", "For example Europe/Berlin. Leave blank when the source does not specify one.")}</div>}
            <p className={styles.hint}>Drafts are private. Published listings appear publicly; archived listings keep their URLs but leave active lists. A fixed deadline without a timezone remains active until that date ends worldwide.</p>
            <label><input type="checkbox" checked={form.featured} onChange={event => change("featured", event.target.checked)} /> Featured opportunity</label>
          </>}
          {section === "Description" && <>
            <div className={styles.actions}><button type="button" onClick={() => setPreview(v => !v)}>{preview ? "Edit text" : "Preview formatting"}</button>{!preview && <><button type="button" onClick={() => insert("**", "**")}>Bold</button><button type="button" onClick={() => insert("\n## ", "\n", "Heading")}>Heading</button><button type="button" onClick={() => insert("\n- ", "\n", "List item")}>Bullet</button><button type="button" onClick={() => insert("\n1. ", "\n", "Step")}>Numbered step</button><button type="button" onClick={() => insert("[", "](https://example.org)", "Link label")}>Link</button></>}</div>
            {preview ? <div className={styles.preview}><SafeMarkdown content={form.description || "Nothing to preview yet."} /></div> : <label className={styles.field}>Program description<textarea ref={textArea} rows={18} value={form.description || ""} onChange={event => change("description", event.target.value)} /><small>Markdown supports headings, bold, lists and [link text](https://…). Raw HTML is not rendered. Put mandatory extra forms in Application so they are visible separately.</small></label>}
          </>}
          {section === "Application" && <>
            {field("official_url", "Primary application URL", "url", "This is the main official application button.")}
            <h3>Additional application steps</h3><p>Use one step per form or action. Mark each mandatory step as required.</p>
            {form.additional_application_steps.map((step, index) => <div className={styles.repeat} key={step.id}>
              <h4>Step {index + 1}</h4><label className={styles.field}>Step label<input value={step.label} onChange={event => change("additional_application_steps", form.additional_application_steps.map((s, i) => i === index ? { ...s, label: event.target.value } : s))} /></label>
              <label className={styles.field}>Instructions<textarea rows={3} value={step.instructions} onChange={event => change("additional_application_steps", form.additional_application_steps.map((s, i) => i === index ? { ...s, instructions: event.target.value } : s))} /></label>
              <label className={styles.field}>Step URL (optional)<input type="url" value={step.url || ""} onChange={event => change("additional_application_steps", form.additional_application_steps.map((s, i) => i === index ? { ...s, url: event.target.value } : s))} /></label>
              <div className={styles.actions}><label><input type="checkbox" checked={step.required} onChange={event => change("additional_application_steps", form.additional_application_steps.map((s, i) => i === index ? { ...s, required: event.target.checked } : s))} /> Required</label><button type="button" disabled={!index} onClick={() => { const steps = [...form.additional_application_steps]; [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]]; change("additional_application_steps", steps); }}>Move up</button><button type="button" onClick={() => change("additional_application_steps", form.additional_application_steps.filter((_, i) => i !== index))}>Remove step</button></div>
            </div>)}<button type="button" disabled={form.additional_application_steps.length >= 30} onClick={() => change("additional_application_steps", [...form.additional_application_steps, { id: crypto.randomUUID(), label: "", instructions: "", url: null, required: false }])}>Add application step</button>
          </>}
          {section === "Funding" && <>
            <div className={styles.grid}>{field("funding_type", "Funding category", "text", "For example Paid, Stipend, Fully Funded, Partially Funded, Unpaid.")}{field("funding_amount", "Published amount (optional)", "number")}{field("funding_currency", "Currency code", "text", "For example USD, EUR or KRW.")}</div>
            {area("funding_coverage", "What funding covers", "Include the payment frequency, eligibility conditions and source wording. Leave the amount blank if it varies.")}{area("applicant_costs", "Costs the applicant pays")}
            {select("sponsorship_status", "Visa sponsorship", sponsorshipStatusValues)}{area("sponsorship_evidence", "Vacancy-specific sponsorship evidence", "A company's sponsor licence does not prove sponsorship for this vacancy.")}{field("sponsorship_source_url", "Sponsorship source URL", "url")}
          </>}
          {section === "Verification" && <>
            {select("verification_status", "Verification status", verificationStatusValues)}
            <div className={styles.grid}>{field("reviewer_name", "Reviewer name")}{field("verified_at", "Actual date checked", "date", "Use the date you reviewed the official sources.")}</div>
            <h3>Official source links</h3><p>Verified records require a reviewer, date and at least one official source.</p>
            {form.official_source_links.map((source, index) => <div className={styles.repeat} key={source.id}><label className={styles.field}>Source label<input value={source.label} onChange={event => change("official_source_links", form.official_source_links.map((s, i) => i === index ? { ...s, label: event.target.value } : s))} /></label><label className={styles.field}>Official source URL<input type="url" value={source.url} onChange={event => change("official_source_links", form.official_source_links.map((s, i) => i === index ? { ...s, url: event.target.value } : s))} /></label><button type="button" onClick={() => change("official_source_links", form.official_source_links.filter((_, i) => i !== index))}>Remove source</button></div>)}
            <button type="button" disabled={form.official_source_links.length >= 30} onClick={() => change("official_source_links", [...form.official_source_links, { id: crypto.randomUUID(), label: "", url: "" }])}>Add official source</button>
            {area("evidence_notes", "Public verification notes", "Explain what was checked and any uncertainty. Visible to visitors.")}{area("private_reviewer_notes", "Private reviewer notes", "Admin only; excluded from public pages and public data access. Avoid unnecessary personal information.")}
          </>}
          {section === "Search & image" && <>
            {field("seo_title", "Search title override (optional)", "text", "Defaults to the opportunity title.")}{area("seo_description", "Search description override (optional)", "Defaults to an excerpt of the description. Search engines may choose different wording.")}
            <div className={styles.preview}><small>Search preview</small><h3>{form.seo_title || form.title || "Opportunity title"}</h3><p>app.tripdoc.net/programs/{form.slug || generateOpportunitySlug(form.title)}</p><p>{form.seo_description || (form.description || "Add a clear description.").replace(/[#*`\[\]]/g, "").slice(0, 160)}</p></div>
            {field("image_url", "Image URL (or upload below)", "url")}
            <label className={styles.field}>Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} /><small>JPEG, PNG, WebP or AVIF under 4 MB. Images are resized and converted to WebP.</small></label>
            {field("image_alt", "Image alternative text", "text", "Describe the image for people who cannot see it.")}
            {form.image_url && /^https?:\/\//.test(form.image_url) && <img className={styles.image} src={form.image_url} alt={form.image_alt || "Opportunity image preview"} />}
            {form.image_url && <button type="button" onClick={() => { change("image_url", null); change("image_alt", null); }}>Remove image from this opportunity</button>}
          </>}
          {section === "History" && <><h3>Recent change history</h3><p>Up to 30 recent saves. The shared admin account is recorded as shared-admin; reviewer names describe content checks.</p>{!history.length && <p>No recorded changes yet. Earlier edits before this upgrade are not reconstructed.</p>}{history.map(entry => <details className={styles.repeat} key={entry.id}><summary>{new Date(entry.created_at).toLocaleString()} · {entry.action} · {entry.actor || "shared-admin"}</summary><ul>{entry.changed_fields.map(key => <li key={key}><strong>{label(key)}</strong><div className={styles.diff}>Before: {JSON.stringify(entry.previous_values?.[key] ?? null)}<br />After: {JSON.stringify(entry.new_values?.[key] ?? null)}</div></li>)}</ul></details>)}</>}
        </fieldset>
        <div className={styles.savebar}><span>{busy ? "Working…" : dirty ? "Unsaved changes" : "All changes saved"}</span><button type="button" disabled={busy} onClick={() => void save("draft")}>Save draft</button><button className={styles.primary} type="submit" disabled={busy}>Save {form.publishing_status === "published" ? "and publish" : "opportunity"}</button>{id && form.publishing_status !== "archived" && <button type="button" disabled={busy} onClick={() => { if (window.confirm("Archive this opportunity? Its public URL will remain accessible for reference.")) void save("archived"); }}>Archive</button>}{id && form.publishing_status !== "draft" && <a target="_blank" rel="noreferrer" href={`/programs/${form.slug}`}>View public page</a>}</div>
      </form>
    </div>}
  </main>;
}
