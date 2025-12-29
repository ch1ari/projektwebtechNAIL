# 🎲 Praktická ukážka náhodného generovania

## Rýchly test pre cvičiaceho (2 minúty)

### ⚡ Spôsob 1: Console Commands (najrýchlejší)

Otvor Developer Console (F12) a spusti tento skript:

```javascript
// ==================================================
// DEMO SKRIPT: Náhodné generovanie úloh
// ==================================================

console.log("🎲 TEST NÁHODNÉHO GENEROVANIA ÚLOH\n" + "=".repeat(50));

// 1. Vymaž starý progress
localStorage.clear();
console.log("\n✅ 1. localStorage vymazaný");

// 2. Načítaj tasks
const tasks = [
  { id: "easy-berry", difficulty: "easy" },
  { id: "easy-rainbow", difficulty: "easy" },
  { id: "easy-bloom", difficulty: "easy" },
  { id: "medium-ice", difficulty: "medium" },
  { id: "medium-fiesta", difficulty: "medium" },
  { id: "medium-romance", difficulty: "medium" },
  { id: "hard-neon", difficulty: "hard" },
  { id: "hard-breakup", difficulty: "hard" }
];

// 3. Fisher-Yates shuffle
function shuffle(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 4. Vytvor 3 rôzne shuffle a porovnaj
console.log("\n📋 POROVNANIE 3 SHUFFLED QUEUES:\n" + "-".repeat(50));

for (let run = 1; run <= 3; run++) {
  const easy = shuffle(tasks.filter(t => t.difficulty === 'easy'));
  const medium = shuffle(tasks.filter(t => t.difficulty === 'medium'));
  const hard = shuffle(tasks.filter(t => t.difficulty === 'hard'));

  const queue = [
    ...easy.map(t => t.id),
    ...medium.map(t => t.id),
    ...hard.map(t => t.id)
  ];

  console.log(`\n🎲 Hra ${run}:`);
  console.log(`   Easy:   ${queue.slice(0, 3).join(', ')}`);
  console.log(`   Medium: ${queue.slice(3, 6).join(', ')}`);
  console.log(`   Hard:   ${queue.slice(6, 8).join(', ')}`);
}

console.log("\n✅ Vidíš rôzne poradie? Shuffle funguje!");
console.log("\n💡 Teraz REFRESH stránku (F5) a klikni 'Play'");
console.log("   Potom spusti: JSON.parse(localStorage.getItem('nail-art-queue'))");
```

### Očakávaný výstup:

```
🎲 TEST NÁHODNÉHO GENEROVANIA ÚLOH
==================================================

✅ 1. localStorage vymazaný

📋 POROVNANIE 3 SHUFFLED QUEUES:
--------------------------------------------------

🎲 Hra 1:
   Easy:   easy-bloom, easy-berry, easy-rainbow
   Medium: medium-romance, medium-ice, medium-fiesta
   Hard:   hard-neon, hard-breakup

🎲 Hra 2:
   Easy:   easy-rainbow, easy-bloom, easy-berry
   Medium: medium-fiesta, medium-romance, medium-ice
   Hard:   hard-breakup, hard-neon

🎲 Hra 3:
   Easy:   easy-berry, easy-rainbow, easy-bloom
   Medium: medium-ice, medium-fiesta, medium-romance
   Hard:   hard-neon, hard-breakup

✅ Vidíš rôzne poradie? Shuffle funguje!
```

**Čo vidíme:**
- ✅ Každá hra má **iné poradie** easy úloh
- ✅ Každá hra má **iné poradie** medium úloh
- ✅ Ale **easy vždy prv**, medium v strede, hard na konci

---

## ⚡ Spôsob 2: Vizuálna kontrola v hre

### Krok po kroku:

#### Test 1: Prvá hra
```
1. Otvor hru: http://localhost:5173/
2. F12 → Console → localStorage.clear()
3. F5 (refresh)
4. Klikni "Play"
5. Pozri sa na TOP BAR level chips
```

**Môžeš vidieť napríklad:**
```
[1] Jarný kvet (easy-bloom) ← Aktuálna
[2] Sladká jahoda (easy-berry)
[3] Pastelový dúhový deň (easy-rainbow)
[4] Letná fiesta (medium-fiesta)
...
```

