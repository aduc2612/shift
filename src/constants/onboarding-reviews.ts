export type PersonaReview = {
  name: string;
  quote: string;
  rating: number;
  avatarInitials: string;
};

// export const PERSONA_REVIEWS: Record<string, PersonaReview[]> = {
//   student: [
//     {
//       name: "Sofia L.",
//       quote:
//         "Exam season used to destroy me. I'd spend more time figuring out what to study than actually studying. Shift AI just tells me what's next.",
//       rating: 5,
//       avatarInitials: "SL",
//     },
//     {
//       name: "James R.",
//       quote:
//         "Balancing lectures, assignments, and a part-time job was chaos. Shift AI slotted it all in and I stopped missing deadlines.",
//       rating: 5,
//       avatarInitials: "JR",
//     },
//     {
//       name: "Aisha K.",
//       quote:
//         "Group projects used to eat my evenings. Now I just tell Shift AI when I am free and it builds the rest of my day around it.",
//       rating: 5,
//       avatarInitials: "AK",
//     },
//   ],
//   professional: [
//     {
//       name: "Marcus D.",
//       quote:
//         "My meetings always run over. Used to mean my whole afternoon was toast. Now I just tap and it figures it out.",
//       rating: 5,
//       avatarInitials: "MD",
//     },
//     {
//       name: "Priya S.",
//       quote:
//         "Back-to-back calls used to leave me zero time for deep work. Shift AI carves out the focus blocks I actually need.",
//       rating: 5,
//       avatarInitials: "PS",
//     },
//     {
//       name: "Tom H.",
//       quote:
//         "I used to replan my whole afternoon every time a meeting ran long. Now Shift AI does it in one tap and I get back to work.",
//       rating: 5,
//       avatarInitials: "TH",
//     },
//   ],
//   parent: [
//     {
//       name: "Rachel B.",
//       quote:
//         "Between pickups, work, and dinner I had zero breathing room. Shift AI found it for me.",
//       rating: 5,
//       avatarInitials: "RB",
//     },
//     {
//       name: "David W.",
//       quote:
//         "School runs, work calls, dinner, bedtime — I was constantly forgetting something. Shift AI keeps the whole household on track.",
//       rating: 5,
//       avatarInitials: "DW",
//     },
//     {
//       name: "Maria C.",
//       quote:
//         "I finally have time for myself in the evening. Shift AI handles the rest and I don't have to think about it.",
//       rating: 5,
//       avatarInitials: "MC",
//     },
//   ],
//   freelancer: [
//     {
//       name: "Jordan K.",
//       quote:
//         "Juggling client work, admin, and life meant I never knew what to do next. Shift AI gives me a plan I can actually stick to.",
//       rating: 5,
//       avatarInitials: "JK",
//     },
//     {
//       name: "Sam P.",
//       quote:
//         "Switching between three client projects used to eat my mornings. Shift AI stacks the deep work and I actually ship on time.",
//       rating: 5,
//       avatarInitials: "SP",
//     },
//     {
//       name: "Nina L.",
//       quote:
//         "Invoices, proposals, client calls — I used to lose hours to admin. Now Shift AI blocks it out and I stop drowning.",
//       rating: 5,
//       avatarInitials: "NL",
//     },
//   ],
//   shift_worker: [
//     {
//       name: "Alex M.",
//       quote:
//         "My schedule changes weekly. I spent hours rearranging everything. Shift AI does it in seconds.",
//       rating: 5,
//       avatarInitials: "AM",
//     },
//     {
//       name: "Chris B.",
//       quote:
//         "Night shifts wreck every routine I try to build. Shift AI adapts to whatever shift I am on that week.",
//       rating: 5,
//       avatarInitials: "CB",
//     },
//     {
//       name: "Taylor S.",
//       quote:
//         "Rotating schedules made every planner useless. Shift AI rebuilds my day every time my shift changes — it's the first tool that actually kept up.",
//       rating: 5,
//       avatarInitials: "TS",
//     },
//   ],
//   other: [
//     {
//       name: "Sam T.",
//       quote:
//         "I have ADHD and keeping a schedule felt impossible. Shift AI builds one that adapts when I do.",
//       rating: 5,
//       avatarInitials: "ST",
//     },
//     {
//       name: "Robin J.",
//       quote:
//         "Chronic illness means my energy is unpredictable. Shift AI rearranges around how I actually feel each day.",
//       rating: 5,
//       avatarInitials: "RJ",
//     },
//     {
//       name: "Casey W.",
//       quote:
//         "I never found a routine that stuck. Shift AI doesn't force one — it just keeps adjusting until something works.",
//       rating: 5,
//       avatarInitials: "CW",
//     },
//   ],
// };

