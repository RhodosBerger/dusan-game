# Dušan Game: The Last Tribe — experimentálna taktická hexová hra

**Dušan Game (The Last Tribe)** je experimentálna open-source hra a vývojový projekt zameraný na taktické súboje na hexovej aréne, karty, procedurálne generovanie sveta a 3D herné rozhranie. Repozitár obsahuje React/Three.js klienta, TypeScript herné a serverové balíky a samostatnú Go HTTP službu.

> **Stav:** aktívny prototyp a učebný projekt — nie je pripravený na produkčné nasadenie. Čistá inštalácia a aktuálny CI workflow majú známe problémy. Funkcie, ktoré sú v kóde, nemusia byť plne otestované ani dokončené.

[Preskúmať zdrojový kód](https://github.com/RhodosBerger/dusan-game) · [Nahlásiť problém](https://github.com/RhodosBerger/dusan-game/issues) · [Pull requests](https://github.com/RhodosBerger/dusan-game/pulls) · [Pravidlá hry](RULES.md)

## O hre

The Last Tribe skúma taktickú hru na hexovej mape, v ktorej sa stretávajú karty, pohyb, súboje a procedurálne herné systémy. Projekt je určený hráčom, ktorí chcú preskúmať prototyp, a vývojárom, ktorí sa zaujímajú o vývoj hier v Reacte a TypeScripte, 3D vykresľovanie cez Three.js, real-time komunikáciu cez Socket.IO alebo hranice medzi Node.js a Go službou.

Repozitár je verejný priestor na experimentovanie a prispievanie. Roadmapy a blueprinty opisujú aj budúce nápady; nepovažujte ich automaticky za hotové funkcie.

## Funkcie a oblasti experimentovania

- **Taktická hexová aréna:** herné jednotky, pohyb, karty a súboje v serverovej hernej logike.
- **3D herný klient:** React, Vite, Three.js a React Three Fiber.
- **Procedurálny svet:** zdieľané moduly v TypeScripte vrátane nástrojov na prácu s hexovou geometriou a generovaním terénu.
- **Real-time komunikácia:** Express/Socket.IO server a Socket.IO klient.
- **Go Core prototyp:** HTTP endpointy pre výpočty a syntézu; telemetria sa momentálne ukladá v pamäti procesu.
- **Lokálny sandbox:** klient obsahuje fallbackové herné správanie; úplný online/offline priechod treba overiť.

Tieto body opisujú kód a experimenty v repozitári, nie garanciu produkčnej kvality, dostupnosti, bezpečnosti ani úplnosti hry.

## Technológie

- **Klient a 3D:** React, TypeScript/JavaScript, Vite, Three.js, React Three Fiber
- **Herný server:** Node.js, TypeScript, Express, Socket.IO
- **Zdieľané moduly:** TypeScript
- **Výpočtová služba:** Go, HTTP
- **Ďalší samostatný experiment:** Laravel aplikácia v `laravel_app/`
- **Testovacie nástroje:** Vitest a Playwright konfigurácie/testy; aktuálny stav testov si overte spustením CI

## Štruktúra repozitára

| Cesta | Obsah |
| --- | --- |
| `packages/client/` | React/Vite 3D herný klient |
| `packages/shared/` | Zdieľané herné a procedurálne moduly |
| `packages/server/` | Node.js herný server a Socket.IO komunikácia |
| `packages/go-core/` | Go HTTP služba pre výpočty a telemetriu |
| `laravel_app/` | Samostatná Laravel/Vite aplikácia |
| `e2e/` | End-to-end testy |

## Stav vývoja a známe obmedzenia

Kontrola verejného repozitára z 4. novembra 2026 ukázala, že posledný kontrolovaný CI beh zlyhal pri `npm ci`: manifesty závislostí a `package-lock.json` nie sú zosúladené. Zlyhanie nastalo ešte pred tým, ako CI potvrdilo následné buildy a testy.

Pred nasadením treba okrem iného:

1. Zosúladiť `package.json` a `package-lock.json` a overiť čistú inštaláciu.
2. Zjednotiť verziu Go požadovanú v `packages/go-core/go.mod` s CI a Docker konfiguráciou.
3. Zosúladiť npm/Yarn príkazy a cesty v Docker buildoch.
4. Zjednotiť skutočne používané úložisko; serverový kód používa lokálnu SQLite databázu, zatiaľ čo Prisma schéma deklaruje PostgreSQL.
5. Odstrániť predvolené vývojové heslá z Compose, obmedziť verejný prístup k službám a vykonať bezpečnostnú kontrolu.
6. Spustiť unit, integration a E2E testy na čistej inštalácii a otestovať nasadenie v staging prostredí.

`docker-compose.yml` je určený na lokálne experimentovanie a obsahuje vývojové prihlasovacie údaje. Nepoužívajte ho nezmenený ako verejné produkčné nasadenie. Viac informácií: [`PRODUCTION_READY.md`](PRODUCTION_READY.md).

## Lokálne skúmanie

Projekt obsahuje viac balíkov a nezhodné závislostné manifesty, preto zatiaľ nemožno zaručiť, že nasledujúce kroky uspejú na čistej inštalácii. Po oprave lockfile si overte deklarované workspace názvy a skripty v príslušných `package.json` súboroch.

```bash
# Po zosúladení package.json a package-lock.json
npm ci

# Build zdieľaného modulu a klienta
npm run build --workspace=@dusan-game/shared
npm run build --workspace=client
```

## Dokumentácia

- [`RULES.md`](RULES.md) — pravidlá a herné mechaniky.
- [`NEW_INTEGRATION_GOALS.md`](NEW_INTEGRATION_GOALS.md) — roadmapa a integračné ciele.
- [`TARGET_VISION_BLUEPRINT.md`](TARGET_VISION_BLUEPRINT.md) — cieľová vízia; nie je potvrdením implementácie.
- [`GAME_STATUS.md`](GAME_STATUS.md) — historické poznámky o stave projektu.
- [`PRODUCTION_READY.md`](PRODUCTION_READY.md) — aktuálne posúdenie produkčnej pripravenosti a release gates.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — pokyny na prispievanie.

## Prispievanie

Uvítame reprodukovateľné bug reporty, testy, zlepšenia prístupnosti, dokumentáciu a malé, overiteľné herné zmeny. Pri nahlásení chyby uveďte prostredie, kroky na reprodukciu a očakávané aj skutočné správanie. Do issue ani logov nevkladajte heslá, tokeny ani iné tajné údaje.

## Licencia

Pred redistribúciou alebo komerčným použitím overte licenciu projektu, zdrojových súborov a závislostí. Balíkový manifest uvádza MIT, no koreňový licenčný súbor treba skontrolovať.
