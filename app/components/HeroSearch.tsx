"use client";

import { useState } from "react";

export default function HeroSearch() {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const trimmed = query.trim();
    const target = document.getElementById("all-opportunities");

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      setTimeout(() => {
        const searchInput = document.getElementById(
          "main-search"
        ) as HTMLInputElement | null;

        if (searchInput) {
          searchInput.focus();
        }
      }, 400);
    }

    if (trimmed) {
      const url = new URL(window.location.href);
      url.searchParams.set("q", trimmed);
      window.history.replaceState({}, "", url.toString());
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 24,
        maxWidth: 820,
        alignItems: "center",
      }}
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
        }}
        placeholder="Search scholarships, internships, countries, funding..."
        style={{
          flex: 1,
          minWidth: 280,
          padding: "16px 18px",
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          background: "white",
          fontSize: 16,
          outline: "none",
          boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
        }}
      />

      <button
        type="button"
        onClick={handleSearch}
        style={{
          padding: "16px 22px",
          borderRadius: 14,
          border: "none",
          background: "#111",
          color: "white",
          fontWeight: 700,
          fontSize: 16,
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
          minWidth: 110,
        }}
      >
        Search
      </button>
    </div>
  );
}