export const PERSONA_REVIEWS: Record<string, PersonaReview[]> = {
  student: [
    {
      name: "Sofia L.",
      quote:
        "I'm doing my MSc and honestly felt like I spent more time deciding what to study than actually studying. The first time I missed a study block and watched everything rearrange itself, I just sat there smiling. SUCH a relief.",
      rating: 5,
      avatarInitials: "SL",
    },
    {
      name: "James R.",
      quote:
        "Between lectures, assignments and a part-time job I was constantly behind. I've tried planners before but always stopped using them after a week. This is the first one that's actually stayed in my routine.",
      rating: 5,
      avatarInitials: "JR",
    },
    {
      name: "Aisha K.",
      quote:
        "What surprised me most is how much mental energy it saves. I don't spend 20 minutes every morning figuring out what to do next anymore. I just open the app and start.",
      rating: 4,
      avatarInitials: "AK",
    },
  ],

  professional: [
    {
      name: "Marcus D.",
      quote:
        "Every meeting at my company somehow runs 20 minutes over. Before, that would completely wreck my afternoon. Now I hit one button and everything gets sorted out. HUGE relief.",
      rating: 5,
      avatarInitials: "MD",
    },
    {
      name: "Priya S.",
      quote:
        "I work in consulting and my calendar changes constantly. The biggest benefit isn't the scheduling itself—it's not having to think about rescheduling everything when plans change.",
      rating: 4,
      avatarInitials: "PS",
    },
    {
      name: "Tom H.",
      quote:
        "This is the closest thing I've found to having a personal assistant. I still decide what matters, but I don't spend half my day reorganizing tasks anymore.",
      rating: 5,
      avatarInitials: "TH",
    },
  ],

  parent: [
    {
      name: "Rachel B.",
      quote:
        "Mom of 3 here 🙋‍♀️. School pickups, work, appointments, sick kids... my plans NEVER survive the day. This is the first planner that doesn't make me feel guilty when life happens.",
      rating: 5,
      avatarInitials: "RB",
    },
    {
      name: "David W.",
      quote:
        "I used to keep tasks in one app and appointments in another. Things would slip through the cracks all the time. Having everything in one place has made a bigger difference than I expected.",
      rating: 4,
      avatarInitials: "DW",
    },
    {
      name: "Maria C.",
      quote:
        "The best part is that I stop feeling overwhelmed when my day changes. The app adjusts and helps me focus on what's actually realistic today.",
      rating: 5,
      avatarInitials: "MC",
    },
  ],

  freelancer: [
    {
      name: "Jordan K.",
      quote:
        "Freelancer here. Every client thinks THEIR project is the emergency 😂. I was constantly rewriting my day. Now I just hit reschedule and move on with my life.",
      rating: 5,
      avatarInitials: "JK",
    },
    {
      name: "Sam P.",
      quote:
        "I used to waste so much energy deciding what to work on next. Weirdly, that's the biggest thing this app fixed for me.",
      rating: 4,
      avatarInitials: "SP",
    },
    {
      name: "Nina L.",
      quote:
        "Client work, invoices, proposals, admin... I felt scattered ALL the time. Having my schedule automatically reorganize itself when something runs late has been a game changer.",
      rating: 5,
      avatarInitials: "NL",
    },
  ],

  shift_worker: [
    {
      name: "Alex M.",
      quote:
        "Most productivity apps assume everyone works 9–5. I don't. My shifts change constantly and I got tired of rebuilding my schedule every week. This is the first app that's actually kept up.",
      rating: 5,
      avatarInitials: "AM",
    },
    {
      name: "Chris B.",
      quote:
        "Night shifts completely wreck most routines. I like that the app adapts instead of expecting me to fit into some perfect schedule.",
      rating: 4,
      avatarInitials: "CB",
    },
    {
      name: "Taylor S.",
      quote:
        "I've deleted so many planners because they became useless the moment my rota changed. This one finally gets it.",
      rating: 5,
      avatarInitials: "TS",
    },
  ],

  other: [
    {
      name: "Sam T.",
      quote:
        "I have ADHD and WOW. The first time I missed a task and watched everything rearrange itself automatically, I literally felt my shoulders relax. It was like my brain could finally stop juggling everything.",
      rating: 5,
      avatarInitials: "ST",
    },
    {
      name: "Robin J.",
      quote:
        "I deal with chronic fatigue, so some days just don't go to plan. I love that I can schedule around my actual energy levels instead of pretending every day is the same.",
      rating: 5,
      avatarInitials: "RJ",
    },
    {
      name: "Casey W.",
      quote:
        "OMG. THIS. IS. IT. I've tried Todoist, Google Calendar, paper planners... everything. They all worked until life happened. This is the first one that adapts when I don't.",
      rating: 5,
      avatarInitials: "CW",
    },
  ],
};
