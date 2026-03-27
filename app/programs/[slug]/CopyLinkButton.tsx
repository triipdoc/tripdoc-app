"use client";

import { useState } from "react";

type CopyLinkButtonProps = {
  programId: string;
  title: string;
};

export default function CopyLinkButton({
  programId,
  title,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function trackCopyClick() {
    try {
      const res = await fetch("/api/track-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        body: JSON.stringify({
          program_id: programId,
          action: "copy_link",
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Copy tracking API error:", result || res.statusText);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Copy tracking failed:", err);
      return false;
    }
  }

  const handleCopy = async () => {
    try {
      if (!programId) return;

      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      await trackCopyClick();

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