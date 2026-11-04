# Dušan Game · The Last Tribe

**Experimentálna taktická hra na hexovej aréne s kartami, procedurálnym svetom a 3D klientom.** Tento verejný repozitár je vo vývoji a zároveň slúži ako učebný projekt pre herný klient, real-time komunikáciu a backendové služby.

[Zdrojový kód](https://github.com/RhodosBerger/dusan-game) · [Issues](https://github.com/RhodosBerger/dusan-game/issues) · [Pull requests](https://github.com/RhodosBerger/dusan-game/pulls) · [Roadmapa](NEW_INTEGRATION_GOALS.md)

> **Stav projektu: experimentálny / nie je pripravený na produkčné nasadenie.** Toto hodnotenie vychádza z kódu a CI stavu skontrolovaných 4. novembra 2026. Hlavná vetva má opakované neúspešné CI behy. Nejde o potvrdenú funkčnú produkčnú službu; lokálne spustenie, čistý build a kompletný herný priechod treba overiť.

## Stav podľa dôkazov v repozitári

| Oblasť | Čo je v kóde | Aktuálny stav |
| --- | --- | --- |
| Herný klient | React/Vite/Three.js klient v `packages/client`, vrátane Socket.IO klienta a herných komponentov | Implementovaný experimentálny klient; produkčný build a používateľský priechod nie sú týmto README potvrdené |
| Herná logika a server | TypeScript balíky `packages/shared` a `packages/server`; server používa Express a Socket.IO | Funkcie a herné mechaniky sú v kóde; stabilita, bezpečnostné hranice a end-to-end správanie potrebujú testovanie |
| Go Core | HTTP handlery pre syntézu, výpočty a telemetriu v `packages/go-core` | Prototyp. Telemetria je uložená v pamäti procesu; GPS súradnice sú odvodené z ukážkového vzorca, nie z polohy hráča |
| Úložisko | Server inicializuje `DatabaseSyncManager` s lokálnou SQLite databázou; Prisma schéma deklaruje PostgreSQL | Architektúra úložiska je nejednotná. Docker Compose deklaruje PostgreSQL/Redis, no to samo osebe nedokazuje ich používanie herným serverom |
| CI/CD | `.github/workflows/ci.yml` deklaruje build, testy, E2E a publikovanie Docker image | Aktuálne nefunkčné/neoverené: posledný kontrolovaný beh zlyhal na `npm ci`, pretože lockfile nezodpovedá `package.json`. Ďalšie kroky pipeline nie sú týmto behom potvrdené |
| Kontajnery | Root Dockerfile súbory a `docker-compose.yml` | Pred produkciou treba opraviť rozdiel medzi npm lockfile a Yarn príkazmi, zosúladiť cesty image buildov a odstrániť predvolené prihlasovacie údaje |
| Laravel aplikácia | Samostatný adresár `laravel_app/` | Vedľajší projekt; jeho produkčné prepojenie s herným serverom nie je potvrdené |
| Licencia | Balíkový manifest uvádza MIT, ale README/repozitár upozorňuje na chýbajúci alebo neoverený koreňový licenčný súbor | Pred redistribúciou si overte licenciu všetkých častí a závislostí |

### Známe technické rozpory

- CI nastavuje Go `1.22`, ale `packages/go-core/go.mod` požaduje Go `1.26.4`.
- CI používa `npm ci`; posledný zaznamenaný beh hlási, že v lockfile chýbajú závislosti vrátane Playwright, `serve` a `wait-on`.
- `Dockerfile.server` a `Dockerfile.client` kopírujú npm lockfile, ale inštalujú a spúšťajú Yarn príkazy.
- Docker Compose používa vývojové heslá a sprístupňuje databázové porty. **Nepoužívajte ho ako verejný produkčný setup bez úprav.**
- `PRODUCTION_READY.md` obsahuje tvrdenia o hotovej platforme a 95 % kompletnosti, ktoré aktuálny kód/CI stav nepodporuje. Považujte ho za historický návrhový dokument, nie za dôkaz produkčnej pripravenosti.

## Technológie a štruktúra

- `packages/client/` — React, Vite, Three.js a Socket.IO klient.
- `packages/shared/` — zdieľané herné a procedurálne moduly v TypeScripte.
- `packages/server/` — Express/Socket.IO server a herná logika.
- `packages/go-core/` — samostatná Go HTTP služba.
- `laravel_app/` — samostatná Laravel/Vite aplikácia.
- `docker-compose.yml` — lokálne deklarácie databázy, Redis a služieb; konfigurácia nie je produkčne bezpečná.

## Lokálne skúmanie

Pred spustením skontrolujte dostupnosť Node.js/npm a Go verzií z manifestov. Závislosti a workflow sa momentálne nezhodujú, preto nemusí čistá inštalácia ani Compose build fungovať. CI používa `npm ci`, ktoré je pri aktuálnom lockfile známe ako nefunkčné.

```bash
# Po zosúladení package.json a package-lock.json:
npm ci

# Potom podľa potreby:
npm run build --workspace=@dusan-game/shared
npm run build --workspace=client
```

Server, databázu a E2E testy považujte za **neoverené**, kým sa nepodarí spustiť kompletne čistý build, testy a herný priechod v izolovanom prostredí.

## Čo treba pred produkciou

1. Zosúladiť `package.json` a `package-lock.json`; potom obnoviť `npm ci` v CI.
2. Zjednotiť verziu Go v module, workflow a Dockerfile.
3. Urobiť Docker buildy reprodukovateľné a zosúladiť npm/Yarn, build paths a runtime príkazy.
4. Zvoliť a reálne používať jeden databázový backend; pridať bezpečnú konfiguráciu, migrácie a zálohovanie.
5. Odstrániť vývojové heslá, pridať secrets management, autentifikáciu/autorizáciu a bezpečnostné limity pre API a Socket.IO.
6. Spustiť unit, integration a E2E testy na čistej inštalácii; publikovanie image musí závisieť od ich úspechu.
7. Otestovať nasadenie a rollback v staging prostredí; až potom uvažovať o produkcii.
8. Doplniť koreňový licenčný súbor a aktualizovať historické dokumenty tak, aby rozlišovali implementované funkcie od vízie.

## Dokumentácia

- [`RULES.md`](RULES.md) — pravidlá hry.
- [`NEW_INTEGRATION_GOALS.md`](NEW_INTEGRATION_GOALS.md) — ciele a roadmapa.
- [`TARGET_VISION_BLUEPRINT.md`](TARGET_VISION_BLUEPRINT.md) — cieľová vízia, nie záväzok implementácie.
- [`GAME_STATUS.md`](GAME_STATUS.md) — historické poznámky; môžu byť neaktuálne.
- [`PRODUCTION_READY.md`](PRODUCTION_READY.md) — historický návrhový text; jeho produkčné tvrdenia sú nahradené stavom v tomto README.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — prispievanie.

## Prispievanie

Pomôžte reprodukovateľným bug reportom, testami, prístupnosťou, dokumentáciou alebo malými zmenami herných mechaník. V reporte uveďte prostredie, kroky, očakávané a skutočné správanie a relevantné logy; nezverejňujte tajné údaje.
