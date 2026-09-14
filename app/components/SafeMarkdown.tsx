import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeMarkdownUrl } from "../../lib/opportunityPrograms";

type SafeMarkdownProps = {
  content?: string | null;
};

const headingStyle = {
  margin: "22px 0 10px",
  fontWeight: 800,
  color: "#111",
  lineHeight: 1.3,
} as const;

export default function SafeMarkdown({ content }: SafeMarkdownProps) {
  const cleanContent = content?.trim();

  if (!cleanContent) {
    return null;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      urlTransform={safeMarkdownUrl}
      allowedElements={[
        "p",
        "strong",
        "em",
        "a",
        "ul",
        "ol",
        "li",
        "h2",
        "h3",
        "h4",
        "blockquote",
        "code",
        "br",
      ]}
      components={{
        h2: ({ children }) => (
          <h2 style={{ ...headingStyle, fontSize: 24 }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 style={{ ...headingStyle, fontSize: 20 }}>{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 style={{ ...headingStyle, fontSize: 18 }}>{children}</h4>
        ),
        p: ({ children }) => (
          <p style={{ margin: "0 0 14px", lineHeight: 1.8, color: "#333" }}>
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul style={{ margin: "0 0 16px", paddingLeft: 24, lineHeight: 1.8 }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol style={{ margin: "0 0 16px", paddingLeft: 24, lineHeight: 1.8 }}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li style={{ marginBottom: 8, color: "#333" }}>{children}</li>
        ),
        a: ({ href, children }) => {
          const safeHref = href ? safeMarkdownUrl(href) : "";

          if (!safeHref) {
            return <span>{children}</span>;
          }

          const isExternal =
            safeHref.startsWith("http://") || safeHref.startsWith("https://");

          return (
            <a
              href={safeHref}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              style={{
                color: "#0070f3",
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {children}
            </a>
          );
        },
        blockquote: ({ children }) => (
          <blockquote
            style={{
              margin: "0 0 16px",
              padding: "12px 16px",
              borderLeft: "4px solid #bfdbfe",
              background: "#f8fbff",
              color: "#1f2937",
              borderRadius: 8,
            }}
          >
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code
            style={{
              background: "#f3f4f6",
              borderRadius: 6,
              padding: "2px 5px",
              fontSize: 14,
            }}
          >
            {children}
          </code>
        ),
      }}
    >
      {cleanContent}
    </ReactMarkdown>
  );
}
