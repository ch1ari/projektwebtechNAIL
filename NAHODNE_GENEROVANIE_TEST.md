# 🎲 Testovanie náhodného generovania úloh

Tento dokument popisuje ako overiť, že náhodné generovanie úloh funguje správne.

---

## 📋 Čo sa kontroluje:

1. ✅ Úlohy sa generujú **náhodne** v rámci každej obtiažnosti
2. ✅ Obtiažnosť zostáva **v správnom poradí**: Easy → Medium → Hard
3. ✅ **Žiadne opakovanie** dokým nie sú všetky úlohy dokončené
4. ✅ Po dokončení všetkých úloh sa vytvorí **nové náhodné poradie**

---

## 🔍 Metóda 1: Kontrola v Developer Console (NAJJEDNODUCHŠIE)

### Krok 1: Otvor hru v prehliadači
```
http://localhost:5173/
```

### Krok 2: Otvor Developer Tools
- **Chrome/Edge**: `F12` alebo `Ctrl+Shift+I`
- **Firefox**: `F12` alebo `Ctrl+Shift+K`
- **Safari**: `Cmd+Option+I`

### Krok 3: Zobraz aktuálne poradie úloh

**V Console napíš:**
```javascript
JSON.parse(localStorage.getItem('nail-art-queue'))
```

**Očakávaný výstup (príklad):**
```javascript
[
  "easy-bloom",       // ← Easy úlohy (náhodné poradie)
  "easy-berry",
  "easy-rainbow",
  "medium-fiesta",    // ← Medium úlohy (náhodné poradie)
  "medium-romance",
  "medium-ice",
  "hard-neon",        // ← Hard úlohy (náhodné poradie)
  "hard-breakup"
]
```

**Čo kontrolovať:**
- ✅ Prvé 3 sú `easy-*` (ale môžu byť v inom poradí ako v tasks.json)
- ✅ Ďalšie 3 sú `medium-*` (ale môžu byť v inom poradí)
- ✅ Posledné 2 sú `hard-*` (ale môžu byť v inom poradí)

---

## 🔍 Metóda 2: Porovnanie viacerých nových hier

### Test: Vytvoriť 3 nové hry a porovnať poradie

#### Spustenie 1:
1. Vymaž localStorage: `localStorage.clear()`
2. Refresh stránku: `F5`
3. Klikni **"Play"**
4. Zaznamenaj poradie:
```javascript
JSON.parse(localStorage.getItem('nail-art-queue'))
// Napríklad: ["easy-rainbow", "easy-bloom", "easy-berry", ...]
```

#### Spustenie 2:
1. Klikni **"🏠 Hlavné menu"**
2. Klikni **"Nová hra"** (vymaže progress)
3. Zaznamenaj poradie:
```javascript
JSON.parse(localStorage.getItem('nail-art-queue'))
// Napríklad: ["easy-berry", "easy-rainbow", "easy-bloom", ...]
```

#### Spustenie 3:
1. Opakuj kroky vyššie
2. Zaznamenaj poradie:
```javascript
JSON.parse(localStorage.getItem('nail-art-queue'))
// Napríklad: ["easy-bloom", "easy-berry", "easy-rainbow", ...]
```

**Očakávanie:**
- ⚠️ **Poradie by NEMALO byť vždy rovnaké!**
- ✅ Easy úlohy sú stále na začiatku
- ✅ Medium úlohy sú v strede
- ✅ Hard úlohy sú na konci
- ✅ Ale **vnútorné poradie v rámci každej skupiny sa mení**

---

## 🔍 Metóda 3: Vizuálna kontrola v UI

### Krok 1: Začni novú hru
1. Refresh stránku alebo klikni "Nová hra"
2. Pozri sa na **top bar s level chips**
3. Prvá úloha (modrý outline) môže byť:
   - "Sladká jahoda" ALEBO
   - "Pastelový dúhový deň" ALEBO
   - "Jarný kvet"

**Všetky 3 sú easy úlohy, ale môžu byť v rôznom poradí!**

### Krok 2: Skontroluj číslo levelu vs názov
- Ak je prvý level "Jarný kvet" namiesto "Sladká jahoda"
- **To je DOBRE** - znamená to shuffle funguje! ✅

---

## 🔍 Metóda 4: Test non-repetition (žiadne opakovanie)

### Scenár: Dokončenie všetkých úloh

**Console skript pre simuláciu:**
```javascript
// 1. Zobraz aktuálnu queue
let queue = JSON.parse(localStorage.getItem('nail-art-queue'));
console.log('Začiatočná queue:', queue);

// 2. Simuluj dokončenie prvej úlohy (manuálne ju dokonči v hre)
// Po kliknutí "Ďalší level" v hre, skontroluj:
queue = JSON.parse(localStorage.getItem('nail-art-queue'));
console.log('Po prvej úlohe:', queue);
// ↑ Prvá úloha by mala byť odstránená, queue má teraz 7 položiek

// 3. Pokračuj kým nedokončíš všetkých 8 úloh
// Queue by mala postupne klesať: 8 → 7 → 6 → 5 → 4 → 3 → 2 → 1

// 4. Po dokončení poslednej (8.) úlohy:
queue = JSON.parse(localStorage.getItem('nail-art-queue'));
console.log('Po všetkých úlohách (nová shuffle):', queue);
// ↑ Nové náhodné poradie všetkých 8 úloh!
```

