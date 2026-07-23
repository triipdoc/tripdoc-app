export const socialLinks = {
  instagram: {
    name: "Instagram",
    label: "Follow TripDoc on Instagram",
    handle: "@triip_doc",
    href: "https://www.instagram.com/triip_doc/",
    icon: "instagram",
  },
  tiktok: {
    name: "TikTok",
    label: "Follow TripDoc on TikTok",
    handle: "@tripdocofficial",
    href: "https://www.tiktok.com/@tripdocofficial",
    icon: "tiktok",
  },
  youtube: {
    name: "YouTube",
    label: "Subscribe to TripDoc on YouTube",
    handle: "Trip_Doc",
    href: "https://www.youtube.com/@Trip_Doc",
    icon: "youtube",
  },
  facebook: {
    name: "Facebook",
    label: "Follow TripDoc on Facebook",
    handle: "facebook.com/trippdoc",
    href: "https://www.facebook.com/trippdoc",
    icon: "facebook",
  },
  x: {
    name: "X",
    label: "Follow TripDoc on X",
    handle: "Triip_Doc",
    href: "https://x.com/Triip_Doc",
    icon: "x",
  },
} as const;

export const socialLinkItems = Object.values(socialLinks);

export type SocialIconName = (typeof socialLinkItems)[number]["icon"];
