# Dušan Game · The Last Tribe

**Taktická hra na hexovej aréne, kde sa herné rozhodnutia stretávajú s Ohmovým zákonom, procedurálnym svetom a 3D efektmi.**

Dušan Game je verejný experimentálny projekt aj otvorená učebňa pre ľudí, ktorí chcú skúmať, ako sa prepájajú herný klient, real-time komunikácia, simulácia a backendové služby.

[Preskúmať zdrojový kód](https://github.com/RhodosBerger/dusan-game) · [Otvoriť Issues](https://github.com/RhodosBerger/dusan-game/issues) · [Pozrieť roadmapu](NEW_INTEGRATION_GOALS.md)

> **Transparentne o stave:** Projekt sa aktívne vyvíja. Časť dokumentácie je vízia alebo plán, nie hotová funkcia. Repozitár neprezentuje škálovanie, AI ani monetizáciu ako produkčne overené. Nižšie rozlišujeme medzi tým, čo je viditeľné v kóde, a tým, čo komunita môže pomôcť vybudovať.

## Čo môže zaujať komunitu

- **Herný nápad s jasným háčikom:** karty a akcie sú tematicky postavené na napätí, odpore a prúde; pozri pravidlá a dátový model kariet.
- **Hexový svet na experimentovanie:** procedurálne generovanie, súradnice hexov a geometrické operácie vytvárajú priestor pre nové mapy a biomy.
- **Lokálny sandbox:** klient obsahuje fallback simuláciu, takže sieťové experimenty možno porovnať s lokálnym režimom.
- **Prístupná cesta do projektu:** React/TypeScript klient, Node/TypeScript serverové balíky, Go služba a samostatná Laravel aplikácia poskytujú viac backendových tém na štúdium.
- **Príležitosť ovplyvniť smer:** testovanie, dokumentácia, prístupnosť, stabilizácia vývojového prostredia aj herný dizajn sú konkrétne spôsoby, ako prispieť.

## Ďalšia generácia: princípy, nie marketingové sľuby

Vízia projektu je zaujímavá vtedy, keď sa dá overiť. Tieto princípy pomáhajú meniť ambiciózne blueprinty na udržateľný softvér:

1. **Deterministický svet, ktorý možno zopakovať.** Seedované generovanie umožňuje vytvoriť a zdieľať rovnaký experiment. Základ generovania nájdete v `packages/shared/src/core/BooleanHexCore.ts`; ďalší krok je stabilný formát seedu a reprodukovateľné testovacie scenáre.
2. **Offline-first a odolnosť voči výpadkom.** `ConnectionEngine` ukazuje prepnutie do lokálneho sandboxu pri probléme so spojením. Budúce zmeny by mali jasne odlišovať lokálny tréning od online zápasu a nikdy potichu nevydávať neautorizovaný lokálny stav za serverový.
3. **Malé, vymeniteľné hranice služieb.** Klient, Socket.IO komunikácia a Go HTTP služba sú vhodné na učenie sa kontraktov medzi komponentmi. Službu pridávajme len vtedy, keď rieši konkrétnu potrebu; nie preto, že architektúra znie modernejšie.
4. **Dáta a AI pod ľudskou kontrolou.** Telemetria a automatické návrhy na balans môžu podporiť vývoj, ale nemajú bez kontroly meniť kompetitívne pravidlá. Najprv treba definovať účel, minimalizovať údaje, zdokumentovať ich životný cyklus a návrhy testovať.
5. **Výkon meraný na reálnych zariadeniach.** LOD, streamovanie assetov a adaptívna kvalita sú dobré ciele; tvrdenia o FPS alebo latencii treba podložiť reprodukovateľnými benchmarkmi na pomenovaných zariadeniach.
6. **Prístupnosť ako súčasť herného dizajnu.** Klávesnica, čitateľnosť, farebne nezávislé signály, titulky, znížený pohyb a nastaviteľné otrasy kamery patria do návrhu od začiatku.
7. **Rozšíriteľnosť cez obsah a stabilné kontrakty.** Komunitné mapy, scenáre a kozmetický obsah potrebujú validáciu, verziovanie, pravidlá atribúcie a bezpečný import—nie iba sľub marketplace.
8. **Férová ekonomika a dôvera hráčov.** Ak sa niekedy zavedie monetizácia, prednosť majú jasne ocenené kozmetické alebo podporné položky. Žiadne pay-to-win, platené náhodné odmeny ani zavádzajúci tlak na nákup.

## Čo je v kóde a čo je vízia

| Téma | Viditeľné v repozitári | Ďalší cieľ / otvorená práca |
| --- | --- | --- |
| Klient a aréna | React klient s 3D komponentmi, lobby a Socket.IO klientom | Overiť celý čistý vývojový a produkčný build; zlepšiť mobilné a prístupné ovládanie |
| Hexový svet | `BooleanHexCore` s rasterizáciou tvarov, boolean operáciami a seedovaným generovaním | Opraviť a otestovať okrajové prípady; vytvoriť zdieľateľné mapové scenáre |
| Offline režim | `ConnectionEngine` má sandbox fallback a lokálne ukážkové dáta | Jasné UI režimu, korektná synchronizácia a bezpečný návrat do online hry |
| Go core | HTTP endpointy pre syntézu, výpočty a telemetriu; telemetria je v pamäti procesu | Validácia vstupov, limity, testy, autentifikácia podľa potreby, trvalé a súkromie rešpektujúce úložisko |
| Data/ML blueprinty | Dokumentácia opisuje analytiku a automatické vyvažovanie | Najprv overiť dátový pipeline a kvalitu dát; ML nech iba navrhuje zmeny na review |
| Matchmaking a škálovanie | Roadmapy spomínajú Redis a viac režimov | Zmerať súčasnú kapacitu, definovať ciele a až potom navrhnúť škálovanie |
| Ekonomika | Kód a dokumenty obsahujú experimenty s inventárom/obchodom | Zjednotiť stav dokumentácie; nepredávať hernú výhodu a zatiaľ nespracúvať reálne platby |

**Poznámka k dôkazom:** napríklad Go core počíta geolokačné súradnice z ukážkového vzorca a ukladá telemetriu do pamäťového poľa procesu. Nie je to GPS hráčov ani trvalý analytický sklad. Architektonické dokumenty môžu popisovať komponenty, ktoré v aktuálnom zdrojovom strome chýbajú.

## Technologický prehľad

- **Klient:** React, JavaScript/TypeScript, Vite, Three.js, React Three Fiber, Socket.IO Client
- **Herná logika a zdieľané moduly:** TypeScript
- **Serverové komponenty:** Node.js/TypeScript a samostatný Go HTTP proces
- **Dáta a lokálne služby:** konfigurácia Compose deklaruje PostgreSQL a Redis; serverový balík uvádza Prisma
- **Ďalší experiment:** samostatná Laravel aplikácia v `laravel_app/`
- **Testy:** v repozitári sú Vitest a Playwright konfigurácie/testy; skutočný stav testov treba overiť spustením

## Lokálne spustenie

Požiadavky root `package.json`: Node.js 18+ a npm 9+. Na lokálne preskúmanie deklarovaných Compose služieb:

```bash
docker compose up --build
```

Compose obsahuje vývojové prihlasovacie údaje a publikuje porty databázy a Redis. Používaj ho iba lokálne, neotváraj tieto porty do internetu a pred nasadením nahraď všetky predvolené credentials a konfiguráciu. Predpoklady Dockerfile-ov, workspace skriptov a spúšťacích príkazov sa môžu líšiť od aktuálneho zdrojového stromu—skontroluj príslušné manifesty a logy. Root skripty odkazujú aj na `apps/*` workspaces, ktoré nemusia byť v tomto repozitári aktuálne prítomné.

## Dokumentácia a orientácia

- [`RULES.md`](RULES.md) — pravidlá hry
- [`NEW_INTEGRATION_GOALS.md`](NEW_INTEGRATION_GOALS.md) — vízia a roadmapa integrácií; stav položiek treba porovnať s kódom
- [`TARGET_VISION_BLUEPRINT.md`](TARGET_VISION_BLUEPRINT.md) — návrh cieľovej architektúry
- [`ENGINE_CONSTITUTION.md`](ENGINE_CONSTITUTION.md) — princípy a koncepty enginu
- [`BACKEND_RESEARCH_STUDY.md`](BACKEND_RESEARCH_STUDY.md) — porovnanie backend prístupov
- [`DATABASE_AND_SYNCHRONIZATION_STUDY.md`](DATABASE_AND_SYNCHRONIZATION_STUDY.md) — databázy a synchronizácia
- [`OPEN_SOURCE_ARCHITECTURE.md`](OPEN_SOURCE_ARCHITECTURE.md) — modulárna architektúra (návrh)
- [`GAME_STATUS.md`](GAME_STATUS.md) — historické poznámky o stave; over aktuálnosť
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — prispievanie do projektu

## Ako môžeš pomôcť

Vyber si jednu malú, overiteľnú úlohu a otvor issue alebo pull request:

- **Hráč/hráčka:** vyskúšaj sandbox alebo lobby a nahlás reprodukovateľný bug s krokmi a očakávaným výsledkom.
- **Frontend vývojár:** navrhni klávesnicové ovládanie, reduced-motion nastavenie alebo čitateľnejšie vysvetlenie hry.
- **Backend vývojár:** pridaj testy a validáciu hraníc medzi klientom, serverom a Go službou.
- **Game designer:** navrhni mapu, biome alebo pravidlo s jasnými príkladmi a dopadom na balans.
- **Dokumentátor:** porovnaj roadmapu so zdrojovým kódom a označ tvrdenia ako *hotové, čiastočné, plánované* alebo *neaktuálne*.

Pri bug reporte uveď prostredie, kroky na reprodukciu, očakávané a skutočné správanie a relevantné logy bez tajných údajov. Pri väčšom návrhu najprv otvor [diskusiu cez issue](https://github.com/RhodosBerger/dusan-game/issues).

## Licencia

V metadátach balíka je uvedená MIT licencia, no koreňový repozitár nemusí mať kompletný licenčný súbor. Pred redistribúciou alebo komerčným použitím over skutočnú licenciu kódu, assetov a všetkých závislostí. Nevyvodzuj licenčné práva len z roadmapy alebo návrhového dokumentu.
