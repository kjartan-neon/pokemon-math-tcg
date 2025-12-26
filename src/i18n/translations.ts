export type Language = 'en' | 'no';

export interface Translations {
  appTitle: string;
  appTagline: string;
  quizTitle: string;
  playQuiz: string;
  myCollection: string;
  selectSet: string;
  selectLanguage: string;
  setInfo: string;
  enterAnswer: string;
  submitAnswer: string;
  nextQuestion: string;
  correct: string;
  notQuite: string;
  correctMessage: string;
  incorrectMessage: string;
  encouragement: string;
  youWonThisCard: string;
  cardsCollected: string;
  questionsAnswered: string;
  correctAnswers: string;
  accuracy: string;
  noCardsYet: string;
  noCardsDescription: string;
  exportBackup: string;
  importBackup: string;
  clearThisSet: string;
  clearCollectionTitle: string;
  clearCollectionMessage: string;
  cancel: string;
  clearCollection: string;
  collectionExported: string;
  collectionImported: string;
  collectionCleared: string;
  exportFailed: string;
  importFailed: string;
  clearFailed: string;
  hit: string;
  hits: string;
  loading: string;
  yourCollection: string;
  language: string;
  gradeLevel: string;
  damageQuestion: (damage: number) => string;
  mathQuestion: (num1: number, num2: number, operator: '+' | '-') => string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'cardCrun.ch',
    appTagline: 'Crunch Numbers. Collect Cards.',
    quizTitle: 'TCG Math Challenge',
    playQuiz: 'Play Quiz',
    myCollection: 'My Collection',
    selectSet: 'Select Set',
    selectLanguage: 'Language',
    setInfo: 'Collecting Set',
    enterAnswer: 'Enter your answer',
    submitAnswer: 'Submit Answer',
    nextQuestion: 'Next Question',
    correct: 'Correct!',
    notQuite: 'Not quite!',
    correctMessage: 'Great job! The answer was',
    incorrectMessage: 'You answered',
    encouragement: 'Try again with the next question!',
    youWonThisCard: 'You won this card!',
    cardsCollected: 'Cards Collected',
    questionsAnswered: 'Questions Answered',
    correctAnswers: 'Correct Answers',
    accuracy: 'Accuracy',
    noCardsYet: 'No cards yet!',
    noCardsDescription: 'Answer questions correctly to start building your collection.',
    exportBackup: 'Export Backup',
    importBackup: 'Import Backup',
    clearThisSet: 'Clear This Set',
    clearCollectionTitle: 'Clear Collection?',
    clearCollectionMessage: 'Are you sure you want to clear your entire collection? This action cannot be undone.',
    cancel: 'Cancel',
    clearCollection: 'Clear Collection',
    collectionExported: 'Collection exported successfully!',
    collectionImported: 'Collection imported successfully!',
    collectionCleared: 'Collection cleared successfully!',
    exportFailed: 'Failed to export collection',
    importFailed: 'Failed to import collection',
    clearFailed: 'Failed to clear collection',
    hit: 'hit',
    hits: 'hits',
    loading: 'Loading new question...',
    yourCollection: 'Your Collection',
    language: 'Language',
    gradeLevel: 'Grade Level',
    damageQuestion: (damage: number) => `Your Pokémon deals ${damage} damage each turn. How many turns does it take to defeat this Pokémon?`,
    mathQuestion: (num1: number, num2: number, operator: '+' | '-') => `What is ${num1} ${operator} ${num2}?`,
  },
  no: {
    appTitle: 'cardCrun.ch',
    appTagline: 'Crunch Numbers. Collect Cards.',
    quizTitle: 'TCG Matte Utfordring',
    playQuiz: 'Spill Quiz',
    myCollection: 'Min Samling',
    selectSet: 'Velg Sett',
    selectLanguage: 'Språk',
    setInfo: 'Samler Sett',
    enterAnswer: 'Skriv inn svaret ditt',
    submitAnswer: 'Send Inn Svar',
    nextQuestion: 'Neste Spørsmål',
    correct: 'Riktig!',
    notQuite: 'Ikke helt!',
    correctMessage: 'Bra jobbet! Svaret var',
    incorrectMessage: 'Du svarte',
    encouragement: 'Prøv igjen med neste spørsmål!',
    youWonThisCard: 'Du vant dette kortet!',
    cardsCollected: 'Kort Samlet',
    questionsAnswered: 'Spørsmål Besvart',
    correctAnswers: 'Riktige Svar',
    accuracy: 'Nøyaktighet',
    noCardsYet: 'Ingen kort ennå!',
    noCardsDescription: 'Svar riktig på spørsmål for å begynne å bygge samlingen din.',
    exportBackup: 'Eksporter Backup',
    importBackup: 'Importer Backup',
    clearThisSet: 'Tøm Dette Settet',
    clearCollectionTitle: 'Tøm Samling?',
    clearCollectionMessage: 'Er du sikker på at du vil tømme hele samlingen din? Denne handlingen kan ikke angres.',
    cancel: 'Avbryt',
    clearCollection: 'Tøm Samling',
    collectionExported: 'Samling eksportert!',
    collectionImported: 'Samling importert!',
    collectionCleared: 'Samling tømt!',
    exportFailed: 'Kunne ikke eksportere samling',
    importFailed: 'Kunne ikke importere samling',
    clearFailed: 'Kunne ikke tømme samling',
    hit: 'treff',
    hits: 'treff',
    loading: 'Laster nytt spørsmål...',
    yourCollection: 'Din Samling',
    language: 'Språk',
    gradeLevel: 'Klassetrinn',
    damageQuestion: (damage: number) => `Din Pokémon gjør ${damage} skade hver runde. Hvor mange runder tar det å beseire denne Pokémonen?`,
    mathQuestion: (num1: number, num2: number, operator: '+' | '-') => `Hva er ${num1} ${operator} ${num2}?`,
  },
};

export function getTranslations(lang: Language): Translations {
  return translations[lang];
}
