# Výskumná štúdia: Telemetrická Analýza a Príznakové Modelovanie (Gameplay Analytics Study)

Táto štúdia sa zaoberá zberom, modelovaním a prípravou herných telemetrických dát pre integráciu modelov strojového učenia (Machine Learning) v hre **Poslední kmen**. Obsahuje popis generátora šablónových dát, štruktúru príznakov (Features) a aplikáciu ML modelov na balansovanie hrateľnosti.

---

## 1. Dátový model hernej telemetrie (Data Structures)

Pre presné zaznamenávanie priebehu zápasov sme navrhli hierarchickú dátovú štruktúru, ktorá zachytáva makro štatistiky zápasu aj mikro detaily jednotlivých ťahov.

```
+-------------------------------------------------------------------------+
|                        MatchSessionStats (Zápas)                        |
| - sessionId (UUID)                                                      |
| - winnerFaction (crystal | toxic | druid | draw)                        |
| - avgCurrentI / avgSystemHeat (Priemerná záťaž)                         |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                   ActionEventData (Udalosť ťahu)                |   |
|   | - turnIndex (Int)                                               |   |
|   | - activeFaction / cardId (Karta)                                |   |
|   | - voltage / resistance / currentI (Fyzika)                      |   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------------------------------------------+
```

### Dátové štruktúry v kóde:
*   **`MatchSessionStats`:** Reprezentuje celý zápas (ID, zapojené frakcie, celkový počet ťahov, víťazná frakcia, priemerný prúd, celkový počet termodynamických očíst).
*   **`ActionEventData`:** Záznam jedného ťahu. Ukladá index ťahu, kto zahral akú kartu, s akým napätím ($V$) a odporom ($R$), vypočítaný prúd ($I$), spôsobenú sémantickú eróziu (damage) a vygenerované teplo.

---

## 2. Generátor šablónových dát (Telemetry Randomizer)

V súbore [GameplayTelemetryRandomizer.ts](file:///home/rhoddos_berger/Documents/Github/dusan-game/packages/shared/src/core/GameplayTelemetryRandomizer.ts) sme vytvorili plne funkčný simulátor, ktorý dokáže vygenerovať ľubovoľný počet simulovaných zápasov (Template Data):
*   **Simulácia správania:** Frakcie hrajú náhodné karty zo svojho balíčka, pričom engine automaticky prepočítava Ohmov zákon voči odporu cieľovej frakcie.
*   **Zahrnutie pravidiel:** Simulátor uplatňuje limit HP hrdinov, znižovanie integrity a nárast tepla s rizikom termodynamickej očisty.

---

## 3. Príznakové inžinierstvo pre ML (Features Extraction)

Metóda `extractAnalyticsFeatures` agreguje surové dáta z tisícok simulovaných ťahov a vytvára **príznakovú maticu (Feature Matrix)** pre jednotlivé karty (`CardPerformanceFeatures`):

| Príznak (Feature) | Výpočet | Význam pre Machine Learning |
| :--- | :--- | :--- |
| **`usageFrequency`** | $\sum \text{Použitie karty}$ | Indikuje popularitu / frekvenciu nasadenia karty. |
| **`avgCurrentGenerated`** | $\frac{\sum I}{\text{usage}}$ | Vyjadruje priemernú prieraznosť karty (prieraznosť odporu). |
| **`hitSuccessRate`** | $\frac{\sum (I \ge 1.0)}{\text{usage}}$ | Pomer úspešných zásahov. Odhaľuje slabé blokovanie nepriateľov. |
| **`heatRiskContribution`** | $\sum \text{Teplo zlyhaní}$ | Množstvo tepla vygenerovaného kvôli vysokému odporu cieľov. |

---

## 4. Aplikácia ML Modelov na Balansovanie hry

Vygenerovaná príznaková matica slúži ako vstup pre tri kľúčové ML mechanizmy:

### A. Detekcia anomálií (Anomaly Detection: Power-Creep)
*   **Cieľ:** Identifikovať karty, ktoré sú príliš silné (Overpowered) alebo nepoužiteľné (Underpowered).
*   **Algoritmus:** *Isolation Forest* alebo *Z-Score* na príznakoch `hitSuccessRate` a `avgCurrentGenerated`.
*   **Anomália:** Karta s $HitSuccessRate > 90\%$ pri nízkom odpore, alebo karta s nulovým prúdom, ktorá iba generuje teplo.

### B. Zhlukovanie (Clustering: Herné štýly)
*   **Cieľ:** Rozdeliť karty do prirodzených zhlukov pre automatické značkovanie (tagging).
*   **Algoritmus:** *K-Means clustering* na základe `avgCurrentGenerated` a `heatRiskContribution`.
*   **Zhluky (Clusters):**
    1.  *Zhluk 1 (Nízky prúd, Vysoké teplo):* Blokovacie/Defenzívne karty.
    2.  *Zhluk 2 (Vysoký prúd, Nízke teplo):* Útočné/Prierazné inštrukcie.
    3.  *Zhluk 3 (Stredné hodnoty):* Taktické/Pohybové karty.

### C. Predikcia víťaza (Win-Rate Regression)
*   **Cieľ:** Predpovedať pravdepodobnosť výhry frakcie na základe zloženia balíčka a priemernej odolnosti.
*   **Algoritmus:** *Logistická regresia* (Logistic Regression), kde vstupnými premennými sú sumárne štatistiky priemerného napätia balíčka a výstupom je pravdepodobnosť výhry.
