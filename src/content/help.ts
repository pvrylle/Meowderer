import { APP_NAME } from "@/lib/brand";

export type HelpItem = {
  question: string;
  answer: string;
};

export type HelpSection = {
  id: string;
  title: string;
  items: HelpItem[];
};

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      {
        question: `How do I install ${APP_NAME} on my phone?`,
        answer: `Open ${APP_NAME} in your browser, then use your browser's Add to Home Screen option (Share menu on iOS, menu on Android). ${APP_NAME} works as a PWA with offline support for pending catches.`,
      },
      {
        question: "How do I catch a cat?",
        answer: `Tap the camera button in the bottom nav, take or upload a photo of a stray, and ${APP_NAME} will create a sticker for your collection. Add an optional nickname and location before saving.`,
      },
      {
        question: "What are the collection filters?",
        answer:
          "Filter your collection by rarity, coat type, or whether you've seen a cat before. Use the tabs on the Home screen to browse All, Helped, or Rescued cats.",
      },
    ],
  },
  {
    id: "location",
    title: "Location & privacy",
    items: [
      {
        question: "Is GPS required?",
        answer:
          "No. Location is optional and off by default unless you enable 'Tag location by default' in Settings. Each catch can still be saved without coordinates.",
      },
      {
        question: "Who can see my location?",
        answer:
          "Catch locations are private to your account unless you share a catch card or community post with location enabled. Shared locations may be rounded for privacy.",
      },
      {
        question: `What data does ${APP_NAME} store?`,
        answer:
          "Photos, stickers, optional GPS, place names, community posts, and account info. See the Privacy Policy for full details.",
      },
    ],
  },
  {
    id: "community",
    title: "Community",
    items: [
      {
        question: "How do posts and chat work?",
        answer:
          "Share sightings, shelter visits, and rescue updates in the Community feed. Real-time chat is available in the Community tab. Be kind and accurate—false rescue alerts harm real animals.",
      },
      {
        question: "How do I report a post?",
        answer:
          "Tap Report on any post to email our team with the post ID. We review reports manually in this version.",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      {
        question: "How do I sign up or sign in?",
        answer:
          "Use email and password on the auth screen. After onboarding, you'll land on Sign up by default.",
      },
      {
        question: "I forgot my password.",
        answer:
          "On the sign-in screen, tap Forgot password? and enter your email. Follow the link in the reset email to choose a new password.",
      },
      {
        question: "How do I delete my account?",
        answer:
          "Go to Settings → Account → Delete account. This removes your profile, catches, and community content. This action cannot be undone.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    items: [
      {
        question: "The camera won't open.",
        answer: `Allow camera permission in your browser or device settings, then reload ${APP_NAME}. On iOS, use Safari for best PWA support.`,
      },
      {
        question: "My offline catches didn't sync.",
        answer:
          "Open Settings and tap Sync now when you're back online. Pending catches show an orange count in Storage.",
      },
      {
        question: "Upload failed.",
        answer:
          "Check your connection and try again. Large photos may take longer. If the problem persists, contact support with the time of the failure.",
      },
    ],
  },
];

export const SUPPORT_EMAIL = "support@meowderer.app";
