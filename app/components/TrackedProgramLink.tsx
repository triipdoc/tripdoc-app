"use client";

import { useState } from "react";

type TrackedProgramLinkProps = {
  href: string;
  programId: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export default function TrackedProgramLink({
  href,
  programId,
  children,
  style,
  className,
}: TrackedProgramLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  async function trackOpenDetail() {
    try {
      const res = await fetch("/api/track-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        body: JSON.stringify({
          program_id: programId,
          action: "open_detail",
        }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        console.error("Open detail tracking failed:", result || res.statusText);
      }
    } catch (error) {
      console.error("Open detail tracking error:", error);
    }
  }

  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={async (e) => {
        if (!programId || isNavigating) return;

        const isModifiedClick =
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

        if (isModifiedClick) {
          trackOpenDetail();
          return;
        }

        e.preventDefault();
        setIsNavigating(true);
        await trackOpenDetail();
        window.location.href = href;
      }}
    >
      {children}
    </a>
  );
}