#### Test 2: Druhá hra
```
1. Klikni "🏠 Hlavné menu"
2. Klikni "Nová hra"
3. Pozri sa na TOP BAR
```

**Teraz môžeš vidieť napríklad:**
```
[1] Sladká jahoda (easy-berry) ← INÉ ako predtým!
[2] Pastelový dúhový deň (easy-rainbow)
[3] Jarný kvet (easy-bloom)
[4] Večerná romantika (medium-romance)
...
```

**Dôkaz:** Prvá úloha sa **zmenila** z "Jarný kvet" na "Sladká jahoda"! ✅

---

## ⚡ Spôsob 3: localStorage Inspector

### V Chrome DevTools:

```
1. F12 → Application tab
2. Storage → Local Storage → http://localhost:5173
3. Nájdi kľúč: "nail-art-queue"
4. Pozri hodnotu
```

**Príklad hodnoty:**
```json
["easy-rainbow","easy-bloom","easy-berry","medium-ice","medium-fiesta","medium-romance","hard-breakup","hard-neon"]
```

**Skontroluj:**
- ✅ Prvé 3 začínajú s `easy-`
- ✅ Ďalšie 3 začínajú s `medium-`
- ✅ Posledné 2 začínajú s `hard-`

**Teraz vytvor novú hru a znova skontroluj - poradie by malo byť iné!**

---

## 📊 Kompletný test scenár (pre cvičiaceho)

### Scenár: Dokončenie celého cyklu

```javascript
// V CONSOLE:

// Začiatok: Nová hra
localStorage.clear();
location.reload();
// → Klikni "Play"

// Krok 1: Skontroluj počiatočnú queue
let q = JSON.parse(localStorage.getItem('nail-art-queue'));
console.log('1. Začiatok:', q.length, 'úloh');
console.log('   Prvá úloha:', q[0]);

// Krok 2-9: Po každej dokončenej úlohe
// → Dokončíš úlohu v hre, klikneš "Ďalší level"
q = JSON.parse(localStorage.getItem('nail-art-queue'));
console.log('2. Po 1. úlohe:', q.length, 'úloh zostáva');

// ... opakuj pre úlohy 2-8

// Krok 10: Po dokončení všetkých 8 úloh
q = JSON.parse(localStorage.getItem('nail-art-queue'));
console.log('10. Po 8. úlohe (re-shuffle):', q.length, 'úloh');
console.log('    NOVÉ poradie:', q);
```

**Očakávaný priebeh:**
```
1. Začiatok: 8 úloh
   Prvá úloha: easy-bloom

2. Po 1. úlohe: 7 úloh zostáva
3. Po 2. úlohe: 6 úloh zostáva
4. Po 3. úlohe: 5 úloh zostáva
5. Po 4. úlohe: 4 úlohy zostáva
6. Po 5. úlohe: 3 úlohy zostáva
7. Po 6. úlohe: 2 úlohy zostáva
8. Po 7. úlohe: 1 úloha zostáva

10. Po 8. úlohe (re-shuffle): 8 úloh
    NOVÉ poradie: ["easy-berry", "easy-rainbow", ...] ← Iné ako začiatkom!
```

---

## 🎯 Jeden príkaz pre kontrolu všetkého

Skopíruj do Console:

