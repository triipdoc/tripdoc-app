"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type HorizontalRowProps = {
  children: ReactNode;
};

export default function HorizontalRow({ children }: HorizontalRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = rowRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scrollLeft = () => {
    rowRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    rowRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  useEffect(() => {
    updateScrollState();

    const el = rowRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [children]);

  return (
    <div
      style={{
        position: "relative",
        paddingLeft: 8,
        paddingRight: 56,
      }}
    >
      <div
        ref={rowRef}
        className="horizontal-scroll"
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          scrollBehavior: "smooth",
          padding: "4px 4px 8px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {children}
      </div>

      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          aria-label="Scroll left"
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "50%",
            width: 38,
            height: 38,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            zIndex: 2,
          }}
        >
          ←
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={scrollRight}
          aria-label="Scroll right"
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "50%",
            width: 38,
            height: 38,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            zIndex: 2,
          }}
        >
          →
        </button>
      )}
    </div>
  );
}