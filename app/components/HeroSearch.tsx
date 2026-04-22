"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
} from "../../lib/searchHistory";
import { TRENDING_SEARCHES } from "../../lib/trendingSearches";

type Suggestion = {
  id: string;
  title: string;
  slug?: string | null;
  country?: string | null;
  type?: string | null;
};

type NavItem =
  | { kind: "recent"; value: string }
  | { kind: "trending"; value: string }
  | { kind: "suggestion"; value: Suggestion }
  | { kind: "search"; value: string };

export default function HeroSearch() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const showDropdown = focused;
  const trimmedQuery = query.trim();
  const isEmpty = trimmedQuery.length === 0;

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setFocused(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!trimmedQuery) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchSuggestions = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/search-suggestions?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("Failed to fetch suggestions");

        const data = await res.json();
        setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, focused, suggestions]);

  const emptyStateItems: { recent: string[]; trending: string[] } = useMemo(() => {
    return {
      recent: recentSearches,
      trending: TRENDING_SEARCHES,
    };
  }, [recentSearches]);

  const navItems: NavItem[] = useMemo(() => {
    if (isEmpty) {
      return [
        ...emptyStateItems.recent.map((item) => ({ kind: "recent", value: item } as const)),
        ...emptyStateItems.trending.map((item) => ({ kind: "trending", value: item } as const)),
      ];
    }

    if (suggestions.length > 0) {
      return suggestions.map((item) => ({ kind: "suggestion", value: item } as const));
    }

    if (!loading && trimmedQuery) {
      return [{ kind: "search", value: trimmedQuery }];
    }

    return [];
  }, [isEmpty, emptyStateItems, suggestions, loading, trimmedQuery]);

  function goToSearch(value: string) {
    const finalValue = value.trim();
    if (!finalValue) return;

    saveRecentSearch(finalValue);
    setRecentSearches(getRecentSearches());
    setFocused(false);
    setActiveIndex(-1);
    router.push(`/programs?q=${encodeURIComponent(finalValue)}`);
  }

  function goToProgram(item: Suggestion) {
    saveRecentSearch(item.title);
    setRecentSearches(getRecentSearches());
    setFocused(false);
    setActiveIndex(-1);
    router.push(`/programs/${item.slug}`);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (activeIndex >= 0 && navItems[activeIndex]) {
      selectNavItem(navItems[activeIndex]);
      return;
    }

    goToSearch(query);
  }

  function handleSuggestionClick(item: Suggestion) {
    if (item.slug) {
      goToProgram(item);
      return;
    }

    goToSearch(item.title);
  }

  function handleRecentClick(value: string) {
    setQuery(value);
    goToSearch(value);
  }

  function handleTrendingClick(value: string) {
    setQuery(value);
    goToSearch(value);
  }

  function selectNavItem(item: NavItem) {
    if (item.kind === "recent") {
      handleRecentClick(item.value);
      return;
    }

    if (item.kind === "trending") {
      handleTrendingClick(item.value);
      return;
    }

    if (item.kind === "suggestion") {
      handleSuggestionClick(item.value);
      return;
    }

    goToSearch(item.value);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (navItems.length === 0) return;
      setActiveIndex((prev) => (prev < navItems.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (navItems.length === 0) return;
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : navItems.length - 1));
      return;
    }

    if (e.key === "Escape") {
      setFocused(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === "Enter" && activeIndex >= 0 && navItems[activeIndex]) {
      e.preventDefault();
      selectNavItem(navItems[activeIndex]);
    }
  }

  function getItemStyle(index: number): CSSProperties {
    const isActive = index === activeIndex;

    return {
      ...dropdownItemStyle,
      background: isActive ? "#f3f4f6" : "transparent",
    };
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        maxWidth: 880,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#ffffff",
            border: focused ? "1px solid #93c5fd" : "1px solid rgba(255,255,255,0.35)",
            borderRadius: 8,
            boxShadow: focused
              ? "0 10px 28px rgba(37,99,235,0.16)"
              : "0 6px 18px rgba(0,0,0,0.10)",
            padding: "4px 5px 4px 12px",
            minHeight: 54,
            transition: "all 0.2s ease",
          }}
        >
          <span
            style={{
              fontSize: 17,
              opacity: 0.5,
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            🔍
          </span>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search programs, scholarships, universities, or keywords..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 14,
              padding: "8px 0",
              background: "transparent",
              color: "#111827",
              minWidth: 0,
            }}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setActiveIndex(-1);
              }}
              aria-label="Clear search"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 15,
                opacity: 0.5,
                padding: "4px 6px",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          )}

          <button
            type="submit"
            style={{
              border: "none",
              background: "#2563eb",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 7,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              flexShrink: 0,
              minWidth: 86,
              boxShadow: "0 4px 12px rgba(37,99,235,0.18)",
            }}
          >
            Search
          </button>
        </div>
      </form>

      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            boxShadow: "0 20px 40px rgba(0,0,0,0.14)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              maxHeight: 320,
              overflowY: "auto",
              padding: 12,
            }}
          >
            {isEmpty ? (
              emptyStateItems.recent.length === 0 && emptyStateItems.trending.length === 0 ? (
                <div
                  style={{
                    padding: "20px 12px",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  No recent searches yet.
                </div>
              ) : (
                <div>
                  {emptyStateItems.recent.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                          padding: "0 4px",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: 12,
                            letterSpacing: 0.4,
                            textTransform: "uppercase",
                            color: "#6b7280",
                            fontWeight: 700,
                          }}
                        >
                          Recent searches
                        </h4>

                        <button
                          type="button"
                          onClick={() => {
                            clearRecentSearches();
                            setRecentSearches([]);
                            setActiveIndex(-1);
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#2563eb",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Clear
                        </button>
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        {emptyStateItems.recent.map((item: string, index: number) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleRecentClick(item)}
                            style={getItemStyle(index)}
                          >
                            <span>🕘</span>
                            <span>{item}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {emptyStateItems.trending.length > 0 && (
                    <div>
                      <h4
                        style={{
                          margin: "0 0 10px 0",
                          padding: "0 4px",
                          fontSize: 12,
                          letterSpacing: 0.4,
                          textTransform: "uppercase",
                          color: "#6b7280",
                          fontWeight: 700,
                        }}
                      >
                        Trending
                      </h4>

                      <div style={{ display: "grid", gap: 6 }}>
                        {emptyStateItems.trending.map((item: string, index: number) => {
                          const realIndex = emptyStateItems.recent.length + index;

                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleTrendingClick(item)}
                              style={getItemStyle(realIndex)}
                            >
                              <span>🔥</span>
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : loading ? (
              <div
                style={{
                  padding: "18px 12px",
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                Searching...
              </div>
            ) : suggestions.length > 0 ? (
              <div style={{ display: "grid", gap: 6 }}>
                {suggestions.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSuggestionClick(item)}
                    style={getItemStyle(index)}
                  >
                    <span>🔎</span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        {[item.country, item.type].filter(Boolean).join(" • ")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: 4 }}>
                <button
                  type="button"
                  onClick={() => goToSearch(trimmedQuery)}
                  style={getItemStyle(0)}
                >
                  <span>🔍</span>
                  <span>Search for “{trimmedQuery}”</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const dropdownItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "12px 14px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  borderRadius: 12,
  fontSize: 15,
  transition: "all 0.15s ease",
  textAlign: "left",
};