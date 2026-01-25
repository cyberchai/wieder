# wieder

A modern, gamified flashcard app built with Next.js and Firebase. Learn vocabulary, study for exams, or master any subject through interactive study modes and engaging games.

**Live:** [wieder.app](https://wieder-six.vercel.app/)
App domain to be added: 

---

## What is wieder?

wieder (German for "again") is a flashcard learning platform that makes studying actually fun. Create flashcard sets, study them in multiple ways, compete on leaderboards, and earn **Wieds** (our XP currency) as you learn.

### Core Features

- **Flashcard Sets** — Create, edit, duplicate, and organize your study materials with tags
- **Multiple Study Modes:**
  - `Study` — Classic flip-card experience with keyboard shortcuts
  - `Practice` — Test yourself with spaced repetition
  - `Test` — Quiz mode to check your knowledge
  - `Match` — Memory matching game
  - `Crossword` — Generate crossword puzzles from your cards
  - `Speed` — Race against the clock
- **Sharing & Collaboration** — Make sets public, share via links, or join others' sets
- **Gamification:**
  - Earn Wieds for studying and completing games
  - Track your study streak
  - Global leaderboard to compete with others
- **Themes** — Light, Dark, Wiederland, Neilson, Confesh, and Bears (Skunks) themes
- **Accessibility** — OpenDyslexic font option, sound effects (toggleable)
- **Progress Tracking** — See how much of each set you've mastered

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Email + Google) |
| State | TanStack Query (React Query) |
| Hosting | Firebase App Hosting |
| Analytics | Google Analytics |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/wieder.git
cd wieder

# Install dependencies
npm install

# Set up environment variables
# Create a .env.local file with your Firebase config:
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# etc.

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you should see the landing page.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard (sets, stats, leaderboard)
│   ├── sets/[setId]/       # Study modes (study, practice, test, match, etc.)
│   ├── login/ & signup/    # Auth pages
│   └── profile/            # User profile settings
├── components/             # React components
│   └── ui/                 # shadcn/ui primitives
├── hooks/                  # Custom React hooks (queries, settings, sounds)
├── lib/                    # Utilities (firebase config, analytics)
├── providers/              # Context providers (auth, theme, query)
└── services/               # Firebase service functions
```

---

## Roadmap & Next Steps

### High Priority

- [ ] **Image Cards (ImageKit.io)** — Allow users to upload images as card terms or definitions. This will make wieder much more useful for visual learners and subjects like anatomy, art history, or languages with different scripts.

- [ ] **Theme Accessibility** — Current theme colors need contrast audits. Some text is hard to read on certain backgrounds. Need to:
  - Run WCAG contrast checks on all theme combinations
  - Add theme preview in settings
  - Consider auto-dark mode based on system preference

- [ ] **Mobile View Fixes** — Several UI issues on mobile:
  - Dashboard cards overflow on small screens
  - Study mode gestures could be smoother
  - Bottom nav might be better than header on mobile
  - Test on various screen sizes and fix breakpoints

- [ ] **Voting/Polling System** — Add community features to boost engagement:
  - Upvote public sets
  - Request features via polls
  - "Set of the week" based on votes

### Medium Priority

- [ ] **Analytics Dashboard** — Proper event tracking for:
  - Which study modes are most popular
  - Average session length
  - Drop-off points in study sessions
  - Set completion rates

- [ ] **Testing Infrastructure** — Currently no tests(!). Need:
  - Unit tests for services (flashcard-sets, stats, users)
  - Integration tests for auth flows
  - E2E tests with Playwright for critical user journeys
  - Consider React Testing Library for components

- [ ] **Graceful Error Handling** — App can crash on network errors. Implement:
  - Error boundaries for component failures
  - Retry logic for failed Firebase calls
  - Offline mode indicators
  - Better error messages for users

### Graphics & Themes

- [ ] **More Unlockable Themes** — Let users spend Wieds to unlock new themes:
  - Seasonal themes (Halloween, Winter, Spring)
  - Aesthetic themes (Vaporwave, Cottagecore, Cyberpunk)
  - Custom color picker for premium users?
  - Animated backgrounds for high-Wied users

- [ ] **Theme Store UI** — Design a store/gallery to browse and unlock themes

### Long-term / Experimental

- [ ] **Apple Vision Pro Version** — Already have some spatial computing ideas. Will need:
  - VisionOS SDK integration
  - 3D flashcard interactions
  - Spatial audio for study modes
  - Hand gesture recognition for card flipping

- [ ] **Multiplayer Speed Mode** — Real-time competitive studying

- [ ] **AI-Generated Flashcards** — Generate cards from uploaded PDFs/notes

- [ ] **Spaced Repetition Algorithm** — Implement SM-2 or similar for optimal review scheduling

---

## Contributing

We'd love help! Here's how to get involved:

1. **Pick an issue** — Check the roadmap above or open issues
2. **Fork & branch** — Create a feature branch from `main`
3. **Make your changes** — Keep commits atomic and descriptive
4. **Test locally** — Make sure nothing breaks
5. **Open a PR** — Describe what you changed and why

### Code Style

- We use TypeScript everywhere — please maintain type safety
- Components go in `src/components/`, hooks in `src/hooks/`
- Use React Query for server state, local state for UI-only state
- Follow existing patterns for new features

### Questions?

Open an issue or reach out. We're friendly!

---

## License

MIT — do whatever you want, just don't blame us if something breaks.

---

Built with late nights, too much coffee, and the belief that learning should be fun.
