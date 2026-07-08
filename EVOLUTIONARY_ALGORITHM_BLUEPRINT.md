# Architektúra: Generický Evolučný Generátor Arény (Evolutionary Scene Generator)

Tento dokument popisuje matematický návrh, fungovanie a integráciu **Genetického Algoritmu (GA)**, ktorý slúži ako generátor vyvážených a takticky hlbokých štartovacích scén (metapozícií, vlajok a pomocníkov) pre hru **Poslední kmen**.

---

## 1. Dátový model a Chromozóm (Scene Chromosome)

Algoritmus pracuje s chromozómom (`SceneChromosome`), ktorý plne definuje štruktúru scény v pamäti:

```typescript
export interface SceneChromosome {
  playerAPosition: Position;  // Pozícia Crystal Hrdinu (meta, hex)
  playerBPosition: Position;  // Pozícia Toxic Hrdinu (meta, hex)
  flagPositions: Position[];   // Lokality neutrálnych vlajok v poli
  helpers: HelperSpawn[];      // Rozmiestnené bomby, veže a pasce na začiatku
  fitnessScore?: number;
}
```

---

## 2. Viac-kriteriálna Fitness Funkcia (Fitness Evaluation)

Fitness funkcia priraďuje každému chromozómu skóre od **0 (nepoužiteľný)** po **100 (optimálny balansom a taktikou)**. Hodnotí 5 kritérií:

$$\text{Fitness} = 100 - \text{Trest}_{\text{Collision}} - \text{Trest}_{\text{Vzdialenost}} - \text{Trest}_{\text{Symetria}} - \text{Trest}_{\text{Nebezpecie}} - \text{Trest}_{\text{Vlajky}}$$

1.  **Trest za kolíziu (Collision Guard):**
    Ak sa pozície hrdinov prekrývajú, fitness klesne na 0 (neplatný stav).
2.  **Optimálny odstup (Tactical Distance):**
    Ideálny štartovací odstup medzi hrdinami je nastavený na 5 hexov. Každá odchýlka (príliš blízko = zraniteľnosť, príliš ďaleko = pasívna hra) odčíta 15 bodov z fitness.
3.  **Symetria voči makro-stredu (Fairness Symmetry):**
    Stred arény je metapozícia 4. Vzdialenosti oboch hrdinov od stredu sú porovnané. Asymetria (keď jeden štartuje v strede a druhý na okraji) odčíta 10 bodov za každý krok rozdielu.
4.  **Bezpečný Spawn (Spawn Safety):**
    Ak sa na štartovacom políčku hrdinu vygeneruje bomba alebo pasca, odčíta sa 40 bodov pre zamedzenie okamžitej eliminácie v prvom ťahu.
5.  **Dostupnosť vlajok (Flag Accessibility):**
    Vlajky sú rozdelené tak, aby vzdialenosť k nim bola pre oboch hrdinov čo najvyrovnanejšia. Každý krok nerovnováhy znižuje fitness.

---

## 3. Evolučný cyklus (GA Operators)

Evolučný cyklus prebieha po dobu **40 generácií** s populáciou **50 jedincov**:

```
[Náhodná Populácia] ---> [Fitness Evaluácia] ---> [Elitárstvo (top 2)]
         ^                                               |
         |                                               v
     [Mutácia] <--- [Kríženie] <--- [Výber Turnajom (size=3)]
```

*   **Výber (Selection):** Využíva **Turnajovú selekciu (Tournament Selection)** o veľkosti 3. Náhodne vyberie 3 chromozómy a do párenia postúpi ten s najvyššou fitness.
*   **Kríženie (Crossover):** Jednobodové kríženie s pravdepodobnosťou 80%. Vytvorí potomka skombinovaním pozícií hrdinov a pomocníkov od oboch rodičov.
*   **Mutácia (Mutation):** Náhodný posun súradníc hexu alebo zmena typu stacionárnej jednotky s pravdepodobnosťou 15% (Mutation Rate).

---

## 4. Integrácia v klientskom rozhraní

Na klientskom frontende sme pridali interaktívne spúšťanie evolúcie:
1.  V ovládacom paneli pribudlo fialové tlačidlo **"Evolučne vygenerovať scénu"**.
2.  Po kliknutí prebehne evolučný výpočet v reálnom čase (trvá menej než 2ms).
3.  Získané súradnice sa aplikujú do React stavu, čím Three.js plátno **okamžite prekreslí postavy a pomocníkov** na ich optimálne štartovacie pozície.
4.  Telemetrický log zobrazí správu o nájdenej fitness a počte rozmiestnených jednotiek.
