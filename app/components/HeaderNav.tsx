"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

const opportunitiesItems = [
  { href: "/programs", label: "All Opportunities" },
  { href: "/types/scholarship", label: "Scholarships" },
  { href: "/types/internship", label: "Internships" },
  { href: "/types/fellowship", label: "Fellowships" },
  { href: "/volunteer-screening", label: "Volunteer Screening" },
];

const primaryItems = [
  { href: "/", label: "Home" },
  { href: "/hiring-companies", label: "Hiring Companies" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HeaderNav() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const desktopButtonRef = useRef<HTMLButtonElement>(null);
  const desktopItemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileOpportunitiesOpen, setIsMobileOpportunitiesOpen] =
    useState(false);

  const isOpportunitiesActive = opportunitiesItems.some((item) =>
    isActivePath(pathname, item.href)
  );

  function closeMenus() {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileOpportunitiesOpen(false);
  }

  function focusDesktopItem(index: number) {
    const item = desktopItemRefs.current[index];
    if (item) item.focus();
  }

  function handleDesktopButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsDropdownOpen(true);
      window.setTimeout(() => focusDesktopItem(0), 0);
    }
  }

  function handleDropdownItemKeyDown(
    event: KeyboardEvent<HTMLAnchorElement>,
    index: number
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsDropdownOpen(false);
      desktopButtonRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusDesktopItem((index + 1) % opportunitiesItems.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusDesktopItem(
        index === 0 ? opportunitiesItems.length - 1 : index - 1
      );
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusDesktopItem(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusDesktopItem(opportunitiesItems.length - 1);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenus();
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="headerNavRoot">
      <nav className="desktopNav" aria-label="Primary navigation">
        <Link
          href="/"
          className={`navItem ${isActivePath(pathname, "/") ? "active" : ""}`}
          onClick={closeMenus}
        >
          Home
        </Link>

        <div className="dropdownShell">
          <button
            ref={desktopButtonRef}
            type="button"
            className={`navItem navButton ${
              isOpportunitiesActive ? "active" : ""
            }`}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            aria-controls="opportunities-dropdown"
            onClick={() => setIsDropdownOpen((current) => !current)}
            onKeyDown={handleDesktopButtonKeyDown}
          >
            <span>Opportunities</span>
            <span
              className={`chevron ${isDropdownOpen ? "chevronOpen" : ""}`}
              aria-hidden="true"
            />
          </button>

          {isDropdownOpen && (
            <div
              id="opportunities-dropdown"
              className="dropdownPanel"
              role="menu"
              aria-label="Opportunities"
            >
              {opportunitiesItems.map((item, index) => (
                <Link
                  key={item.href}
                  ref={(node) => {
                    desktopItemRefs.current[index] = node;
                  }}
                  href={item.href}
                  role="menuitem"
                  className={`dropdownLink ${
                    isActivePath(pathname, item.href) ? "activeDropdownLink" : ""
                  }`}
                  onClick={closeMenus}
                  onKeyDown={(event) => handleDropdownItemKeyDown(event, index)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/hiring-companies"
          className={`navItem ${
            isActivePath(pathname, "/hiring-companies") ? "active" : ""
          }`}
          onClick={closeMenus}
        >
          Hiring Companies
        </Link>
      </nav>

      <div className="mobileNav">
        <button
          type="button"
          className="navItem navButton mobileMenuButton"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          <span>Menu</span>
          <span
            className={`chevron ${isMobileMenuOpen ? "chevronOpen" : ""}`}
            aria-hidden="true"
          />
        </button>

        {isMobileMenuOpen && (
          <nav
            id="mobile-navigation"
            className="mobilePanel"
            aria-label="Mobile navigation"
          >
            <Link
              href="/"
              className={`mobileLink ${
                isActivePath(pathname, "/") ? "activeMobileLink" : ""
              }`}
              onClick={closeMenus}
            >
              Home
            </Link>

            <button
              type="button"
              className={`mobileLink mobileSectionButton ${
                isOpportunitiesActive ? "activeMobileLink" : ""
              }`}
              aria-expanded={isMobileOpportunitiesOpen}
              aria-controls="mobile-opportunities"
              onClick={() =>
                setIsMobileOpportunitiesOpen((current) => !current)
              }
            >
              <span>Opportunities</span>
              <span
                className={`chevron ${
                  isMobileOpportunitiesOpen ? "chevronOpen" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {isMobileOpportunitiesOpen && (
              <div id="mobile-opportunities" className="mobileSubmenu">
                {opportunitiesItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobileSubLink ${
                      isActivePath(pathname, item.href)
                        ? "activeMobileSubLink"
                        : ""
                    }`}
                    onClick={closeMenus}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/hiring-companies"
              className={`mobileLink ${
                isActivePath(pathname, "/hiring-companies")
                  ? "activeMobileLink"
                  : ""
              }`}
              onClick={closeMenus}
            >
              Hiring Companies
            </Link>
          </nav>
        )}
      </div>

      <style jsx>{`
        .headerNavRoot {
          max-width: 100%;
          min-width: 0;
          position: relative;
        }

        .desktopNav {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
          max-width: 100%;
          min-width: 0;
        }

        .dropdownShell {
          position: relative;
        }

        .navItem {
          align-items: center;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 999px;
          color: #444;
          display: inline-flex;
          font: inherit;
          font-weight: 700;
          gap: 8px;
          line-height: 1.2;
          padding: 8px 12px;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .navItem:hover,
        .navItem:focus-visible {
          background: #f8fbff;
          border-color: #dbe7ff;
          color: #111;
        }

        .navItem:focus-visible,
        .dropdownLink:focus-visible,
        .mobileLink:focus-visible,
        .mobileSubLink:focus-visible {
          outline: 2px solid #2952d5;
          outline-offset: 3px;
        }

        .navButton {
          cursor: pointer;
        }

        .active {
          background: #f2f6ff;
          border-color: #dbe7ff;
          color: #111;
        }

        .chevron {
          border-bottom: 2px solid currentColor;
          border-right: 2px solid currentColor;
          display: inline-block;
          height: 7px;
          margin-top: -3px;
          transform: rotate(45deg);
          transition: transform 0.2s ease;
          width: 7px;
        }

        .chevronOpen {
          margin-top: 2px;
          transform: rotate(225deg);
        }

        .dropdownPanel {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 18px 45px rgba(16, 32, 51, 0.14);
          display: grid;
          gap: 4px;
          min-width: 250px;
          padding: 8px;
          position: absolute;
          right: 0;
          top: calc(100% + 10px);
          z-index: 250;
        }

        .dropdownLink {
          border-radius: 8px;
          color: #374151;
          font-size: 14px;
          font-weight: 700;
          padding: 11px 12px;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .dropdownLink:hover,
        .activeDropdownLink {
          background: #f2f6ff;
          color: #111;
        }

        .mobileNav {
          display: none;
        }

        @media (max-width: 760px) {
          .headerNavRoot {
            width: 100%;
          }

          .desktopNav {
            display: none;
          }

          .mobileNav {
            display: grid;
            justify-items: end;
            position: relative;
            width: 100%;
          }

          .mobileMenuButton {
            justify-self: end;
          }

          .mobilePanel {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 14px 34px rgba(16, 32, 51, 0.12);
            display: grid;
            gap: 6px;
            margin-top: 10px;
            max-width: 100%;
            padding: 10px;
            width: min(100%, 360px);
          }

          .mobileLink,
          .mobileSubLink {
            border-radius: 8px;
            color: #374151;
            font-weight: 700;
            padding: 11px 12px;
            text-align: left;
            text-decoration: none;
            transition: all 0.2s ease;
            width: 100%;
          }

          .mobileSectionButton {
            align-items: center;
            background: transparent;
            border: 0;
            cursor: pointer;
            display: flex;
            font: inherit;
            justify-content: space-between;
          }

          .mobileLink:hover,
          .mobileSubLink:hover,
          .activeMobileLink,
          .activeMobileSubLink {
            background: #f2f6ff;
            color: #111;
          }

          .mobileSubmenu {
            border-left: 2px solid #dbe7ff;
            display: grid;
            gap: 4px;
            margin: 0 0 4px 10px;
            padding-left: 8px;
          }

          .mobileSubLink {
            font-size: 14px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
}
