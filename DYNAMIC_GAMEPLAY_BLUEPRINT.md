# Dokumentácia: Dynamické vykresľovanie a škálovanie hrateľnosti (Dynamic Gameplay Sandbox)

Tento dokument popisuje implementované klientske zmeny v balíčku `client` projektu **dusan-game**. Zmeny prinášajú **plne funkčný, interaktívny a dynamický herný sandbox** priamo v prehliadači, ktorý vizualizuje stav simulácie Ohmovho zákona, spravuje 3D postavy na aréne a dynamicky mení post-processing scény na základe stavu hry.

---

## 1. Prehľad implementovaných zmien na kliente

Urobili sme kompletný refaktoring klientskej vrstvy pre dosiahnutie plynulej hrateľnosti a vizuálnej odozvy bez závislosti od spusteného backendu:

1.  **Vytvorenie lokálnej hernej slučky ([App.jsx](file:///home/rhoddos_berger/Documents/Github/dusan-game/packages/client/src/App.jsx)):**
    *   Pridaný **Sandbox Mód (Offline Sandbox)**. Ak server nie je spustený alebo zlyhá pripojenie, hra sa automaticky prepne do sandboxu.
    *   Hráč môže hrať karty zo svojej ruky, zvoliť cieľ na 3D aréne a spustiť akciu.
    *   Aplikujú sa presné pravidlá Ohmovho zákona ($I = V/R$), vrátane prepočtu odporu, generovania systémového tepla (`systemHeat`) a vyvolania termodynamickej očisty (odstránenie najslabšej entity).
2.  **Rozšírenie 3D Vizualizácie ([HexagonNode3D.jsx](file:///home/rhoddos_berger/Documents/Github/dusan-game/packages/client/src/components/HexagonNode3D.jsx)):**
    *   Pridaný parameter `occupyingThread`. Hráči a pomocníci sú dynamicky vykresľovaní na svojich skutočných koordinátoch ako 3D valce s farbami zodpovedajúcimi ich frakcii (azúrová pre Crystal AI, fialová pre Hacker Root, žltá pre pomocníkov).
    *   Nad vybraným hexagónom levituje 3D wireframe neónový prstenec (torus) označujúci cieľ akcie.
3.  **Dynamický HUD Overlay ([ArenaUIOverlay.jsx](file:///home/rhoddos_berger/Documents/Github/dusan-game/packages/client/src/components/ArenaUIOverlay.jsx)):**
    *   **Ruka kariet:** Karta sa po kliknutí označí (získa neónový okraj a nadvihne sa). Lokálne ID prekladáme do slovenčiny a zobrazujeme herné popisy podľa pravidiel *Poslední kmen*.
    *   **Live Telemetry Log:** Každý pohyb, úspešný zásah alebo zlyhanie útokov kvôli odporu generuje detailnú telemetrickú správu o napätí, odpore a prúde.
    *   **Ovládacie prvky:** Pridané slidery na manuálne ovládanie entropie pre post-processing a tlačidlá na resetovanie a prepínanie módov.
4.  **Optimalizácia PostCSS a Tailwind v4:**
    *   Nainštalovaný balíček `@tailwindcss/postcss` a prekonfigurovaný [postcss.config.js](file:///home/rhoddos_berger/Documents/Github/dusan-game/packages/client/postcss.config.js), čo zaistilo úspešnú produkčnú kompiláciu projektu bez chýb.

---

## 2. Charakteristika dynamických vzorov (Dynamic Patterns)

### A. Vizuálne škálovanie (Dynamic Shader Scaling)
Aplikácia reaguje na premennú entropie (`entropy`) v reálnom čase. Hodnota mení parametre post-processingu scény:
*   **Bloom:** Zabezpečuje snovú kyberpunkovú žiaru neónov.
*   **Chromatic Aberration (Farebná odchýlka):** Pri `entropy > 30%` sa začnú kraje obrazovky rozostrovať do červeno-modrých kanálov, čo simuluje nestabilitu systému.
*   **Glitch:** Pri kritickej entropii (`entropy > 75%`) sa na 3D aréne spúšťajú náhodné fragmentácie obrazu (Glitch), indikujúce kolaps procesora.

### B. Vyhodnocovací obvod (Ohmic Evaluation Circuit)
Keď používateľ klikne na kartu "Hadí útok" (hadId: `snakeAttack`) a zacieli na nepriateľa na pozícii `M8_S6`:
1.  Inštrukcia sa načíta s $Voltage = 3$ (napätie).
2.  Odpor terča je napr. $Resistance = 1$.
3.  Prúd sa vypočíta ako $I = 3 / 1 = 3.0 \ge 1.0$ $\rightarrow$ Zásah úspešný, nepriateľ stratí $2$ body integrity.
4.  Udalosť sa okamžite zapíše do telemetrického logu:
    `[TOXIC] Zahral "SNAKEATTACK" na King AI. Odpor: 1, Prúd I: 3.00 >= 1. Úspešný zásah za -2 HP!`

Týmto spôsobom je zaistené, že gameplay a frontend tvoria jeden živý, dynamický celok reagujúci na akýkoľvek podnet používateľa.
