# **App Name**: Wieder

## Core Features:

- Authentication: Allow users to sign in with email/password and Google Sign-In using Firebase Authentication; user's flashcard sets show after login.
- Flashcard Set Management: Enable creation of flashcard sets (title + front/back pairs) with storage per user in Firebase Firestore; include ability to delete, edit, and duplicate sets.
- Study Mode: Provide a study mode with card flipping, shuffle, reverse, and starred modes; incorporate keyboard shortcuts (	/→ for navigation, S to star, F to flip).
- Canvas Input: Incorporate a minimal canvas input for handwritten vocab, saving the image to Firebase Storage and referencing it in Firestore.
- Sharing: Allow users to share flashcard sets via shareable links that can be pasted into the app to load the shared set.
- Theme Modes: Implement light, dark, 'Confesh' (green), and 'Bears' (blue/gold) theme modes.
- Optional Mode Toggle: Optional “Full Set Mode” toggle shows subtle progress bar and celebratory animation when enabled.

## Style Guidelines:

- Primary color: Desaturated purple (#000000) to convey a sense of calm and focus suitable for learning.
- Background color: Light gray (#F5F5F5) for the light theme and dark gray (#333333) for the dark theme, ensuring a distraction-free environment.
- Accent color: A vibrant but harmonious blue (#3B82F6) for interactive elements and key actions.
- Body and headline font: 'Inter', a grotesque-style sans-serif with a modern, machined, objective, neutral look.
- Simple, outlined icons to maintain a minimalistic design; icons should clearly represent their actions without unnecessary detail.
- Use of whitespace to avoid clutter, ensuring each element has enough room to breathe and improve readability.
- Subtle transitions and animations (e.g., card flipping) to provide feedback without distracting from the learning process.