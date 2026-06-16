export type PersonaReview = {
  name: string;
  quote: string;
  rating: number;
  avatarInitials: string;
};

export const PERSONA_REVIEWS: Record<string, PersonaReview> = {
  student: {
    name: 'Sofia L.',
    quote:
      "Exam season used to destroy me. I'd spend more time figuring out what to study than actually studying. Shift AI just tells me what's next.",
    rating: 5,
    avatarInitials: 'SL',
  },
  professional: {
    name: 'Marcus D.',
    quote:
      "My meetings always run over. Used to mean my whole afternoon was toast. Now I just tap and it figures it out.",
    rating: 5,
    avatarInitials: 'MD',
  },
  parent: {
    name: 'Rachel B.',
    quote:
      'Between pickups, work, and dinner I had zero breathing room. Shift AI found it for me.',
    rating: 5,
    avatarInitials: 'RB',
  },
  freelancer: {
    name: 'Jordan K.',
    quote:
      "Juggling client work, admin, and life meant I never knew what to do next. Shift AI gives me a plan I can actually stick to.",
    rating: 5,
    avatarInitials: 'JK',
  },
  shift_worker: {
    name: 'Alex M.',
    quote:
      "My schedule changes weekly. I spent hours rearranging everything. Shift AI does it in seconds.",
    rating: 5,
    avatarInitials: 'AM',
  },
  other: {
    name: 'Sam T.',
    quote:
      'I have ADHD and keeping a schedule felt impossible. Shift AI builds one that adapts when I do.',
    rating: 5,
    avatarInitials: 'ST',
  },
};
