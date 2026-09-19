import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The admin upload route imports Sharp directly. Include its Linux native
  // binaries in the Vercel function even when this lockfile was installed on
  // another operating system.
  outputFileTracingIncludes: {
    "/api/admin/program-images": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
  async redirects() {
  return [
    {
      source: "/types/researchers/-academics",
      destination: "/types/research",
      permanent: true,
    },
  ];
},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "assets.humboldt-foundation.de", pathname: "/**" },
      { protocol: "https", hostname: "c.smartrecruiters.com", pathname: "/**" },
      { protocol: "https", hostname: "sheffield.ac.uk", pathname: "/**" },
      { protocol: "https", hostname: "uhf.microsoft.com", pathname: "/**" },
      { protocol: "https", hostname: "wto.wd103.myworkdayjobs.com", pathname: "/**" },
      { protocol: "https", hostname: "www.acu.ac.uk", pathname: "/**" },
      { protocol: "https", hostname: "www.daad.de", pathname: "/**" },
      { protocol: "https", hostname: "www.erasmuswop.org", pathname: "/**" },
      { protocol: "https", hostname: "www.eui.eu", pathname: "/**" },
      { protocol: "https", hostname: "www.fes.de", pathname: "/**" },
      { protocol: "https", hostname: "www.gov.pl", pathname: "/**" },
      { protocol: "https", hostname: "www.scoutadventures.org.uk", pathname: "/**" },
      { protocol: "https", hostname: "www.universiteitleiden.nl", pathname: "/**" },
      { protocol: "https", hostname: "www.worldbank.org", pathname: "/**" },
    ],
  },
};

export default nextConfig;
