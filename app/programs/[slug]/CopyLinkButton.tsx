"use client";

import { useState } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #ddd",
        cursor: "pointer",
        background: copied ? "#eaffea" : "white",
        fontWeight: 600,
        transition: "all 0.2s ease",
      }}
    >
      {copied ? "Copied ✓" : "Copy Link"}
    </button>
  );
}