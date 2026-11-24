// Rebuilt from the team's old Google Form ("Bunyan Digital – Store Onboarding") so the
// client fills it in on their own portal and the answers land straight in the CRM —
// nothing goes through Google Forms any more. Keep the section/question order and
// wording identical to the original; only the delivery mechanism changed.

export type OnboardingFieldType = "short" | "paragraph" | "single" | "multi" | "date";

export type OnboardingField = {
  key: string;
  label: string;
  type: OnboardingFieldType;
  required: boolean;
  options?: string[];
  /** Adds a free-text "Other" choice alongside the listed options. */
  otherOption?: boolean;
  placeholder?: string;
};

export type OnboardingSection = {
  title: string;
  fields: OnboardingField[];
};

export const ONBOARDING_SECTIONS: OnboardingSection[] = [
  {
    title: "About you and your business",
    fields: [
      { key: "fullName", label: "Your full name", type: "short", required: true },
      { key: "storeName", label: "Business / store name", type: "short", required: true },
      { key: "email", label: "Best email address", type: "short", required: true },
      { key: "whatsapp", label: "WhatsApp number", type: "short", required: true },
      { key: "sells", label: "In one or two sentences, what does your business sell?", type: "paragraph", required: true },
      { key: "idealCustomer", label: "Who is your ideal customer? (age, gender, location, interests)", type: "paragraph", required: true },
      {
        key: "sellsWhere",
        label: "Do you already sell anywhere?",
        type: "multi",
        required: true,
        otherOption: true,
        options: ["Instagram", "TikTok", "Facebook", "WhatsApp", "Etsy", "eBay", "Amazon", "Market stall", "Not yet"],
      },
      { key: "socialLinks", label: "Links to your social media or current shop", type: "paragraph", required: false },
    ],
  },
  {
    title: "Brand and style",
    fields: [
      {
        key: "hasLogo",
        label: "Do you have a logo?",
        type: "single",
        required: true,
        options: ["Yes – I'll send it", "No – I need one (quoted separately)", "In progress"],
      },
      { key: "brandColours", label: "Your brand colours (hex codes if you know them, e.g. #1A3C34)", type: "short", required: false },
      {
        key: "brandWords",
        label: "Pick 3 words that describe the feel of your brand",
        type: "multi",
        required: true,
        otherOption: true,
        options: ["Natural", "Luxury", "Minimal", "Bold", "Playful", "Calm", "Modern", "Traditional", "Feminine", "Earthy"],
      },
      { key: "inspirationSites", label: "Share 2–3 websites you like the look of, and what you like about them", type: "paragraph", required: true },
      { key: "dontWant", label: "Anything you do NOT want on your store? (colours, styles, images)", type: "paragraph", required: false },
    ],
  },
  {
    title: "Products",
    fields: [
      {
        key: "productCount",
        label: "How many products do you want on the store at launch? (up to 25 are included)",
        type: "single",
        required: true,
        options: ["1–10", "11–25", "More than 25"],
      },
      { key: "collections", label: "How should your products be grouped into collections? (e.g. Skincare, Gift sets, Bestsellers)", type: "paragraph", required: true },
      { key: "productOptions", label: "Do any products come in options? (size, colour, scent)", type: "single", required: true, options: ["Yes", "No", "Some"] },
      {
        key: "productDetailsFormat",
        label: "How will you send your product details? (names, descriptions, prices)",
        type: "single",
        required: true,
        options: ["Spreadsheet", "Document", "WhatsApp messages", "Please write the descriptions for me (quoted separately)"],
      },
      {
        key: "photosReady",
        label: "Are your product photos ready?",
        type: "single",
        required: true,
        options: ["Yes – good quality", "Some", "No – I'll take them", "No – I need help"],
      },
      { key: "trackStock", label: "Do you track stock levels for your products?", type: "single", required: true, options: ["Yes", "No", "Made to order"] },
    ],
  },
  {
    title: "Pages and content",
    fields: [
      { key: "aboutStory", label: "Tell us your story for the About page (how and why you started)", type: "paragraph", required: true },
      { key: "differentiators", label: "What makes your products different from others?", type: "paragraph", required: true },
      {
        key: "contactMethods",
        label: "Contact details to show on the store",
        type: "multi",
        required: true,
        options: ["Email", "WhatsApp", "Phone", "Business address", "Contact form only"],
      },
      { key: "faq", label: "List 3–5 questions customers often ask you, with your answers (for the FAQ page)", type: "paragraph", required: false },
      { key: "popupOffer", label: "Would you like an email sign-up pop-up, and what offer should it give? (e.g. 10% off first order)", type: "short", required: false },
    ],
  },
  {
    title: "Shipping, payments and policies",
    fields: [
      { key: "shipTo", label: "Where will you ship to?", type: "multi", required: true, options: ["UK only", "Europe", "Worldwide", "Local collection"] },
      { key: "shippingPrices", label: "Your shipping prices (e.g. £3.50 standard, free over £40)", type: "paragraph", required: true },
      { key: "deliveryDays", label: "How many days to send out an order after it's placed?", type: "single", required: true, options: ["1–2 days", "3–5 days", "5+ days"] },
      { key: "returnsPolicy", label: "Your returns and refunds policy (or write \"help me\" and we'll use a standard template)", type: "paragraph", required: true },
      { key: "vatRegistered", label: "Are you VAT registered?", type: "single", required: true, options: ["Yes", "No", "Not sure"] },
    ],
  },
  {
    title: "Access, domain and launch",
    fields: [
      {
        key: "hasShopify",
        label: "Do you have a Shopify account yet?",
        type: "single",
        required: true,
        options: ["Yes – I'll add you as staff", "No – please guide me to set one up"],
      },
      {
        key: "hasDomain",
        label: "Do you own a domain name? (e.g. yourbrand.co.uk) If yes, type it in \"Other\"",
        type: "single",
        required: true,
        otherOption: true,
        options: ["No – I need to buy one", "Not sure"],
      },
      { key: "launchDate", label: "Do you have a target launch date?", type: "date", required: false },
      { key: "anythingElse", label: "Anything else we should know before we start?", type: "paragraph", required: false },
    ],
  },
];

export const ONBOARDING_FIELDS: OnboardingField[] = ONBOARDING_SECTIONS.flatMap((s) => s.fields);

export function findOnboardingField(key: string): OnboardingField | undefined {
  return ONBOARDING_FIELDS.find((f) => f.key === key);
}
