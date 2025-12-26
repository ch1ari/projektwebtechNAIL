# 🧪 Návod na Testovanie PWA - Nail Art Match

## ⚡ RÝCHLY ŠTART

### Krok 1: Build projektu (ak ste ešte neurobili)

```bash
npm run build
```

### Krok 2: Spustite lokálny HTTP server

**Možnosť A - Použiť npx serve (odporúčané):**
```bash
npx serve dist -p 3000
```

**Možnosť B - Použiť Python (ak máte nainštalovaný):**
```bash
cd dist
python3 -m http.server 3000
```

**Možnosť C - Použiť PHP (ak máte nainštalovaný):**
```bash
cd dist
php -S localhost:3000
```

Po spustení servera by ste mali vidieť:
```
   ┌────────────────────────────────────────┐
   │                                        │
   │   Serving!                             │
   │                                        │
   │   Local:  http://localhost:3000        │
   │                                        │
   └────────────────────────────────────────┘
```

### Krok 3: Otvorte v prehliadači

Otvorte **Google Chrome** alebo **Microsoft Edge** a choďte na:
```
http://localhost:3000
```

---

## 🔍 TESTOVANIE PWA FUNKCIONALITY

### Test 1: Overenie Web App Manifestu

1. **Otvorte Chrome DevTools** - stlačte `F12`

2. **Prejdite na záložku "Application"**
   - Ak nevidíte "Application", kliknite na `>>` a vyberte ju

3. **V ľavom menu kliknite na "Manifest"**

   ✅ **Mali by ste vidieť:**
   ```
   Identity
   ├─ Name: Nail Art Match - Nail Salon Puzzle
   ├─ Short name: Nail Art Match
   └─ Description: Nail salon puzzle pre dievčatá...

   Presentation
   ├─ Start URL: /
   ├─ Theme color: #d946b5 (ružová)
   ├─ Background color: #fef3f8
   └─ Display mode: standalone

   Icons
   └─ /favicon.svg (any x any)
   ```

   ❌ **Ak vidíte chyby**, skontrolujte console a opravte ich.

---

### Test 2: Overenie Service Workera

1. **V DevTools → Application → "Service Workers"**

   ✅ **Mali by ste vidieť:**
   ```
   Source: sw.js
   Status: 🟢 activated and is running
   ```

   📋 **Tlačidlá na testovanie:**
   - `Update` - Aktualizuje Service Worker
   - `Unregister` - Odregistruje SW (pre testovanie)
   - `Offline` - Simuluje offline režim

2. **Skontrolujte Console (F12 → Console)**

   ✅ **Mali by ste vidieť:**
   ```
   ✅ Service Worker registered successfully: /
   [Service Worker] Installing...
   [Service Worker] Caching static assets
   [Service Worker] Installed successfully
   [Service Worker] Activating...
   [Service Worker] Activated successfully
   ```

---

### Test 3: Overenie Cache

1. **V DevTools → Application → "Cache Storage"**

   ✅ **Mali by ste vidieť 2 cache:**
   ```
   📦 nail-art-static-v1
   │  ├─ http://localhost:3000/
   │  ├─ http://localhost:3000/index.html
   │  ├─ http://localhost:3000/instructions.html
   │  ├─ http://localhost:3000/favicon.svg
   │  └─ http://localhost:3000/manifest.json

   📦 nail-art-match-v1
   │  ├─ /assets/main-*.js
   │  ├─ /assets/main-*.css
   │  └─ [ostatné dynamicky načítané súbory]
   ```

2. **Kliknite na jednotlivé cache** a skontrolujte obsah

---

### Test 4: Offline Režim 🔥 NAJDÔLEŽITEJŠÍ TEST

1. **Otvorte hru a nechajte ju načítať (počkajte 3-5 sekúnd)**

2. **V DevTools → Network Tab**
   - Zaškrtnite checkbox **"Offline"** ☑️

3. **Reloadnite stránku (Ctrl+R alebo F5)**

   ✅ **Výsledok:** Hra by sa mala načítať aj offline!

   ❌ **Ak vidíte "No internet" chybu:**
   - Service Worker sa ešte nenainštaloval
   - Počkajte pár sekúnd a skúste znova
   - Skontrolujte Console pre chyby

4. **Testujte funkcionalitu:**
   - Kliknite na farby ✅
   - Drag and drop nálepiek ✅
   - Prechod medzi levelmi ✅
   - localStorage (štatistiky) ✅

5. **Vypnite offline režim** - odznačte "Offline"

---

### Test 5: Lighthouse PWA Audit

1. **V DevTools → "Lighthouse" Tab**
   - Ak nevidíte Lighthouse, kliknite na `>>` a vyberte ho

2. **Nastavenia:**
   - ☑️ **Progressive Web App**
   - ☐ Performance (voliteľné)
   - ☐ Accessibility (voliteľné)
   - ☐ Best Practices (voliteľné)
   - ☐ SEO (voliteľné)
   - Device: Desktop alebo Mobile

3. **Kliknite "Analyze page load"**

4. **Počkajte na výsledky (10-30 sekúnd)**

   ✅ **Očakávané skóre:**
   ```
   Progressive Web App
   ████████████████████ 90-100/100

   ✅ Installable
   ✅ PWA Optimized
   ✅ Uses HTTPS (alebo localhost)
   ✅ Registers a service worker
   ✅ Responds with a 200 when offline
   ✅ Contains a web app manifest
   ✅ Has a maskable icon
   ```

   ❌ **Ak je skóre nízke (<80):**
   - Prečítajte si "Failed audits"
   - Opravte chyby podľa návodu