**Očakávanie:**
- ✅ Úlohy sa **neopakujú** dokým nie sú všetky odohraté
- ✅ Po 8. úlohe sa queue **automaticky re-shuffle** na nové poradie
- ✅ Žiadna úloha sa neobjaví 2x pred dokončením všetkých

---

## 🔍 Metóda 5: Kontrola zdrojového kódu

### Pre cvičiaceho ktorý chce vidieť algoritmus:

**Súbor:** `src/App.jsx`

**1. Shuffle funkcia** (riadky 37-44):
```javascript
// Fisher-Yates shuffle algorithm for random task ordering
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));  // ← Náhodný index
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];  // ← Swap
  }
  return shuffled;
}
```

**2. Vytvorenie shuffled queue** (riadky 48-62):
```javascript
function createShuffledQueue(taskList) {
  const easy = taskList.filter(t => t.difficulty === 'easy');
  const medium = taskList.filter(t => t.difficulty === 'medium');
  const hard = taskList.filter(t => t.difficulty === 'hard');

  const shuffledEasy = shuffleArray(easy);      // ← Náhodne easy
  const shuffledMedium = shuffleArray(medium);  // ← Náhodne medium
  const shuffledHard = shuffleArray(hard);      // ← Náhodne hard

  return [
    ...shuffledEasy.map(t => t.id),
    ...shuffledMedium.map(t => t.id),
    ...shuffledHard.map(t => t.id)
  ];
}
```

**3. Použitie pri novej hre** (riadky 66-88):
```javascript
const loadQueue = () => {
  // ...
  // No saved progress - create new shuffled queue
  return createShuffledQueue(tasks);  // ← Každá nová hra = nové shuffle
};
```

**4. Re-shuffle po dokončení všetkých** (riadky 349-353):
```javascript
case 'nextLevel': {
  const remainingQueue = state.queue.length > 1 ? state.queue.slice(1) : [];

  // If queue is empty, all tasks completed - create new shuffled queue
  const normalizedQueue = remainingQueue.length > 0
    ? remainingQueue
    : createShuffledQueue(tasks);  // ← Automatický re-shuffle
  // ...
}
```

---

## 📊 Vzorový test pre cvičiaceho

### Kontrolný zoznam:

```
□ Test 1: Nová hra vytvorí shuffled queue
  - localStorage obsahuje 8 úloh v náhodnom poradí

□ Test 2: Easy/Medium/Hard poradie je zachované
  - Prvé 3 sú easy-*
  - Ďalšie 3 sú medium-*
  - Posledné 2 sú hard-*

□ Test 3: Vnútorné poradie je náhodné
  - Každá nová hra má iné poradie easy úloh
  - Každá nová hra má iné poradie medium úloh
  - Každá nová hra má iné poradie hard úloh

□ Test 4: Non-repetition
  - Queue sa skracuje: 8 → 7 → 6 → ... → 1
  - Žiadna úloha sa nezobrazí 2x

□ Test 5: Re-shuffle po dokončení
  - Po 8. úlohe sa queue automaticky naplní novým náhodným poradím

□ Test 6: Uloženie stavu
  - Vypnutie a opätovné spustenie zachová rovnaké poradie
  - "Pokračovať" načíta uloženú queue
```

---

## 🎯 Rýchly 30-sekundový test:

```bash
# 1. Otvor Console (F12)

# 2. Vymaž localStorage
localStorage.clear();

# 3. Refresh stránku
location.reload();

# 4. Klikni "Play"

# 5. Skontroluj poradie
JSON.parse(localStorage.getItem('nail-art-queue'))

# Výsledok by mal byť:
# - 8 úloh
# - Easy na začiatku, medium v strede, hard na konci
# - Vnútorné poradie náhodné (nie vždy rovnaké ako v tasks.json)
```

---

## ⚠️ Časté chyby pri testovaní:

1. **"Queue je vždy rovnaká!"**
   - ❌ Nezabudol si vymazať localStorage medzi testami
   - ✅ Použite `localStorage.clear()` alebo "Nová hra"

2. **"Prvá úloha je vždy easy-berry!"**
   - ❌ localStorage má uloženú starú queue z pred implementácie shuffle
   - ✅ Hard refresh: `Ctrl+Shift+R` alebo vymaž localStorage

3. **"Nevidím žiadnu queue v console!"**
   - ❌ Hra ešte nezačala (intro screen)
   - ✅ Klikni "Play" najprv, potom skontroluj localStorage

---

## ✅ Potvrdenie funkčnosti:

Ak všetky vyššie uvedené testy prejdú, **náhodné generovanie úloh funguje správne** podľa požiadavky (3):

> *"Hru bude možné hrať viackrát za sebou s tým, že sa bude meniť úloha, ktorú je potrebné riešiť. Očakáva sa zadefinovanie aspoň 8 rôznych úloh/levelov/problémov. Zabezpečte **náhodné generovanie úloh** v rámci levelu a aby sa **neopakovali dovtedy, dokým sa všetky neodohrali**."*

✅ Náhodné generovanie: `shuffleArray()` s Fisher-Yates
✅ 8 úloh: tasks.json
✅ V rámci levelov: Easy/Medium/Hard separátne
✅ Non-repetition: Queue system s re-shuffle
