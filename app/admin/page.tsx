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
  const [description, setDescription] = useState("")
  const [officialUrl, setOfficialUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  <textarea
  placeholder="Program Description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  style={{
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ddd",
    minHeight: 120,
    resize: "vertical"
  }}
/>
  const [programs, setPrograms] = useState<Program[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false);
  

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

  const addProgram = async () => {
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
      },
    ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      console.log(error);
      return;
    }

    alert("Program added!");

    setTitle("");
    setCountry("");
    setType("");
    setFunding("");
    setDeadline("");
    setOfficialUrl("");
    setImageUrl("")
    setDescription("")

    loadPrograms();
  };

  const updateProgram = async () => {

  if (!editingId) return

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
      official_url: officialUrl
      
      
    })
    .eq("id", editingId)

  if (error) {
    alert(error.message)
    return
  }

  alert("Program updated!")

  setEditingId(null)

  setTitle("")
  setCountry("")
  setType("")
  setFunding("")
  setDeadline("")
  setDescription("")
  setOfficialUrl("")
  

  loadPrograms()
}

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

  setEditingId(program.id)

  setTitle(program.title || "")
  setCountry(program.country || "")
  setType(program.type || "")
  setFunding(program.funding_type || "")
  setDeadline(program.deadline || "")
  setOfficialUrl(program.official_url || "")
  setImageUrl(program.image_url || "")
  setDescription(program.description || "")
  
  
}

  return (
    <main style={{ padding: 40, fontFamily: "Arial" }}>
      <h1 style={{ marginBottom: 20 }}>Admin Dashboard</h1>

      <div
        style={{
          display: "grid",
          gap: 12,
          maxWidth: 500,
          marginBottom: 40,
        }}
      >
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

        <textarea
  placeholder="Program Description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  style={{
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ddd",
    minHeight: 120,
    resize: "vertical"
  }}
/>

    <div style={{ marginTop: 8 }}>
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
      minWidth: 180,
    }}
  >
    {loading
      ? "Saving..."
      : editingId
      ? "Update Opportunity"
      : "Save Opportunity"}
  </button>
</div>
      </div>

      <h2 style={{ marginBottom: 16 }}>All Programs</h2>

      <div style={{ display: "grid", gap: 16 }}>
        {programs.map((program) => (
          <div
            key={program.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 16,
              background: "#fafafa",
            }}
          >
            <h3 style={{ marginTop: 0 }}>{program.title}</h3>
            <p><strong>Country:</strong> {program.country || "—"}</p>
            <p><strong>Type:</strong> {program.type || "—"}</p>
            <p><strong>Funding:</strong> {program.funding_type || "—"}</p>
            <p><strong>Deadline:</strong> {program.deadline || "—"}</p>

            <button
              onClick={() => deleteProgram(program.id)}
              style={{
                marginTop: 10,
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
    marginLeft: 10,
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
        ))}
      </div>
    </main>
  );
}