```javascript
// KOMPLETNÝ TEST V JEDNOM PRÍKAZE
(function testShuffle() {
  console.clear();
  console.log("🎲 AUTOMATICKÝ TEST SHUFFLE\n" + "=".repeat(60));

  // Načítaj aktuálnu queue z hry
  const queue = JSON.parse(localStorage.getItem('nail-art-queue'));

  if (!queue || queue.length === 0) {
    console.log("❌ Queue neexistuje. Klikni 'Play' v hre najprv!");
    return;
  }

  console.log("\n📋 Aktuálna queue má", queue.length, "úloh:");
  console.log(JSON.stringify(queue, null, 2));

  // Kontrola difficulty poradia
  const easyCount = queue.filter(id => id.startsWith('easy-')).length;
  const mediumCount = queue.filter(id => id.startsWith('medium-')).length;
  const hardCount = queue.filter(id => id.startsWith('hard-')).length;

  console.log("\n🔍 Analýza:");
  console.log("   Easy úlohy:", easyCount, "→", queue.slice(0, easyCount));
  console.log("   Medium úlohy:", mediumCount, "→", queue.slice(easyCount, easyCount + mediumCount));
  console.log("   Hard úlohy:", hardCount, "→", queue.slice(easyCount + mediumCount));

  // Kontrola správnosti
  const firstEasy = queue.slice(0, easyCount).every(id => id.startsWith('easy-'));
  const thenMedium = queue.slice(easyCount, easyCount + mediumCount).every(id => id.startsWith('medium-'));
  const lastHard = queue.slice(easyCount + mediumCount).every(id => id.startsWith('hard-'));

  if (firstEasy && thenMedium && lastHard) {
    console.log("\n✅ PASSED: Obtiažnosť je v správnom poradí!");
  } else {
    console.log("\n❌ FAILED: Obtiažnosť nie je v správnom poradí!");
  }

  // Porovnanie s pôvodným poradím
  const original = [
    "easy-berry", "easy-rainbow", "easy-bloom",
    "medium-ice", "medium-fiesta", "medium-romance",
    "hard-neon", "hard-breakup"
  ];

  const isDifferent = queue.some((id, i) => id !== original[i]);

  if (isDifferent) {
    console.log("✅ PASSED: Poradie je iné ako pôvodné (shuffle funguje)!");
  } else {
    console.log("⚠️  WARNING: Poradie je rovnaké ako pôvodné (náhoda alebo chyba?)");
    console.log("   Skús vytvoriť novú hru - shuffle by mal dať iné poradie");
  }

  console.log("\n💡 TIP: Pre nový test:");
  console.log("   1. Klikni '🏠 Hlavné menu'");
  console.log("   2. Klikni 'Nová hra'");
  console.log("   3. Spusti tento test znova");
  console.log("\n" + "=".repeat(60));
})();
```

---

## ✅ Výsledok úspešného testu:

Ak všetko funguje správne, uvidíš:

```
🎲 AUTOMATICKÝ TEST SHUFFLE
============================================================

📋 Aktuálna queue má 8 úloh:
[
  "easy-bloom",
  "easy-rainbow",
  "easy-berry",
  "medium-romance",
  "medium-ice",
  "medium-fiesta",
  "hard-breakup",
  "hard-neon"
]

🔍 Analýza:
   Easy úlohy: 3 → [ 'easy-bloom', 'easy-rainbow', 'easy-berry' ]
   Medium úlohy: 3 → [ 'medium-romance', 'medium-ice', 'medium-fiesta' ]
   Hard úlohy: 2 → [ 'hard-breakup', 'hard-neon' ]

✅ PASSED: Obtiažnosť je v správnom poradí!
✅ PASSED: Poradie je iné ako pôvodné (shuffle funguje)!

💡 TIP: Pre nový test:
   1. Klikni '🏠 Hlavné menu'
   2. Klikni 'Nová hra'
   3. Spusti tento test znova

============================================================
```

---

## 🎓 Pre cvičiaceho: Čo hodnotiť?

### ✅ Správne implementované:
1. **Náhodnosť**: Každá nová hra má iné poradie úloh
2. **Difficulty progression**: Easy → Medium → Hard vždy zachované
3. **Non-repetition**: Queue sa zmenšuje, úlohy sa neopakujú
4. **Re-shuffle**: Po dokončení všetkých sa vytvorí nové náhodné poradie
5. **Persistence**: Uloženie stavu do localStorage

### ❌ Chybná implementácia by mala:
- Vždy rovnaké poradie (nie shuffle)
- Zmiešané difficulty (hard pred easy)
- Opakovanie úloh pred dokončením všetkých
- Žiadny re-shuffle po dokončení cyklu

---

## 📝 Jednoduchá kontrola pre cvičiaceho (10 sekúnd):

```
1. F12 → Console
2. localStorage.clear()
3. location.reload()
4. Klikni "Play"
5. JSON.parse(localStorage.getItem('nail-art-queue'))

→ Vidíš 8 úloh v tvare: ["easy-...", "easy-...", "easy-...", "medium-...", ...]
→ Prvá easy úloha NIE JE vždy "easy-berry" (ak je náhodná, je to správne!)
```

✅ **Ak prvá úloha môže byť easy-berry ALEBO easy-rainbow ALEBO easy-bloom, shuffle funguje!**
