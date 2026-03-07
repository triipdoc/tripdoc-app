"use client";

export default function CopyLinkButton() {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied!");
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #ddd",
        cursor: "pointer",
        background: "white",
      }}
    >
      Copy Link
    </button>
  );
}