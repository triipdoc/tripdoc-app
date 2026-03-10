"use client";

import { ReactNode, useRef } from "react";

type HorizontalRowProps = {
  children: ReactNode;
};

export default function HorizontalRow({ children }: HorizontalRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    rowRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={rowRef} className="horizontal-scroll">
        {children}
      </div>

      <button
        onClick={scrollRight}
        aria-label="Scroll right"
        style={{
          position: "absolute",
          right: -8,
          top: "40%",
          transform: "translateY(-50%)",
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "50%",
          width: 36,
          height: 36,
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          zIndex: 2,
        }}
      >
        →
      </button>
    </div>
  );
}