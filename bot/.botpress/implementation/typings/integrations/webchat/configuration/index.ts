/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Configuration = {
  /** The JWT public key used to verify tokens. When specified, userData and attributes in createUser and updateUser should be signed JWT tokens. */
  jwtPublicKey?: string;
  /** The secret key required to manage users */
  adminSecret?: string;
  version?: string;
  botDisplayName?: string;
  botAvatarUrl?: string;
  botDescription?: string;
  fabImage?: string;
  descriptionPhoneNumber?: { title?: string; link?: string };
  descriptionEmailAddress?: { title?: string; link?: string };
  descriptionWebsiteUrl?: { title?: string; link?: string };
  termsConditionsUrl?: { title?: string; link?: string };
  privacyPolicyUrl?: { title?: string; link?: string };
  botComposerPlaceholder?: string;
  showPoweredByBotpress?: boolean;
  additionalStylesheet?: string;
  additionalStylesheetUrl?: string;
  allowedOrigins?: string[];
  primaryColor?: string;
  borderRadiusScale?: number;
  themeMode?: "light" | "dark";
  variant?: "solid" | "soft";
  headerVariant?: "solid" | "glass";
  fontFamily?: string;
  feedbackEnabled?: boolean;
  showPoweredBy?: boolean;
  footer?: string;
  allowFileUpload?: boolean;
  storageLocation?: "sessionStorage" | "localStorage";
  soundEnabled?: boolean;
  toggleChatId?: string;
  embeddedChatId?: string;
  proactiveMessageEnabled?: boolean;
  proactiveBubbleMessage?: string;
  proactiveBubbleTriggerType?: "afterDelay" | "userIdle";
  proactiveBubbleDelayTime?: number;
  conversationHistory?: boolean;
  _debug?: boolean;
};
