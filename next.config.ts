import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
