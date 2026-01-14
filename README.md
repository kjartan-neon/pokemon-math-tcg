# cardCrun.ch

**Live at: [cardcrun.ch](https://cardcrun.ch)**

A math learning game where kids collect Pokémon cards by solving math problems. Master arithmetic skills while building your collection from over 16,000 real Pokémon TCG cards.

## About

cardCrun.ch combines education with the excitement of collecting Pokémon cards. Players solve math problems appropriate for their grade level (1-7) and earn cards based on their performance. Collect enough HP to unlock rare gold cards and build an impressive collection.

## Features

- **Adaptive Difficulty**: Choose from grade levels 1-7 with appropriately challenging math problems
- **Real Pokémon Cards**: Access to 16,000+ cards from the official Pokémon TCG via TCGdex API
- **Bilingual**: Full support for English and Norwegian
- **Collection Management**: Track your collected cards, view stats, and manage your collection
- **Progress Tracking**: Earn rare cards by reaching HP milestones
- **Local Storage**: All progress saved locally in your browser
- **Responsive Design**: Works seamlessly on mobile and desktop devices

## Tech Stack

- **Svelte** - Reactive UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **TCGdex SDK** - Pokémon TCG card data
- **Local Storage** - Client-side data persistence

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/         # Svelte components
│   ├── CollectionView.svelte
│   ├── QuizView.svelte
│   ├── ResultView.svelte
│   └── ...
├── services/          # API and storage services
│   ├── tcgdex-api.ts
│   └── local-storage.ts
├── stores/            # Svelte stores
│   └── settings.ts
├── utils/             # Utility functions
│   ├── quiz-logic.ts
│   └── backup.ts
├── types/             # TypeScript types
└── i18n/              # Translations
```

## Game Mechanics

1. **Select Language**: Choose between English and Norwegian
2. **Choose Grade Level**: Pick difficulty from grades 1-7
3. **Solve Problems**: Answer math questions correctly
4. **Collect Cards**: Earn random Pokémon cards for correct answers
5. **Build Collection**: Accumulate HP to unlock rare gold cards
6. **Track Progress**: View your collection and stats

## Credits

Created by **Sigmund (10) & Kjartan**

## License

This project is for educational purposes.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