---

### Test 6: Inštalácia Aplikácie

#### Desktop (Chrome/Edge):

1. **V address bare (vpravo) by sa mala zobraziť ikona:**
   ```
   🖥️ [Inštalovať Nail Art Match]
   ```

2. **Kliknite na ikonu**
   - Zobrazí sa dialog "Install app?"

3. **Kliknite "Install"**

   ✅ **Výsledok:**
   - Aplikácia sa otvorí v samostatnom okne
   - Bez browser chrome (bez URL baru)
   - Ikona sa pridá do Start Menu / Applications

4. **Testujte standalone režim:**
   - Otvorte hru cez Start Menu
   - Mala by sa otvoriť ako desktop aplikácia

#### Mobile (Android Chrome):

1. **Otvorte `http://[vaša-ip-adresa]:3000` na mobile**
   - Zistite IP: `ipconfig` (Windows) alebo `ifconfig` (Linux/Mac)

2. **Chrome zobrazí banner:**
   ```
   📱 Pridať Nail Art Match na domovskú obrazovku?
   [Pridať]  [Zrušiť]
   ```

3. **Kliknite "Pridať"**

   ✅ **Výsledok:**
   - Ikona sa pridá na home screen
   - Aplikácia sa otvorí v fullscreen móde

#### iOS (Safari):

1. **Otvorte v Safari**

2. **Tlačidlo "Share" (Zdieľať) → "Add to Home Screen"**

3. **Aplikácia sa pridá na home screen**

---

## ✅ KONTROLNÝ ZOZNAM

Označte každý test, ktorý prešiel:

- [ ] ✅ Web App Manifest sa načítava správne
- [ ] ✅ Service Worker je aktivovaný a beží
- [ ] ✅ Cache obsahuje statické súbory
- [ ] ✅ Offline režim funguje (hra sa načíta offline)
- [ ] ✅ Lighthouse PWA skóre je 90+
- [ ] ✅ Inštalácia funguje (desktop alebo mobile)

Ak je **všetkých 6 testov OK**, PWA je plne funkčná! 🎉

---

## 🐛 RIEŠENIE PROBLÉMOV

### Problém 1: Service Worker sa neregistruje

**Symptóm:**
```
❌ Service Worker registration failed
```

**Riešenie:**
1. Skontrolujte Console pre chyby
2. Overte, že `sw.js` existuje v `dist/`
3. Skúste hard refresh: `Ctrl+Shift+R`
4. Clear cache: DevTools → Application → Clear storage

---

### Problém 2: Offline režim nefunguje

**Symptóm:**
```
No internet connection
Dinosaur game 🦖
```

**Riešenie:**
1. Počkajte 5-10 sekúnd po načítaní (SW sa inštaluje)
2. Skontrolujte Cache Storage - mali by byť 2 cache
3. Reloadnite stránku bez offline módu
4. Potom zapnite offline a reloadnite znova

---

### Problém 3: Manifest sa nenačítava

**Symptóm:**
```
⚠️ Manifest: Line 1, column 1, Unexpected token
```

**Riešenie:**
1. Overte syntax v `dist/manifest.json`
2. Skontrolujte path: `/manifest.json` musí existovať
3. Overte Content-Type: `application/manifest+json`

---

### Problém 4: Lighthouse nízke skóre

**Riešenie podľa chýb:**

**"Page does not work offline"**
→ Service Worker sa neregistroval správne

**"Does not provide a valid apple-touch-icon"**
→ Voliteľné pre iOS, môžete ignorovať

**"Manifest doesn't have a maskable icon"**
→ Už je opravené (`purpose: "any maskable"`)

---

## 🚀 DEPLOY NA PRODUKCIU

Po úspešnom testovaní:

1. **Push na GitHub:**
   ```bash
   git push origin your-branch
   ```

2. **Deploy na server** (Vercel, Netlify, atď.)
   - PWA funguje automaticky
   - HTTPS je povinné (localhost je OK pre testing)

3. **Testujte na produkčnej URL:**
   - Lighthouse audit
   - Offline režim
   - Inštalácia

---

## 📱 TESTOVANIE NA MOBILE (Voliteľné)

1. **Zistite svoju IP adresu:**
   ```bash
   # Windows
   ipconfig

   # Linux/Mac
   ifconfig | grep inet
   ```

2. **Spustite server s IP binding:**
   ```bash
   npx serve dist -p 3000 --listen 0.0.0.0
   ```

3. **Na mobile otvorte:**
   ```
   http://[vaša-ip]:3000
   ```
   Napr.: `http://192.168.1.100:3000`

4. **Testujte všetky funkcie:**
   - Touch ovládanie
   - Offline režim
   - Inštalácia
   - Standalone mód

---

## 📊 OČAKÁVANÉ VÝSLEDKY

Po úspešnom testovaní by ste mali mať:

✅ **PWA Functionality**
- Manifest.json načítaný
- Service Worker aktívny
- Cache funguje
- Offline režim OK
- Lighthouse 90+

✅ **Installation**
- Desktop inštalácia
- Mobile inštalácia (voliteľné)
- Standalone režim

✅ **User Experience**
- Rýchle načítanie (cache)
- Offline podpora
- App-like pocit

---

**Úspešné testovanie = Projekt je hotový! 🎉**

Ak máte problémy, skontrolujte Console a postupujte podľa sekcie "Riešenie problémov".
