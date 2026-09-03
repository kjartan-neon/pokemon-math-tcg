import { writable } from 'svelte/store';
import type { Language } from '../i18n/translations';

export interface CardSet {
  id: string;
  name: string;
}

export const availableSets: CardSet[] = [
  { id: 'swsh3', name: 'Sword & Shield - Darkness Ablaze' },
  { id: 'sv05', name: 'Scarlet & Violet - Temporal Forces' },
  { id: 'sv06.5', name: 'Scarlet & Violet - Shrouded Fable' },
  { id: 'me03', name: 'Mega Evolution - Perfect Order' },
  { id: 'me04', name: 'Mega Evolution - Chaos Rising' },
  { id: 'me05', name: 'Mega Evolution - Pitch Black' },
];

const SETTINGS_KEY = 'tcg-math-settings';

export type Klassetrinn = 1 | 2 | 3 | 4 | 5;

interface Settings {
  language: Language;
  selectedSet: string;
  klassetrinn: Klassetrinn;
}

function getDefaultSettings(): Settings {
  return {
    language: 'en',
    selectedSet: 'swsh3',
    klassetrinn: 4,
  };
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        language: parsed.language || 'en',
        selectedSet: parsed.selectedSet || 'swsh3',
        klassetrinn: parsed.klassetrinn || 4,
      };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return getDefaultSettings();
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

const initialSettings = loadSettings();

export const language = writable<Language>(initialSettings.language);
export const selectedSet = writable<string>(initialSettings.selectedSet);
export const klassetrinn = writable<Klassetrinn>(initialSettings.klassetrinn);

language.subscribe(value => {
  const current = loadSettings();
  saveSettings({ ...current, language: value });
});

selectedSet.subscribe(value => {
  const current = loadSettings();
  saveSettings({ ...current, selectedSet: value });
});

klassetrinn.subscribe(value => {
  const current = loadSettings();
  saveSettings({ ...current, klassetrinn: value });
});
