"use client";

import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "All Opportunities" },
  { href: "/types/scholarship", label: "Scholarships" },
  { href: "/types/internship", label: "Internships" },
  { href: "/types/fellowship", label: "Fellowships" },
];

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <a
            key={item.href}
            href={item.href}
            style={{
              textDecoration: "none",
              color: isActive ? "#111" : "#444",
              padding: "8px 12px",
              borderRadius: 999,
              fontWeight: 700,
              background: isActive ? "#f2f6ff" : "transparent",
              border: isActive ? "1px solid #dbe7ff" : "1px solid transparent",
              transition: "all 0.2s ease",
            }}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}