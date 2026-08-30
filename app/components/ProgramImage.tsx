import Image from "next/image";
import type { CSSProperties } from "react";

const optimizedExternalHosts = new Set([
  "assets.humboldt-foundation.de",
  "c.smartrecruiters.com",
  "sheffield.ac.uk",
  "uhf.microsoft.com",
  "wto.wd103.myworkdayjobs.com",
  "www.acu.ac.uk",
  "www.daad.de",
  "www.erasmuswop.org",
  "www.eui.eu",
  "www.fes.de",
  "www.gov.pl",
  "www.scoutadventures.org.uk",
  "www.universiteitleiden.nl",
  "www.worldbank.org",
]);

type ProgramImageProps = {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  borderRadius?: number;
  marginBottom?: number;
  style?: CSSProperties;
  placeholderStyle?: CSSProperties;
};

function canUseNextImage(src: string) {
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    const isPublicSupabaseStorage =
      url.protocol === "https:" &&
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.startsWith("/storage/v1/object/public/");

    return isPublicSupabaseStorage || optimizedExternalHosts.has(url.hostname);
  } catch {
    return false;
  }
}

export default function ProgramImage({
  src,
  alt,
  width = 640,
  height = 360,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 360px",
  priority = false,
  borderRadius = 12,
  marginBottom = 14,
  style,
  placeholderStyle,
}: ProgramImageProps) {
  const imageStyle: CSSProperties = {
    width: "100%",
    height,
    aspectRatio: `${width} / ${height}`,
    objectFit: "cover",
    borderRadius,
    marginBottom,
    display: "block",
    ...style,
  };

  if (!src) {
    return (
      <div
        style={{
          width: "100%",
          height,
          aspectRatio: `${width} / ${height}`,
          borderRadius,
          marginBottom,
          background: "#f1f1f1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#777",
          fontSize: 14,
          fontWeight: 600,
          border: "1px solid #e5e5e5",
          ...placeholderStyle,
        }}
      >
        No image available
      </div>
    );
  }

  if (!canUseNextImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        style={imageStyle}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      style={imageStyle}
    />
  );
}
