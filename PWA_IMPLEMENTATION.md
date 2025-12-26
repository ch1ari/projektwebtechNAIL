# PWA Implementácia - Nail Art Match

## ✅ Implementované Komponenty

### 1. **Web App Manifest** (`/assets/manifest.json`)

Manifest definuje vlastnosti PWA aplikácie:

```json
{
  "name": "Nail Art Match - Nail Salon Puzzle",
  "short_name": "Nail Art Match",
  "description": "Nail salon puzzle pre dievčatá. Drag and drop hra s nálepkami a lak na nechty.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fef3f8",
  "theme_color": "#d946b5",
  "orientation": "any",
  "scope": "/",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ],
  "categories": ["games", "entertainment"],
  "lang": "sk",
  "dir": "ltr"
}
```

**Vlastnosti:**
- ✅ `display: "standalone"` - aplikácia sa spúšťa v standalone móde (bez browser chrome)
- ✅ `theme_color` - farba status baru (#d946b5 - ružová)
- ✅ `background_color` - farba splash screenu
- ✅ `orientation: "any"` - funguje v portrait aj landscape
- ✅ Slovenská lokalizácia (`lang: "sk"`)

---

### 2. **Service Worker** (`/assets/sw.js`)

Service Worker zabezpečuje offline funkcionalitu a cachuje zdroje.

**Funkcie:**

#### a) **Install Event** - Cachuje statické assety
```javascript
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/instructions.html',
  '/favicon.svg',
  '/manifest.json'
];
```

Pri inštalácii SW sa tieto súbory uložia do cache, aby boli dostupné offline.

#### b) **Activate Event** - Čistí staré cache
```javascript
caches.keys().then((cacheNames) => {
  return Promise.all(
    cacheNames
      .filter((cacheName) => {
        return cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME;
      })
      .map((cacheName) => caches.delete(cacheName))
  );
});
```

Pri aktivácii nového SW sa zmažú staré cache verzie.

#### c) **Fetch Event** - Cache-first stratégia
```javascript
caches.match(request)
  .then((cachedResponse) => {
    if (cachedResponse) {
      // Vráti z cache
      return cachedResponse;
    }
    // Fetch z internetu a ulož do cache
    return fetch(request).then((response) => {
      cache.put(request, responseToCache);
      return response;
    });
  });
```

**Stratégia:**
1. Najprv skúsi načítať z cache (rýchle)
2. Ak nie je v cache, stiahnuť z internetu
3. Uložiť do cache pre budúce použitie
4. Pri offline režime vrátiť verziu z cache

---

### 3. **Service Worker Registrácia** (`/src/main.jsx`)

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}
```

**Vlastnosti:**
- ✅ Kontrola podpory (`'serviceWorker' in navigator`)
- ✅ Registrácia po načítaní stránky (`window.addEventListener('load')`)
- ✅ Logging pre debugging

---

### 4. **HTML Meta Tagy** (`/index.html`, `/instructions.html`)

```html
<meta name="theme-color" content="#d946b5" />
<link rel="manifest" href="/manifest.json" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Nail Art Match" />
```

**Pridané tagy:**
- ✅ `theme-color` - farba status baru na Android/Chrome
- ✅ `manifest` - link na manifest.json
- ✅ `apple-mobile-web-app-capable` - iOS standalone mód
- ✅ `apple-mobile-web-app-status-bar-style` - iOS status bar štýl
- ✅ `apple-mobile-web-app-title` - iOS názov aplikácie

---

## 🚀 Ako Funguje PWA

### **Inštalácia**

1. **Desktop (Chrome, Edge):**
   - Kliknite na ikonu "Inštalovať" v address bare (vpravo)
   - Alebo Menu → "Inštalovať Nail Art Match"

2. **Android:**
   - Chrome/Firefox zobrazí popup "Pridať na domovskú obrazovku"
   - Po pridaní sa otvorí ako samostatná aplikácia

3. **iOS (Safari):**
   - Tlačidlo "Zdieľať" → "Pridať na plochu"
   - Aplikácia sa pridá medzi ostatné aplikácie

### **Offline Režim**

Po prvom načítaní aplikácie:
1. Service Worker uloží všetky kľúčové súbory do cache
2. Keď stratíte internetové pripojenie, hra funguje aj offline
3. localStorage ukladá progres hry (levely, štatistiky)

### **Aktualizácie**

Pri zmene Service Workera:
1. Nový SW sa nainštaluje na pozadí
2. Pri ďalšom načítaní stránky sa aktivuje nový SW
3. Staré cache sa automaticky zmažú

---

## 📊 Overenie PWA Funkcionality

### **Chrome DevTools (F12)**

1. **Application Tab → Manifest**
   - Skontrolujte, či sa manifest.json načíta správne
   - Overte ikony, farby, názov

2. **Application Tab → Service Workers**
   - Skontrolujte status: "activated and is running"
   - Tlačidlo "Offline" - overte offline režim

3. **Application Tab → Cache Storage**
   - Skontrolujte `nail-art-static-v1` a `nail-art-match-v1`
   - Mali by obsahovať cached súbory

4. **Lighthouse Audit**
   - Run PWA audit
   - Skóre by malo byť 90+

### **Testovanie Offline Režimu**

1. Otvorte hru v Chrome
2. F12 → Network Tab → "Offline" checkbox
3. Reload stránku (Ctrl+R)
4. Hra by mala fungovať normálne

---

## 🔧 Build Process

```bash
npm run build
```

**Výstup:**
```
dist/
  ├── index.html          (PWA HTML s manifest linkom)
  ├── instructions.html   (Návod s PWA meta tagmi)
  ├── manifest.json       (Web App Manifest)
  ├── sw.js               (Service Worker)
  ├── favicon.svg
  ├── assets/
  │   ├── main-*.js      (React bundle s SW registráciou)
  │   └── main-*.css
  └── [ostatné assety]
```

---

## ✅ Splnenie Požiadaviek Zadania

| Požiadavka | Status | Poznámka |
|------------|--------|----------|
| **PWA forma** | ✅ | Manifest + Service Worker |
| **Offline podpora** | ✅ | Cache-first stratégia |
| **Inštalovateľnosť** | ✅ | Desktop + Mobile |
| **Standalone mód** | ✅ | display: "standalone" |
| **Service Worker** | ✅ | Cache + fetch handling |
| **Web App Manifest** | ✅ | Kompletný manifest.json |

---

## 📝 Poznámky

- **Cache stratégia:** Cache-first pre rýchle načítanie
- **Update stratégia:** Nový SW sa aktivuje pri ďalšom načítaní
- **Offline fallback:** Ak súbor nie je v cache, zobrazí sa `/index.html`
- **localStorage:** Hra ukladá progres lokálne (queue, stats)

---

## 🎯 Ďalšie Možné Vylepšenia

1. **Background Sync API** - Synchronizácia štatistík keď sa obnoví pripojenie
2. **Push Notifications** - Notifikácie o nových leveloch
3. **Share API** - Zdieľanie výsledkov
4. **Install Prompt** - Custom install banner
5. **App Shortcuts** - Shortcuts na konkrétne levely

---

## 📚 Zdroje

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

**Implementované dňa:** 2025-12-26
**Verzia:** v1.0
**Autor:** Claude Code
