export type PersonaReview = {
  name: string;
  quote: string;
  rating: number;
  avatarInitials: string;
};

export const PERSONA_REVIEWS: Record<string, PersonaReview[]> = {
  student: [
    {
      name: "Sofia L.",
      quote:
        "Exam season used to destroy me. I'd spend more time figuring out what to study than actually studying. Shift AI just tells me what's next.",
      rating: 5,
      avatarInitials: "SL",
    },
    {
      name: "James R.",
      quote:
        "Balancing lectures, assignments, and a part-time job was chaos. Shift AI slotted it all in and I stopped missing deadlines.",
      rating: 5,
      avatarInitials: "JR",
    },
    {
      name: "Aisha K.",
      quote:
        "Group projects used to eat my evenings. Now I just tell Shift AI when I am free and it builds the rest of my day around it.",
      rating: 5,
      avatarInitials: "AK",
    },
  ],
  professional: [
    {
      name: "Marcus D.",
      quote:
        "My meetings always run over. Used to mean my whole afternoon was toast. Now I just tap and it figures it out.",
      rating: 5,
      avatarInitials: "MD",
    },
    {
      name: "Priya S.",
      quote:
        "Back-to-back calls used to leave me zero time for deep work. Shift AI carves out the focus blocks I actually need.",
      rating: 5,
      avatarInitials: "PS",
    },
    {
      name: "Tom H.",
      quote:
        "I used to replan my whole afternoon every time a meeting ran long. Now Shift AI does it in one tap and I get back to work.",
      rating: 5,
      avatarInitials: "TH",
    },
  ],
  parent: [
    {
      name: "Rachel B.",
      quote:
        "Between pickups, work, and dinner I had zero breathing room. Shift AI found it for me.",
      rating: 5,
      avatarInitials: "RB",
    },
    {
      name: "David W.",
      quote:
        "School runs, work calls, dinner, bedtime — I was constantly forgetting something. Shift AI keeps the whole household on track.",
      rating: 5,
      avatarInitials: "DW",
    },
    {
      name: "Maria C.",
      quote:
        "I finally have time for myself in the evening. Shift AI handles the rest and I don't have to think about it.",
      rating: 5,
      avatarInitials: "MC",
    },
  ],
  freelancer: [
    {
      name: "Jordan K.",
      quote:
        "Juggling client work, admin, and life meant I never knew what to do next. Shift AI gives me a plan I can actually stick to.",
      rating: 5,
      avatarInitials: "JK",
    },
    {
      name: "Sam P.",
      quote:
        "Switching between three client projects used to eat my mornings. Shift AI stacks the deep work and I actually ship on time.",
      rating: 5,
      avatarInitials: "SP",
    },
    {
      name: "Nina L.",
      quote:
        "Invoices, proposals, client calls — I used to lose hours to admin. Now Shift AI blocks it out and I stop drowning.",
      rating: 5,
      avatarInitials: "NL",
    },
  ],
  shift_worker: [
    {
      name: "Alex M.",
      quote:
        "My schedule changes weekly. I spent hours rearranging everything. Shift AI does it in seconds.",
      rating: 5,
      avatarInitials: "AM",
    },
    {
      name: "Chris B.",
      quote:
        "Night shifts wreck every routine I try to build. Shift AI adapts to whatever shift I am on that week.",
      rating: 5,
      avatarInitials: "CB",
    },
    {
      name: "Taylor S.",
      quote:
        "Rotating schedules made every planner useless. Shift AI rebuilds my day every time my shift changes — it's the first tool that actually kept up.",
      rating: 5,
      avatarInitials: "TS",
    },
  ],
  other: [
    {
      name: "Sam T.",
      quote:
        "I have ADHD and keeping a schedule felt impossible. Shift AI builds one that adapts when I do.",
      rating: 5,
      avatarInitials: "ST",
    },
    {
      name: "Robin J.",
      quote:
        "Chronic illness means my energy is unpredictable. Shift AI rearranges around how I actually feel each day.",
      rating: 5,
      avatarInitials: "RJ",
    },
    {
      name: "Casey W.",
      quote:
        "I never found a routine that stuck. Shift AI doesn't force one — it just keeps adjusting until something works.",
      rating: 5,
      avatarInitials: "CW",
    },
  ],
};
