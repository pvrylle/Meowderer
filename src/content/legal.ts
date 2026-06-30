import { APP_NAME } from "@/lib/brand";

import { SUPPORT_EMAIL } from "@/content/help";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "Acceptance",
    paragraphs: [
      `By creating a ${APP_NAME} account or using the app, you agree to these Terms of Service. If you do not agree, do not use ${APP_NAME}.`,
      `${APP_NAME} is intended for users aged 13 and older. If you are under 13, you may not create an account without verifiable parental consent.`,
    ],
  },
  {
    title: "Your account",
    paragraphs: [
      "You are responsible for keeping your login credentials secure and for activity under your account.",
      "You may delete your account at any time from Settings. Deletion removes your profile, catches, and community content subject to our data retention practices described in the Privacy Policy.",
    ],
  },
  {
    title: "User content",
    paragraphs: [
      `You retain ownership of photos, stickers, posts, chat messages, and other content you upload. By posting content, you grant ${APP_NAME} a non-exclusive license to store, display, and process that content solely to operate the service.`,
      "Do not upload content you do not have the right to share. Do not harass others, post false rescue alerts, or share illegal material.",
      "We may remove content or suspend accounts that violate these rules or harm the community.",
    ],
  },
  {
    title: "Photographing cats",
    paragraphs: [
      "When photographing strays, respect private property, local laws, and the welfare of animals. Do not trespass, disturb nesting areas, or put yourself or cats at risk.",
      `${APP_NAME} is a community tool, not professional veterinary or rescue advice. For injured or distressed animals, contact local shelters or authorities.`,
    ],
  },
  {
    title: "Location data",
    paragraphs: [
      "GPS tagging is optional. Location attached to catches is private by default and only shared when you explicitly choose to share a catch card or community post with location.",
      "Shared locations may be rounded to protect privacy. See the Privacy Policy for details.",
    ],
  },
  {
    title: "Third-party services",
    paragraphs: [
      `${APP_NAME} uses Supabase (auth and database), Cloudinary (image hosting), and OpenStreetMap/Nominatim (map and place names). Your use of those services is also subject to their terms.`,
    ],
  },
  {
    title: "Disclaimer",
    paragraphs: [
      `${APP_NAME} is provided "as is" without warranties. We are not liable for indirect or consequential damages arising from your use of the app.`,
      "We may update these Terms. Continued use after changes means you accept the updated Terms.",
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "Overview",
    paragraphs: [
      `${APP_NAME} collects only what we need to run your account, store your cat collection, and power community features. This policy explains what we store and why.`,
    ],
  },
  {
    title: "Information we collect",
    paragraphs: [
      "Account: email address, password hash (via Supabase Auth), username, and avatar.",
      "Cat catches: photos, generated stickers, optional GPS coordinates, place names, nicknames, and capture timestamps.",
      "Community: posts, comments, chat messages, likes, rescue alerts, and optional post images.",
      "Device: local storage for onboarding state, offline upload queue, chat unread counts, and PWA install preferences.",
    ],
  },
  {
    title: "Location",
    paragraphs: [
      "Location is optional. When enabled, we store coordinates with your catches. By default this data is visible only to you.",
      "When you share a catch or post with location, we may round coordinates before display to reduce precision.",
      "You can turn off default GPS tagging in Settings at any time.",
    ],
  },
  {
    title: "How we use data",
    paragraphs: [
      "To authenticate you, sync your collection, show community content, calculate streaks and missions, and improve reliability of the app.",
      "We do not sell your personal data. We do not use your photos to train third-party AI models.",
    ],
  },
  {
    title: "Third parties",
    paragraphs: [
      "Supabase processes auth and database requests. Cloudinary stores your images. OpenStreetMap/Nominatim provides map tiles and reverse geocoding.",
      "Each provider processes data according to their own privacy policies and our agreements with them.",
    ],
  },
  {
    title: "Retention and deletion",
    paragraphs: [
      "We retain your data while your account is active. When you delete your account, we remove your profile and associated content from our database and request deletion of your images from Cloudinary.",
      "Some backups or logs may persist briefly for security and operations. Contact us if you need help with data export before deletion.",
    ],
  },
  {
    title: "Cookies and local storage",
    paragraphs: [
      `${APP_NAME} uses strictly necessary cookies and local storage for authentication sessions, onboarding completion, and offline sync. We do not use advertising or analytics cookies in the current version.`,
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      `Questions about privacy or to request data export: email ${SUPPORT_EMAIL}.`,
    ],
  },
];
