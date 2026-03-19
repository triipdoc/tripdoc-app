"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Program = {
  id: string;
  title: string;
  country: string | null;
  type: string | null;
  funding_type: string | null;
  deadline: string | null;
  official_url: string | null;
  image_url: string | null;
  description: string | null;
  verification_status: string | null;
  featured?: boolean | null;
};

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("");
  const [type, setType] = useState("");
  const [funding, setFunding] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [featured, setFeatured] = useState(false);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadPrograms = async () => {
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setPrograms(data || []);
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const resetForm = () => {
    setTitle("");
    setCountry("");
    setType("");
    setFunding("");
    setDeadline("");
    setDescription("");
    setOfficialUrl("");
    setImageUrl("");
    setFeatured(false);
    setEditingId(null);
  };

  const addProgram = async () => {
    if (!title.trim()) {
  alert("Title is required.");
  return;
}

if (!type.trim()) {
  alert("Type is required.");
  return;
}

if (!country.trim()) {
  alert("Country is required.");
  return;
}
    setLoading(true);

    const { error } = await supabase.from("programs").insert([
      {
        title,
        slug: generateSlug(title),
        country,
        type,
        funding_type: funding,
        deadline,
        official_url: officialUrl,
        image_url: imageUrl,
        description,
        verification_status: "verified",
        featured,
      },
    ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      console.log(error);
      return;
    }

    alert("Program added!");
    resetForm();
    loadPrograms();
  };

  const updateProgram = async () => {
    if (!title.trim()) {
  alert("Title is required.");
  return;
}

if (!type.trim()) {
  alert("Type is required.");
  return;
}

if (!country.trim()) {
  alert("Country is required.");
  return;
}

    setLoading(true);

    const { error } = await supabase
      .from("programs")
      .update({
        title,
        slug: generateSlug(title),
        country,
        type,
        funding_type: funding,
        deadline,
        image_url: imageUrl,
        description,
        official_url: officialUrl,
        featured,
      })
      .eq("id", editingId);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Program updated!");
    resetForm();
    loadPrograms();
  };

  const deleteProgram = async (id: string) => {
    const confirmDelete = window.confirm("Delete this program?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("programs").delete().eq("id", id);

    if (error) {
      alert(error.message);
      console.log(error);
      return;
    }

    alert("Program deleted!");
    loadPrograms();
  };

  const startEdit = (program: Program) => {
    setEditingId(program.id);
    setTitle(program.title || "");
    setCountry(program.country || "");
    setType(program.type || "");
    setFunding(program.funding_type || "");
    setDeadline(program.deadline || "");
    setOfficialUrl(program.official_url || "");
    setImageUrl(program.image_url || "");
    setDescription(program.description || "");
    setFeatured(Boolean(program.featured));
  };

const filteredPrograms = programs.filter((program) => {
  const query = search.trim().toLowerCase();

  if (!query) return true;

  return (
    (program.title || "").toLowerCase().includes(query) ||
    (program.country || "").toLowerCase().includes(query) ||
    (program.type || "").toLowerCase().includes(query) ||
    (program.funding_type || "").toLowerCase().includes(query)
  );
});

  return (
    <main style={{ padding: 40, fontFamily: "Arial" }}>
      <h1 style={{ marginBottom: 20 }}>Admin Dashboard</h1>
      <p style={{ color: "#666", marginTop: 0, marginBottom: 24 }}>
  Add, edit, and manage TripDoc opportunities from one place.
</p>
<div
  style={{
    display: "grid",
    gap: 12,
    maxWidth: 700,
    marginBottom: 40,
    border: "1px solid #ddd",
    borderRadius: 14,
    padding: 24,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  }}
>
  <h2 style={{ marginTop: 0, marginBottom: 8 }}>
    {editingId ? "Edit Opportunity" : "Add New Opportunity"}
  </h2>

  <p style={{ color: "#666", marginTop: 0, marginBottom: 16 }}>
    Fill in the details below and save the opportunity.
  </p>
  
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Funding"
          value={funding}
          onChange={(e) => setFunding(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Official URL"
          value={officialUrl}
          onChange={(e) => setOfficialUrl(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
        />

        {imageUrl && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
              Image Preview
            </div>

            <img
              src={imageUrl}
              alt="Preview"
              style={{
                width: "100%",
                maxWidth: 420,
                height: 180,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </div>
        )}

        <textarea
          placeholder="Program Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ddd",
            minHeight: 120,
            resize: "vertical",
          }}
        />

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          Featured Opportunity
        </label>

        <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={editingId ? updateProgram : addProgram}
            disabled={loading}
            style={{
              padding: "12px 16px",
              background: "black",
              color: "white",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 600,
              width: "fit-content",
              minWidth: 170,
            }}
          >
            {loading
              ? "Saving..."
              : editingId
              ? "Update Opportunity"
              : "Add Opportunity"}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              style={{
                padding: "12px 16px",
                background: "#eee",
                color: "#333",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>


<input
  placeholder="Search programs by title, country, type, or funding"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  style={{
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ddd",
    width: "100%",
    maxWidth: 500,
    marginBottom: 20,
  }}
/>

      <h2 style={{ marginBottom: 16 }}>All Programs</h2>
      <p style={{ color: "#666", marginTop: 0, marginBottom: 16 }}>
  Showing {filteredPrograms.length} of {programs.length} programs
</p>

      <div style={{ display: "grid", gap: 16 }}>
        {filteredPrograms.map((program) => (
          <div
            key={program.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 16,
              background: "#fafafa",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            {program.image_url && (
  <img
    src={program.image_url}
    alt={program.title}
    style={{
      width: "100%",
      maxWidth: 320,
      height: 160,
      objectFit: "cover",
      borderRadius: 8,
      marginBottom: 12,
      display: "block",
      border: "1px solid #eee",
    }}
  />
)}
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>{program.title}</h3>

            {program.featured && (
              <div
                style={{
                  display: "inline-block",
                  marginBottom: 10,
                  padding: "6px 10px",
                  background: "#fff4d6",
                  color: "#8a5a00",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                ⭐ Featured
              </div>
            )}

            <p>
              <strong>Country:</strong> {program.country || "—"}
            </p>
            <p>
              <strong>Type:</strong> {program.type || "—"}
            </p>
            <p>
              <strong>Funding:</strong> {program.funding_type || "—"}
            </p>
            <p>
              <strong>Deadline:</strong> {program.deadline || "—"}
            </p>

            <div
  style={{
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  }}
>
              <button
                onClick={() => deleteProgram(program.id)}
                style={{
                  padding: "10px 14px",
                  background: "#c62828",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>

              <button
                onClick={() => startEdit(program)}
                style={{
                  padding: "10px 14px",
                  background: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}