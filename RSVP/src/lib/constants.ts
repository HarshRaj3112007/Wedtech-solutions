// ─────────────────────────────────────────────────────────────
// Application-wide constants
// ─────────────────────────────────────────────────────────────

/** Default timezone for Indian weddings */
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

/** Supported invite themes */
export const INVITE_THEMES = [
  { value: "FLORAL", label: "Floral", description: "Delicate flowers and botanical elements" },
  { value: "ROYAL", label: "Royal", description: "Regal motifs with gold accents" },
  { value: "MINIMAL", label: "Minimal", description: "Clean, modern typography-forward design" },
  { value: "BOHO", label: "Boho", description: "Bohemian, earthy, and free-spirited" },
  { value: "TRADITIONAL", label: "Traditional", description: "Classic Indian wedding patterns" },
] as const;

/** Supported languages for invites */
export const INVITE_LANGUAGES = [
  { value: "ENGLISH", label: "English" },
  { value: "HINDI", label: "हिन्दी" },
  { value: "TAMIL", label: "தமிழ்" },
  { value: "TELUGU", label: "తెలుగు" },
  { value: "BENGALI", label: "বাংলা" },
  { value: "MARATHI", label: "मराठी" },
  { value: "GUJARATI", label: "ગુજરાતી" },
  { value: "KANNADA", label: "ಕನ್ನಡ" },
  { value: "PUNJABI", label: "ਪੰਜਾਬੀ" },
] as const;

/** Dietary preference labels for display */
export const DIETARY_LABELS: Record<string, string> = {
  VEG: "Vegetarian",
  NON_VEG: "Non-Vegetarian",
  JAIN: "Jain",
  VEGAN: "Vegan",
  CUSTOM: "Custom / Other",
};

/** RSVP status labels */
export const RSVP_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ATTENDING: "Attending",
  DECLINED: "Declined",
};

/** Relationship side labels */
export const RELATIONSHIP_SIDE_LABELS: Record<string, string> = {
  BRIDE: "Bride's side",
  GROOM: "Groom's side",
  MUTUAL: "Mutual",
};

/** Common Indian wedding events with suggested icons */
export const COMMON_EVENT_PRESETS = [
  { name: "Mehendi", icon: "✋", dressCode: "Ethnic / Casual" },
  { name: "Haldi", icon: "🌼", dressCode: "Yellow theme" },
  { name: "Sangeet", icon: "🎶", dressCode: "Festive / Semi-Formal" },
  { name: "Baraat", icon: "🐎", dressCode: "Traditional" },
  { name: "Pheras", icon: "🔥", dressCode: "Traditional formal" },
  { name: "Reception", icon: "🥂", dressCode: "Formal / Black tie" },
  { name: "Cocktail Party", icon: "🍸", dressCode: "Semi-Formal / Western" },
  { name: "Pool Party", icon: "🏊", dressCode: "Resort casual" },
] as const;

/** Rate limit for CRM API: requests per minute */
export const CRM_API_RATE_LIMIT = 100;

/** Default pagination size — all queries beyond 50 records must be paginated */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/** Reminder auto-stop: days before event to halt reminders */
export const REMINDER_CUTOFF_HOURS = 48;

/** Maximum file upload sizes */
export const MAX_CSV_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_PHOTO_UPLOAD_SIZE_MB = 15;
