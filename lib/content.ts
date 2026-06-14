/**
 * Marketing copy distilled from the NexMed brand guide (Brand Foundation /
 * Verbal Identity). Editable placeholders the user can refine later.
 */

export const TAGLINE = "Your Health, Our Mission.";

export const USP =
  "A modern pharmacy and health brand combining compassionate, expert human care with the convenience of online consultations, refills, and delivery, from your first question to lasting wellness.";

export const ELEVATOR_PITCH =
  "NexMed is a modern health solutions brand dedicated to making healthcare personal again. We combine convenient online tools with warm, expert guidance so every patient feels truly cared for.";

export const coreValues = [
  { letter: "T", title: "Trust", body: "Honest & transparent in every interaction." },
  { letter: "C", title: "Care", body: "Patient-first, always." },
  { letter: "I", title: "Innovation", body: "Modern, convenient health solutions." },
  { letter: "I", title: "Integrity", body: "Ethical in all we do." },
  { letter: "E", title: "Excellence", body: "Continuous quality, every day." },
];

export const keyMessages = [
  "Technology enhances care; it never replaces the human touch.",
  "Health guidance should be accessible to everyone, everywhere.",
  "We are partners in your health journey, not a transaction.",
  "We build lasting relationships, from day one to every day after.",
];

export const howItWorks = [
  {
    step: "01",
    title: "Create your account",
    body: "Sign up in seconds with Google or email to access your personal booking area.",
  },
  {
    step: "02",
    title: "Choose a time & pay securely",
    body: "Pick an open slot that suits you and pay safely online. Your slot is reserved the moment payment is confirmed.",
  },
  {
    step: "03",
    title: "Meet & get a plan",
    body: "Join your private consultation. You'll receive the meeting link and clear, actionable next steps.",
  },
];

/**
 * Canonical service shown before the database is configured, and seeded into
 * Supabase. Price is editable in the admin dashboard.
 */
export const defaultServices = [
  {
    slug: "initial-consultation",
    title: "Initial Health Consultation",
    description:
      "A focused 30-minute 1:1 session with personal, expert guidance. We review your goals, answer your questions, and leave you with a clear, actionable plan.",
    duration_min: 30,
    price_cents: 9900,
    currency: "usd",
    active: true,
    sort_order: 1,
    highlights: [
      "30-minute private video consultation",
      "A clear summary of your situation",
      "Clear, jargon-free action plan",
      "Follow-up notes after the session",
    ],
  },
];

export type ServiceContent = (typeof defaultServices)[number];

/** Placeholder testimonials — replace with real client quotes. */
export const testimonials = [
  {
    name: "Sarah M.",
    role: "Caregiver",
    rating: 5,
    content:
      "The consultation felt genuinely personal. I left with a clear plan and finally understood my options. No jargon, just real guidance.",
  },
  {
    name: "David L.",
    role: "Health-conscious professional",
    rating: 5,
    content:
      "Booking and paying took two minutes, and the session was worth every penny. The clear summary afterward was a brilliant touch.",
  },
  {
    name: "Priya R.",
    role: "Patient",
    rating: 5,
    content:
      "Warm, knowledgeable and never rushed. This is what healthcare guidance should feel like.",
  },
];

/** Trust signals shown as a band on the home page. Edit freely. */
export const trustBadges = [
  {
    title: "Licensed & qualified",
    body: "Guidance from a credentialed health professional.",
  },
  {
    title: "Secure payments",
    body: "Card payments processed safely by Stripe.",
  },
  {
    title: "Private & confidential",
    body: "Your details are encrypted and never shared.",
  },
  {
    title: "Care that follows up",
    body: "Clear notes and next steps after every session.",
  },
];

/** Business hours, address and contact details. Replace with your real info. */
export const businessInfo = {
  email: "hello@nexmed.com",
  phone: "+1 (555) 010-2030",
  address: "100 Wellness Ave, Suite 200, San Francisco, CA 94105",
  mapUrl:
    "https://www.google.com/maps?q=San+Francisco,+CA&output=embed",
  hours: [
    { day: "Monday to Friday", time: "9:00 AM to 5:00 PM" },
    { day: "Saturday", time: "10:00 AM to 2:00 PM" },
    { day: "Sunday", time: "Closed" },
  ],
};

/** Frequently asked questions. Replace answers with your real policies. */
export const faqs = [
  {
    q: "Do I need to pay before my consultation is booked?",
    a: "Yes. Your time slot is reserved the moment your payment is confirmed, so the slot is held just for you.",
  },
  {
    q: "How does the consultation take place?",
    a: "Each session is a private online video call. We email your secure meeting link before the appointment, and you can also find it in your dashboard.",
  },
  {
    q: "What if I need to reschedule or cancel?",
    a: "Get in touch through the contact page as early as you can and we'll help you find a new time. Please give as much notice as possible.",
  },
  {
    q: "Is my personal and health information private?",
    a: "Absolutely. Your information is encrypted, stored securely, and never sold or shared with third parties.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "We accept all major debit and credit cards through Stripe, our secure international payment provider.",
  },
  {
    q: "Do you offer prescriptions or dispense medication?",
    a: "NexMed provides health guidance, consultations, and over-the-counter products, and our pharmacy team can help you with prescription refills. For anything we can't dispense, we'll point you to the right next step.",
  },
];

