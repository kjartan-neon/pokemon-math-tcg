<script lang="ts">
  import { onMount } from 'svelte';
  import type { PokemonCard, QuizQuestion, CollectedCard, Collection } from './types';
  import { getAllCardsFromSet, getCardDetails, getRandomCard } from './services/tcgdex-api';
  import { loadCollection, addCardToCollection, updateStats, saveCollection } from './services/local-storage';
  import { generateQuizQuestion, checkAnswer } from './utils/quiz-logic';
  import { language, selectedSet, availableSets, klassetrinn } from './stores/settings';
  import { getTranslations } from './i18n/translations';
  import { RARE_CARDS_HP_THRESHOLD } from './config/game-config';
  import QuizView from './components/QuizView.svelte';
  import ResultView from './components/ResultView.svelte';
  import CollectionView from './components/CollectionView.svelte';
  import LoadingView from './components/LoadingView.svelte';
  import ErrorView from './components/ErrorView.svelte';
  import headerBackground from './assets/headerbackground.png';

  type GameState = 'loading' | 'quiz' | 'result' | 'collection' | 'error';

  let gameState: GameState = 'loading';
  let currentQuestion: QuizQuestion | null = null;
  let allCards: PokemonCard[] = [];
  let collection: Collection;
  let isCorrect: boolean = false;
  let userAnswer: number = 0;
  let secondUserAnswer: number = 0;
  let wonCard: PokemonCard | null = null;
  let errorMessage: string = '';
  let currentView: 'quiz' | 'collection' = 'quiz';
  let showLanguageDialog = false;
  let currentSetId: string = $selectedSet;
  let needsStreak = false;
  let streakProgress = 0;

  $: t = getTranslations($language);

  onMount(() => {
    collection = loadCollection();
    const hasSeenLanguageDialog = localStorage.getItem('tcg-seen-language-dialog');
    if (!hasSeenLanguageDialog) {
      showLanguageDialog = true;
    } else {
      loadNewQuestion();
    }
  });

  function handleSetChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedSet.set(target.value);
    currentSetId = target.value;
    allCards = [];
    loadNewQuestion();
  }

  function handleKlassetrinnChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    klassetrinn.set(Number(target.value) as 1 | 2 | 3 | 4 | 5);
    loadNewQuestion();
  }

  function handleLanguageChange(value: string) {
    language.set(value as 'en' | 'no');
  }

  let selectedLanguageTemp: 'en' | 'no' = 'en';
  let selectedKlassetrinnTemp: 1 | 2 | 3 | 4 | 5 = 4;
  let showKlassetrinnStep = false;

  function handleLanguageSelect(selectedLanguage: 'en' | 'no') {
    selectedLanguageTemp = selectedLanguage;
    showKlassetrinnStep = true;
  }

  function handleKlassetrinnSelect(selectedLevel: 1 | 2 | 3 | 4 | 5) {
    language.set(selectedLanguageTemp);
    klassetrinn.set(selectedLevel);
    localStorage.setItem('tcg-seen-language-dialog', 'true');
    showLanguageDialog = false;
    showKlassetrinnStep = false;
    loadNewQuestion();
  }

  async function loadNewQuestion() {
    try {
      gameState = 'loading';

      if (allCards.length === 0) {
        allCards = await getAllCardsFromSet(currentSetId);
      }

      const sortedCards = [...allCards].sort((a, b) => {
        const numA = parseInt(a.localId || '0');
        const numB = parseInt(b.localId || '0');
        return numB - numA;
      });

      const rareCardIds = new Set(sortedCards.slice(0, 5).map(c => c.id));

      const collectedCardIds = new Set(collection.cards.map(c => c.id));
      const hasReachedHpThreshold = collection.stats.totalHpDefeated >= RARE_CARDS_HP_THRESHOLD;

      let availableCards = allCards.filter(card =>
        !collectedCardIds.has(card.id) && !rareCardIds.has(card.id)
      );

      if (availableCards.length === 0) {
        if (hasReachedHpThreshold) {
          throw new Error('Congratulations! You have collected all cards from this set!');
        } else {
          availableCards = allCards.filter(card => !rareCardIds.has(card.id));
        }
      }

      const randomCard = getRandomCard(availableCards);
      const cardDetails = await getCardDetails(randomCard.id, currentSetId);

      const rarity = cardDetails.rarity?.toLowerCase() || 'common';
      const needsDoubleQuestion = rarity !== 'common' && rarity !== 'uncommon' && rarity !== 'rare' && rarity !== 'double rare';

      const question = generateQuizQuestion(cardDetails, t, needsDoubleQuestion, $klassetrinn);

      if (!question) {
        throw new Error('Could not generate a valid question. Please try again.');
      }

      needsStreak = needsDoubleQuestion ? false : (rarity !== 'common' && rarity !== 'uncommon' && rarity !== 'rare' && rarity !== 'double rare');

      if (collection.streakCard && collection.streakCard.id === cardDetails.id) {
        streakProgress = collection.currentStreak || 0;
      } else {
        streakProgress = 0;
      }

      currentQuestion = question;
      gameState = 'quiz';
    } catch (error) {
      console.error('Error loading question:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to load question';
      gameState = 'error';
    }
  }

  async function checkAndUnlockRareCards() {
    if (!collection.unlockedRareSets) {
      collection.unlockedRareSets = {};
    }

    if (collection.unlockedRareSets[currentSetId]) {
      return;
    }

    if (collection.stats.totalHpDefeated >= RARE_CARDS_HP_THRESHOLD) {
      if (allCards.length === 0) {
        allCards = await getAllCardsFromSet(currentSetId);
      }

      const sortedCards = [...allCards].sort((a, b) => {
        const numA = parseInt(a.localId || '0');
        const numB = parseInt(b.localId || '0');
        return numB - numA;
      });

      const rareCards = sortedCards.slice(0, 5);

      rareCards.forEach(card => {
        const collectedCard: CollectedCard = {
          id: card.id,
          name: card.name,
          image: card.image,
          hp: card.hp,
          types: card.types,
          rarity: card.rarity,
          collectedAt: new Date().toISOString()
        };

        const exists = collection.cards.some(c => c.id === card.id);
        if (!exists) {
          collection.cards.push(collectedCard);
        }
      });

      collection.unlockedRareSets[currentSetId] = true;
      saveCollection(collection);
    }
  }

  function handleAnswer(event: CustomEvent<{ firstAnswer: number; secondAnswer?: number }>) {
    if (!currentQuestion) return;

    userAnswer = event.detail.firstAnswer;
    secondUserAnswer = event.detail.secondAnswer || 0;
    isCorrect = checkAnswer(currentQuestion, userAnswer, secondUserAnswer);

    const hpDefeated = isCorrect && currentQuestion.card.hp ? currentQuestion.card.hp : 0;
    updateStats(isCorrect, hpDefeated);

    wonCard = null;
    if (isCorrect) {
      let canCollect = false;

      if (needsStreak && !currentQuestion.secondQuestion) {
        collection = loadCollection();

        if (collection.streakCard?.id === currentQuestion.card.id) {
          collection.currentStreak = (collection.currentStreak || 0) + 1;
        } else {
          collection.streakCard = currentQuestion.card;
          collection.currentStreak = 1;
        }

        if (collection.currentStreak >= 2) {
          canCollect = true;
          collection.currentStreak = 0;
          collection.streakCard = undefined;
        }

        saveCollection(collection);
      } else {
        canCollect = true;
      }

      if (canCollect) {
        const collectedCard: CollectedCard = {
          id: currentQuestion.card.id,
          name: currentQuestion.card.name,
          image: currentQuestion.card.image,
          hp: currentQuestion.card.hp,
          types: currentQuestion.card.types,
          rarity: currentQuestion.card.rarity,
          collectedAt: new Date().toISOString()
        };

        const added = addCardToCollection(collectedCard);

        if (added) {
          wonCard = currentQuestion.card;
        }
      }
    } else {
      collection = loadCollection();
      if (needsStreak && collection.streakCard?.id === currentQuestion.card.id) {
        collection.currentStreak = 0;
        collection.streakCard = undefined;
        saveCollection(collection);
      }
    }

    collection = loadCollection();

    if (isCorrect) {
      checkAndUnlockRareCards();
      collection = loadCollection();
    }

    gameState = 'result';
  }

  function handleNext() {
    loadNewQuestion();
  }

  function handleRetry() {
    loadNewQuestion();
  }

  function switchToCollection() {
    currentView = 'collection';
    collection = loadCollection();
  }

  function switchToQuiz() {
    currentView = 'quiz';
  }

  function handleRefresh() {
    collection = loadCollection();
  }
</script>

<div class="app">
  <header class="app-header" style="background-image: url({headerBackground}); background-size: cover; background-position: top center; background-repeat: no-repeat;">
    <div class="header-content">
      <div>
        <h1 class="app-title">{t.appTitle}</h1>
        <p class="app-tagline">{t.appTagline}</p>
      </div>
      <nav>
      <button
        class="nav-btn"
        class:active={currentView === 'quiz'}
        on:click={switchToQuiz}
      >
        {t.playQuiz}
      </button>
      <button
        class="nav-btn"
        class:active={currentView === 'collection'}
        on:click={switchToCollection}
      >
        {t.myCollection} ({collection?.cards.length || 0}/{allCards.length})
      </button>
      </nav>
    </div>
  </header>

  <main>
    {#if currentView === 'quiz'}
      {#if gameState === 'loading'}
        <LoadingView message={t.loading} />
      {:else if gameState === 'quiz' && currentQuestion}
        <div class="set-selector-container">
          <select class="set-selector" value={$selectedSet} on:change={handleSetChange}>
            {#each availableSets as set}
              <option value={set.id}>{set.name}</option>
            {/each}
          </select>
        </div>
        <QuizView question={currentQuestion} {t} currentSet={availableSets.find(s => s.id === currentSetId)?.name || ''} on:answer={handleAnswer} />
      {:else if gameState === 'result' && currentQuestion}
        <ResultView
          {isCorrect}
          correctAnswer={currentQuestion.correctAnswer}
          {userAnswer}
          {wonCard}
          {t}
          {needsStreak}
          {streakProgress}
          currentStreak={collection.currentStreak || 0}
          on:next={handleNext}
        />
      {:else if gameState === 'error'}
        <ErrorView message={errorMessage} on:retry={handleRetry} />
      {/if}
    {:else}
      <CollectionView {collection} {t} language={$language} on:refresh={handleRefresh} on:languageChange={(e) => handleLanguageChange(e.detail)} />
    {/if}
  </main>

{#if showLanguageDialog}
  <div class="dialog-overlay" role="button" tabindex="-1">
    <div class="dialog language-dialog">
      {#if !showKlassetrinnStep}
        <h2>Hello!</h2>
        <p>Dette er et mattespill for barn i 1-7 trinn, og her skal du samle på pokémon kort. Du kan vinne de supersjeldene gull kortene ved å slå kort med tilsammen {RARE_CARDS_HP_THRESHOLD.toLocaleString()} HP. </p>
        <p>Solve math problems collect get cards. Beat {RARE_CARDS_HP_THRESHOLD.toLocaleString()} HP in total to get super rare cards! </p>
        <div class="language-buttons">
          <button class="language-btn" on:click={() => handleLanguageSelect('en')}>
            <span class="flag">🇬🇧</span>
            <span>English</span>
          </button>
          <button class="language-btn" on:click={() => handleLanguageSelect('no')}>
            <span class="flag">🇳🇴</span>
            <span>Norsk</span>
          </button>
        </div>
        <p> Laget av / Made by Sigmund (10) & Kjartan</p>
      {:else}
        <h2>{selectedLanguageTemp === 'en' ? 'Choose Grade Level' : 'Velg Klassetrinn'}</h2>
        <p>{selectedLanguageTemp === 'en' ? 'Select the appropriate difficulty level. You can change this anytime in My Collection.' : 'Velg passende vanskelighetsnivå. Du kan endre dette når som helst i Min samling.'}</p>
        <div class="klassetrinn-buttons">
          <button class="klassetrinn-btn" on:click={() => handleKlassetrinnSelect(1)}>
            <span class="grade-number">1</span>
            <span class="grade-description">{selectedLanguageTemp === 'en' ? 'Simple addition (5 + 3)' : 'Enkel addisjon (5 + 3)'}</span>
          </button>
          <button class="klassetrinn-btn" on:click={() => handleKlassetrinnSelect(2)}>
            <span class="grade-number">2</span>
            <span class="grade-description">{selectedLanguageTemp === 'en' ? 'Addition & subtraction' : 'Addisjon og subtraksjon'}</span>
          </button>
          <button class="klassetrinn-btn" on:click={() => handleKlassetrinnSelect(3)}>
            <span class="grade-number">3</span>
            <span class="grade-description">{selectedLanguageTemp === 'en' ? 'Addition & subtraction' : 'Addisjon og subtraksjon'}</span>
          </button>
          <button class="klassetrinn-btn" on:click={() => handleKlassetrinnSelect(4)}>
            <span class="grade-number">4</span>
            <span class="grade-description">{selectedLanguageTemp === 'en' ? 'With Pokemon challenges' : 'Med Pokemon utfordringer'}</span>
          </button>
          <button class="klassetrinn-btn" on:click={() => handleKlassetrinnSelect(5)}>
            <span class="grade-number">5</span>
            <span class="grade-description">{selectedLanguageTemp === 'en' ? 'With Pokemon challenges' : 'Med Pokemon utfordringer'}</span>
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
</div>

<style>
  .app {
    width: 100%;
    min-height: 100vh;
  }

  .app-header {
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-6);
    overflow: hidden;
    position: relative;
  }


  .header-content {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-6);
  }

  .header-content > div:first-child {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .app-title {
    font-family: var(--font-retro);
    font-size: var(--font-size-l);
    font-weight: var(--font-weight-bold);
    color: white;
    margin: 0;
    text-align: left;
    line-height: var(--line-height-tight);
    text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.3);
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  .app-tagline {
    font-family: var(--font-retro);
    font-size: var(--font-size-sm);
    color: rgba(255, 255, 255, 0.9);
    margin: var(--spacing-2) 0 0 0;
    text-align: left;
    text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3);
    letter-spacing: 0.5px;
  }


  .set-selector-container {
    display: flex;
    justify-content: center;
    margin-bottom: var(--spacing-6);
    padding: 0 var(--spacing-6);
  }

  .set-selector {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
    backdrop-filter: blur(10px);
    color: var(--color-neutral-900);
    padding: var(--spacing-3) var(--spacing-6);
    border-radius: var(--border-radius-xl);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-fast);
    border: 2px solid rgba(255, 107, 107, 0.3);
    cursor: pointer;
    font-size: var(--font-size-base);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .set-selector:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    border: 2px solid;
    border-image: linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCF7F, #4D96FF, #9D50BB) 1;
  }

  .set-selector:focus {
    outline: none;
    border: 2px solid;
    border-image: linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCF7F, #4D96FF, #9D50BB) 1;
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2);
  }

  .set-selector option {
    background: white;
    color: var(--color-neutral-900);
  }

  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn var(--transition-fast) ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dialog {
    background: white;
    border-radius: var(--border-radius-2xl);
    padding: var(--spacing-8);
    max-width: 500px;
    width: 90%;
    box-shadow: var(--shadow-xl);
    animation: slideUp var(--transition-normal) ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .language-dialog h2 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 25%, #6BCF7F 50%, #4D96FF 75%, #9D50BB 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 var(--spacing-3) 0;
    text-align: center;
  }

  .language-dialog p {
    font-size: var(--font-size-base);
    color: var(--color-neutral-600);
    text-align: center;
    margin: 0 0 var(--spacing-8) 0;
    line-height: var(--line-height-relaxed);
  }

  .language-buttons {
    display: flex;
    gap: var(--spacing-4);
    justify-content: center;
  }

  .language-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-6);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
    border: 2px solid rgba(255, 107, 107, 0.3);
    border-radius: var(--border-radius-xl);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-900);
    min-width: 140px;
  }

  .language-btn:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
    background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 100%);
    border: 2px solid;
    border-image: linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCF7F, #4D96FF, #9D50BB) 1;
  }

  .language-btn .flag {
    font-size: 3rem;
  }

  .klassetrinn-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    max-width: 400px;
    margin: 0 auto;
  }

  .klassetrinn-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4) var(--spacing-5);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
    border: 2px solid rgba(255, 107, 107, 0.3);
    border-radius: var(--border-radius-xl);
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--color-neutral-900);
    text-align: left;
  }

  .klassetrinn-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
    background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 100%);
    border: 2px solid;
    border-image: linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCF7F, #4D96FF, #9D50BB) 1;
  }

  .grade-number {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 25%, #6BCF7F 50%, #4D96FF 75%, #9D50BB 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    min-width: 50px;
  }

  .grade-description {
    font-size: var(--font-size-sm);
    color: var(--color-neutral-600);
    line-height: var(--line-height-relaxed);
  }

  nav {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-3);
    flex: 1;
  }

  .nav-btn {
    background: rgba(0, 0, 0, 0.5);
    color: white;
    padding: var(--spacing-3) var(--spacing-6);
    border-radius: var(--border-radius-lg);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-fast);
    border: 2px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
  }

  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .nav-btn.active {
    background: white;
    color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-image: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 25%, #6BCF7F 50%, #4D96FF 75%, #9D50BB 100%);
    border-color: white;
  }

  .nav-btn.active:hover {
    background: white;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-image: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 25%, #6BCF7F 50%, #4D96FF 75%, #9D50BB 100%);
  }

  main {
    padding: var(--spacing-6) 0;
  }

  @media (max-width: 768px) {
    .app-header {
      padding: var(--spacing-4);
    }

    .header-content {
      flex-direction: column;
      gap: var(--spacing-4);
    }

    .app-title {
      font-size: var(--font-size-xl);
      text-align: center;
    }

    nav {
      flex-direction: column;
      width: 100%;
    }

    .nav-btn {
      width: 100%;
    }

    .set-selector-container {
      padding: 0 var(--spacing-4);
    }

    .language-buttons {
      flex-direction: column;
    }

    .language-btn {
      width: 100%;
    }
  }
</style>