/** In-store / pharmacy health services. Informational — edit freely. */
export const pharmacyServices = [
  {
    title: "Blood pressure checks",
    body: "Quick, walk-in blood pressure monitoring with friendly advice on your results.",
  },
  {
    title: "Vaccinations & flu shots",
    body: "Seasonal flu, travel, and routine vaccinations administered by our team.",
  },
  {
    title: "Medication reviews",
    body: "Sit down with our pharmacist to review your medicines, doses, and interactions.",
  },
  {
    title: "Health screenings",
    body: "Cholesterol, blood sugar, and general wellness checks to stay ahead of your health.",
  },
  {
    title: "Prescription refills",
    body: "Request repeat prescriptions online for convenient pickup or home delivery.",
  },
  {
    title: "Travel health advice",
    body: "Personalised guidance and essentials to keep you healthy wherever you go.",
  },
];

/** Insurance & pricing information. Replace with your real policies. */
export const insuranceInfo = {
  intro:
    "We aim to keep care affordable and transparent. Here's how payment and insurance work at NexMed.",
  points: [
    {
      title: "Major insurance accepted",
      body: "We work with most major health insurance plans for eligible pharmacy services. Bring your card and we'll handle the rest.",
    },
    {
      title: "Transparent self-pay pricing",
      body: "No insurance? Every consultation and product shows a clear price up front, with no hidden fees, ever.",
    },
    {
      title: "Secure online payments",
      body: "Pay safely by card through Stripe for consultations and shop orders, with instant confirmation.",
    },
    {
      title: "Questions about coverage?",
      body: "Not sure if something is covered? Ask our team and we'll help you understand your options before you commit.",
    },
  ],
};

/**
 * General medication safety guidance. Educational only, not medical advice.
 * Edit freely to match your pharmacy's policies.
 */
export const medicationSafety = [
  {
    title: "Take exactly as directed",
    body: "Follow the dose, timing, and duration on the label or as advised by your pharmacist. Never double up on a missed dose unless you're told to.",
  },
  {
    title: "Check for interactions",
    body: "Some medicines, supplements, and foods don't mix well. Keep a list of everything you take and share it with your pharmacist.",
  },
  {
    title: "Store medicines safely",
    body: "Keep medicines in a cool, dry place away from direct sunlight, and always out of reach of children and pets.",
  },
  {
    title: "Mind the expiry date",
    body: "Don't use medicines past their expiry date. Return unused or expired medicines to the pharmacy for safe disposal.",
  },
  {
    title: "Finish prescribed courses",
    body: "With antibiotics and similar treatments, complete the full course even if you feel better, unless your prescriber says otherwise.",
  },
  {
    title: "Ask before you mix",
    body: "Avoid alcohol with medicines unless you've checked it's safe, and ask before combining over-the-counter products.",
  },
];

/** Common over-the-counter medication categories, in plain language. */
export const medicationCategories = [
  {
    category: "Pain & fever relief",
    body: "Used for headaches, muscle aches, and fever. Stick to the stated dose and avoid taking more than one product with the same active ingredient.",
    examples: "Paracetamol, ibuprofen, aspirin",
  },
  {
    category: "Allergy relief",
    body: "Antihistamines ease sneezing, itching, and hay fever. Some can cause drowsiness, so check the label before driving.",
    examples: "Cetirizine, loratadine, antihistamine eye drops",
  },
  {
    category: "Cold & flu",
    body: "Eases congestion, sore throat, and cough. Many combination products contain pain relief, so avoid doubling up.",
    examples: "Decongestants, throat lozenges, cough syrups",
  },
  {
    category: "Digestive health",
    body: "For heartburn, indigestion, and upset stomach. See your pharmacist if symptoms last more than a couple of weeks.",
    examples: "Antacids, rehydration salts, anti-diarrhoeals",
  },
  {
    category: "Vitamins & supplements",
    body: "Support everyday wellbeing and fill dietary gaps. More is not always better, so follow the recommended daily amount.",
    examples: "Vitamin D, multivitamins, omega-3",
  },
  {
    category: "Skin & first aid",
    body: "For minor cuts, burns, bites, and skin conditions. Keep wounds clean and seek help if they show signs of infection.",
    examples: "Antiseptics, plasters, hydrocortisone cream",
  },
];

/** Health tips / articles — placeholder posts the user can expand later. */
export const articles = [
  {
    slug: "preparing-for-your-consultation",
    title: "How to get the most out of your consultation",
    category: "Guides",
    excerpt:
      "A few simple things to prepare beforehand so your session is focused, productive, and tailored to you.",
    readMinutes: 4,
  },
  {
    slug: "everyday-wellness-habits",
    title: "Five everyday habits that support lasting wellness",
    category: "Wellness",
    excerpt:
      "Small, sustainable changes often matter more than big ones. Here are five worth building into your week.",
    readMinutes: 5,
  },
  {
    slug: "understanding-your-medications",
    title: "Understanding your medications: questions worth asking",
    category: "Medication safety",
    excerpt:
      "Knowing what to ask helps you take medicines safely and confidently. A short checklist to keep handy.",
    readMinutes: 3,
  },
];
